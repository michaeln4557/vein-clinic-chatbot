import {
  Location,
  SchedulingIntegrationType,
  WeeklyHours,
} from '../../shared/src/types/location';
import { logger } from '../index';

/**
 * LocationService manages clinic location data, configuration, and
 * geographic lookups. Provides location-specific settings for
 * scheduling integration, insurance notes, and nearby fallbacks.
 */
export class LocationService {
  // In-memory store - TODO: Replace with Prisma
  private locations: Map<string, Location> = new Map();

  constructor() {
    this.seedDefaults();
  }

  /**
   * Finds a location by ZIP code.
   */
  async getLocationByZip(zip: string): Promise<Location | null> {
    for (const location of this.locations.values()) {
      if (location.zip === zip) return location;
    }
    // TODO: Implement geolocation lookup for nearest match
    const allActive = await this.getAllLocations();
    return allActive.length > 0 ? allActive[0] : null;
  }

  /**
   * Returns nearby locations based on the fallback list or proximity.
   */
  async getNearbyLocations(locationId: string): Promise<Location[]> {
    const location = this.locations.get(locationId);
    if (!location) return [];

    // Use configured fallback locations
    const nearby: Location[] = [];
    for (const fallbackId of location.fallback_nearby_locations) {
      const fallback = this.locations.get(fallbackId);
      if (fallback && fallback.active) {
        nearby.push(fallback);
      }
    }

    // TODO: Sort by geographic distance using coordinates
    return nearby;
  }

  /**
   * Returns the full configuration for a location.
   */
  async getLocationConfig(locationId: string): Promise<Location | null> {
    return this.locations.get(locationId) || null;
  }

  /**
   * Updates a location's information.
   */
  async updateLocation(locationId: string, data: Partial<Location>): Promise<Location> {
    const location = this.locations.get(locationId);
    if (!location) throw new Error(`Location not found: ${locationId}`);

    Object.assign(location, data, { updated_at: new Date().toISOString() });
    this.locations.set(locationId, location);

    logger.info('Location updated', { locationId, updatedFields: Object.keys(data) });
    return location;
  }

  /**
   * Returns all active clinic locations.
   */
  async getAllLocations(): Promise<Location[]> {
    const active: Location[] = [];
    for (const location of this.locations.values()) {
      if (location.active) active.push(location);
    }
    return active;
  }

  // ─── Seed Data ────────────────────────────────────────────────────────────

  private seedDefaults(): void {
    const now = new Date().toISOString();

    const closedDay = { open: false };
    const standardDay = (openTime: string, closeTime: string) => ({
      open: true, open_time: openTime, close_time: closeTime,
    });

    const locations: Location[] = [
      {
        location_id: 'loc-downtown',
        display_name: 'Vein Care Center - Downtown',
        address: '100 Main Street, Suite 200, Springfield, IL 62701',
        state: 'IL',
        zip: '62701',
        phone: '+12175550100',
        services_offered: ['Sclerotherapy', 'Endovenous Laser', 'VenaSeal', 'Ultrasound'],
        hours: {
          monday: standardDay('08:00', '17:00'),
          tuesday: standardDay('08:00', '17:00'),
          wednesday: standardDay('08:00', '17:00'),
          thursday: standardDay('08:00', '17:00'),
          friday: standardDay('08:00', '15:00'),
          saturday: closedDay,
          sunday: closedDay,
        },
        holiday_closures: [],
        scheduling_integration_type: SchedulingIntegrationType.API,
        scheduling_endpoint: 'https://scheduling.veinclinic.com/api/v1',
        fallback_nearby_locations: ['loc-westside', 'loc-north'],
        state_insurance_notes: 'IL Medicaid covers medically necessary vein treatments with prior authorization.',
        active: true,
        latitude: 39.7817,
        longitude: -89.6501,
        timezone: 'America/Chicago',
        created_at: now,
        updated_at: now,
      },
      {
        location_id: 'loc-westside',
        display_name: 'Vein Care Center - Westside',
        address: '500 West Boulevard, Springfield, IL 62704',
        state: 'IL',
        zip: '62704',
        phone: '+12175550200',
        services_offered: ['Sclerotherapy', 'Endovenous Laser', 'Ultrasound'],
        hours: {
          monday: standardDay('09:00', '18:00'),
          tuesday: standardDay('09:00', '18:00'),
          wednesday: standardDay('09:00', '18:00'),
          thursday: standardDay('09:00', '18:00'),
          friday: standardDay('09:00', '16:00'),
          saturday: standardDay('09:00', '13:00'),
          sunday: closedDay,
        },
        holiday_closures: [],
        scheduling_integration_type: SchedulingIntegrationType.API,
        fallback_nearby_locations: ['loc-downtown', 'loc-north'],
        state_insurance_notes: 'IL Medicaid covers medically necessary vein treatments with prior authorization.',
        active: true,
        latitude: 39.7900,
        longitude: -89.6800,
        timezone: 'America/Chicago',
        created_at: now,
        updated_at: now,
      },
      {
        location_id: 'loc-north',
        display_name: 'Vein Care Center - North',
        address: '800 North Avenue, Decatur, IL 62521',
        state: 'IL',
        zip: '62521',
        phone: '+12175550300',
        services_offered: ['Sclerotherapy', 'Ultrasound'],
        hours: {
          monday: closedDay,
          tuesday: standardDay('09:00', '17:00'),
          wednesday: closedDay,
          thursday: standardDay('09:00', '17:00'),
          friday: closedDay,
          saturday: closedDay,
          sunday: closedDay,
        },
        holiday_closures: [],
        scheduling_integration_type: SchedulingIntegrationType.Manual,
        fallback_nearby_locations: ['loc-downtown', 'loc-westside'],
        state_insurance_notes: 'IL Medicaid covers medically necessary vein treatments with prior authorization.',
        active: true,
        latitude: 39.8403,
        longitude: -88.9548,
        timezone: 'America/Chicago',
        created_at: now,
        updated_at: now,
      },
    ];

    for (const loc of locations) {
      this.locations.set(loc.location_id, loc);
    }
  }
}
