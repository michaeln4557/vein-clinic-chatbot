/**
 * Scheduling Provider Adapter
 *
 * Abstraction layer for scheduling integrations.
 * Supports both direct API scheduling and hybrid fallback scheduling.
 *
 * Implementations can connect to:
 * - Athenahealth
 * - DrChrono
 * - Nextech
 * - ModMed
 * - Custom EHR scheduling APIs
 * - Manual/fallback scheduling queue
 */

export interface SchedulingProvider {
  readonly name: string;
  readonly type: 'direct_api' | 'hybrid' | 'manual';

  getAvailableSlots(params: SlotQuery): Promise<AvailableSlot[]>;
  createBooking(params: BookingRequest): Promise<BookingResult>;
  confirmBooking(bookingId: string): Promise<BookingResult>;
  cancelBooking(bookingId: string, reason?: string): Promise<void>;
  rescheduleBooking(bookingId: string, newSlot: SlotQuery): Promise<BookingResult>;
  getBookingStatus(bookingId: string): Promise<BookingStatus>;
}

export interface SlotQuery {
  locationId: string;
  dateFrom: string;
  dateTo: string;
  preferredTime?: string;
  appointmentType?: string;
  providerId?: string;
}

export interface AvailableSlot {
  id: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  providerId?: string;
  providerName?: string;
  appointmentType: string;
  available: boolean;
}

export interface BookingRequest {
  leadId: string;
  locationId: string;
  slotId: string;
  patientName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  insuranceProvider?: string;
  appointmentType: string;
  notes?: string;
  isProvisional: boolean;
}

export interface BookingResult {
  bookingId: string;
  status: 'provisional' | 'confirmed' | 'cancelled' | 'failed';
  confirmationNumber?: string;
  location: {
    id: string;
    name: string;
    address: string;
  };
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  provider?: {
    id: string;
    name: string;
  };
  message?: string;
}

export interface BookingStatus {
  bookingId: string;
  status: 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  insuranceVerified: boolean;
  lastUpdated: Date;
}

/**
 * Manual/Fallback Scheduling Provider
 *
 * Used when direct API integration is not available.
 * Creates scheduling requests that are processed by staff.
 */
export class ManualSchedulingProvider implements SchedulingProvider {
  readonly name = 'manual';
  readonly type = 'manual' as const;

  async getAvailableSlots(params: SlotQuery): Promise<AvailableSlot[]> {
    // For manual scheduling, return general availability based on location hours
    // Staff will confirm actual availability
    const slots: AvailableSlot[] = [];
    const startDate = new Date(params.dateFrom);
    const endDate = new Date(params.dateTo);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

      const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

      for (const time of timeSlots) {
        slots.push({
          id: `manual_${params.locationId}_${d.toISOString().split('T')[0]}_${time}`,
          locationId: params.locationId,
          date: d.toISOString().split('T')[0],
          startTime: time,
          endTime: this.addMinutes(time, 30),
          appointmentType: 'consultation',
          available: true, // Assumed available; staff confirms
        });
      }
    }

    return slots;
  }

  async createBooking(params: BookingRequest): Promise<BookingResult> {
    // Create a provisional booking that staff will confirm
    const bookingId = `BK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      bookingId,
      status: 'provisional',
      location: {
        id: params.locationId,
        name: '', // To be filled by location service
        address: '',
      },
      slot: {
        date: '',
        startTime: '',
        endTime: '',
      },
      message: 'Your appointment request has been submitted. Our team will confirm availability and finalize your appointment.',
    };
  }

  async confirmBooking(bookingId: string): Promise<BookingResult> {
    return {
      bookingId,
      status: 'confirmed',
      location: { id: '', name: '', address: '' },
      slot: { date: '', startTime: '', endTime: '' },
      message: 'Your appointment has been confirmed.',
    };
  }

  async cancelBooking(_bookingId: string, _reason?: string): Promise<void> {
    // TODO: Update booking record in database
  }

  async rescheduleBooking(bookingId: string, _newSlot: SlotQuery): Promise<BookingResult> {
    return {
      bookingId,
      status: 'provisional',
      location: { id: '', name: '', address: '' },
      slot: { date: '', startTime: '', endTime: '' },
      message: 'Your reschedule request has been submitted.',
    };
  }

  async getBookingStatus(bookingId: string): Promise<BookingStatus> {
    return {
      bookingId,
      status: 'provisional',
      insuranceVerified: false,
      lastUpdated: new Date(),
    };
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }
}

/**
 * Scheduling Provider Factory
 */
export class SchedulingProviderFactory {
  private providers: Map<string, SchedulingProvider> = new Map();

  constructor() {
    // Register default manual provider
    this.register(new ManualSchedulingProvider());
  }

  register(provider: SchedulingProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): SchedulingProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      // Fallback to manual scheduling
      return this.providers.get('manual')!;
    }
    return provider;
  }

  getProviderForLocation(locationSchedulingType: string): SchedulingProvider {
    return this.getProvider(locationSchedulingType);
  }
}

export default SchedulingProviderFactory;
