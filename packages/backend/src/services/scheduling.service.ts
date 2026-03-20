import { v4 as uuid } from 'uuid';
import {
  SchedulingRequest,
  SchedulingRequestStatus,
  AppointmentSlot,
  AppointmentType,
  ProvisionalBooking,
} from '../../shared/src/types/scheduling';
import type { Location } from '../../shared/src/types/location';
import { PROVISIONAL_BOOKING_TTL_MINUTES } from '../../shared/src/constants';
import { LocationService } from './location.service';
import { AuditService } from './audit.service';
import { logger } from '../index';

/**
 * SchedulingService manages appointment slot availability, provisional bookings,
 * confirmations, and cancellations. Integrates with the location service
 * for multi-site scheduling.
 */
export class SchedulingService {
  // In-memory stores - TODO: Replace with Prisma + external scheduling API
  private slots: Map<string, AppointmentSlot> = new Map();
  private bookings: Map<string, ProvisionalBooking> = new Map();
  private requests: Map<string, SchedulingRequest> = new Map();

  constructor(
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
  ) {
    this.seedSlots();
  }

  /**
   * Returns available time slots for a given location within a date range.
   */
  async getAvailableSlots(
    locationId: string,
    dateRange: { start: string; end: string },
    appointmentType: AppointmentType = AppointmentType.InitialConsultation,
  ): Promise<AppointmentSlot[]> {
    // TODO: Query from external scheduling API
    const available: AppointmentSlot[] = [];

    for (const slot of this.slots.values()) {
      if (
        slot.location_id === locationId &&
        slot.available &&
        slot.appointment_type === appointmentType &&
        slot.date >= dateRange.start &&
        slot.date <= dateRange.end
      ) {
        // Verify no active booking on this slot
        if (!this.isSlotBooked(slot.id)) {
          available.push(slot);
        }
      }
    }

    logger.debug('Available slots retrieved', {
      locationId,
      dateRange,
      count: available.length,
    });

    return available.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.start_time.localeCompare(b.start_time);
    });
  }

  /**
   * Suggests alternative slots when the preferred date is unavailable.
   */
  async suggestAlternatives(
    locationId: string,
    preferredDate: string,
  ): Promise<{
    sameLocation: AppointmentSlot[];
    nearbyLocations: Array<{ location: Location; slots: AppointmentSlot[] }>;
  }> {
    // Look +/- 3 days from preferred date at same location
    const start = this.offsetDate(preferredDate, -3);
    const end = this.offsetDate(preferredDate, 3);

    const sameLocation = await this.getAvailableSlots(locationId, { start, end });

    // Check nearby locations
    const nearbyLocations: Array<{ location: Location; slots: AppointmentSlot[] }> = [];
    const nearby = await this.locationService.getNearbyLocations(locationId);

    for (const location of nearby) {
      const slots = await this.getAvailableSlots(location.location_id, { start, end });
      if (slots.length > 0) {
        nearbyLocations.push({ location, slots: slots.slice(0, 3) });
      }
    }

    return { sameLocation, nearbyLocations };
  }

  /**
   * Creates a provisional booking that expires if not confirmed.
   */
  async createProvisionalBooking(
    leadId: string,
    slot: { slotId: string; locationId: string },
  ): Promise<ProvisionalBooking> {
    const timeSlot = this.slots.get(slot.slotId);
    if (!timeSlot) throw new Error(`Slot not found: ${slot.slotId}`);
    if (this.isSlotBooked(slot.slotId)) throw new Error(`Slot ${slot.slotId} is no longer available`);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PROVISIONAL_BOOKING_TTL_MINUTES * 60 * 1000);

    const booking: ProvisionalBooking = {
      id: uuid(),
      scheduling_request_id: '', // TODO: link to request
      slot_id: slot.slotId,
      lead_id: leadId,
      location_id: slot.locationId,
      date: timeSlot.date,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      appointment_type: timeSlot.appointment_type,
      status: 'provisional',
      expires_at: expiresAt.toISOString(),
      confirmation_sent: false,
      external_booking_id: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // TODO: Persist to Prisma + set up expiry job via Bull queue
    this.bookings.set(booking.id, booking);

    await this.auditService.log({
      entityType: 'scheduling_request',
      entityId: booking.id,
      action: 'provisional_created',
      who: 'system:scheduling',
      details: { leadId, slotId: slot.slotId, expiresAt: booking.expires_at },
    });

    logger.info('Provisional booking created', { bookingId: booking.id, slotId: slot.slotId });
    return booking;
  }

  /**
   * Confirms a provisional booking.
   */
  async confirmBooking(bookingId: string): Promise<ProvisionalBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error(`Booking not found: ${bookingId}`);
    if (booking.status !== 'provisional') throw new Error(`Booking is not provisional (status: ${booking.status})`);

    if (new Date() > new Date(booking.expires_at)) {
      booking.status = 'expired';
      booking.updated_at = new Date().toISOString();
      this.bookings.set(bookingId, booking);
      throw new Error('Provisional booking has expired. Please create a new booking.');
    }

    booking.status = 'confirmed';
    booking.updated_at = new Date().toISOString();
    this.bookings.set(bookingId, booking);

    await this.auditService.log({
      entityType: 'scheduling_request',
      entityId: bookingId,
      action: 'confirmed',
      who: 'system:scheduling',
      details: {},
    });

    logger.info('Booking confirmed', { bookingId });
    return booking;
  }

  /**
   * Cancels a booking with a reason.
   */
  async cancelBooking(bookingId: string, reason: string = 'Patient cancelled'): Promise<ProvisionalBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error(`Booking not found: ${bookingId}`);
    if (booking.status === 'cancelled') throw new Error('Booking is already cancelled');

    booking.status = 'cancelled';
    booking.updated_at = new Date().toISOString();
    this.bookings.set(bookingId, booking);

    await this.auditService.log({
      entityType: 'scheduling_request',
      entityId: bookingId,
      action: 'cancelled',
      who: 'system:scheduling',
      details: { reason },
    });

    logger.info('Booking cancelled', { bookingId, reason });
    return booking;
  }

  /**
   * Suggests nearby locations with potentially better availability.
   */
  async suggestNearbyLocations(locationId: string): Promise<Location[]> {
    return this.locationService.getNearbyLocations(locationId);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private isSlotBooked(slotId: string): boolean {
    for (const booking of this.bookings.values()) {
      if (booking.slot_id === slotId && (booking.status === 'provisional' || booking.status === 'confirmed')) {
        if (booking.status === 'provisional' && new Date() > new Date(booking.expires_at)) {
          continue; // Expired provisional
        }
        return true;
      }
    }
    return false;
  }

  private offsetDate(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private seedSlots(): void {
    const today = new Date();
    const locations = ['loc-downtown', 'loc-westside', 'loc-north'];
    const providers = ['Dr. Smith', 'Dr. Jones', 'Dr. Patel'];

    for (let day = 1; day <= 7; day++) {
      for (const locationId of locations) {
        for (let hour = 9; hour <= 16; hour++) {
          const date = new Date(today);
          date.setDate(date.getDate() + day);
          const dateStr = date.toISOString().split('T')[0];

          const slot: AppointmentSlot = {
            id: uuid(),
            location_id: locationId,
            provider_name: providers[Math.floor(Math.random() * providers.length)],
            date: dateStr,
            start_time: `${String(hour).padStart(2, '0')}:00`,
            end_time: `${String(hour).padStart(2, '0')}:30`,
            duration_minutes: 30,
            appointment_type: AppointmentType.InitialConsultation,
            available: Math.random() > 0.3,
            external_slot_id: null,
          };
          this.slots.set(slot.id, slot);
        }
      }
    }
  }
}
