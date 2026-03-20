/**
 * Clinic location types for multi-site scheduling and routing.
 *
 * Each location has its own hours, services, insurance notes, and
 * integration configuration for the scheduling system.
 */

/** Type of scheduling system integration at a location. */
export enum SchedulingIntegrationType {
  /** Direct API integration with the clinic's scheduling system. */
  API = 'api',
  /** Manual scheduling via callback to clinic staff. */
  Manual = 'manual',
  /** Integration through an iframe or embedded widget. */
  Widget = 'widget',
  /** No scheduling integration; booking handled externally. */
  None = 'none',
}

/** A single day's operating hours. */
export interface DayHours {
  /** Whether the location is open on this day. */
  open: boolean;
  /** Opening time in HH:mm (24-hour) format. */
  open_time?: string;
  /** Closing time in HH:mm (24-hour) format. */
  close_time?: string;
}

/** Weekly operating hours for a location. */
export interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

/** A scheduled closure (holiday, maintenance, etc.). */
export interface HolidayClosure {
  /** Name or reason for the closure. */
  name: string;
  /** Start date of the closure in ISO 8601 date format. */
  start_date: string;
  /** End date of the closure in ISO 8601 date format (inclusive). */
  end_date: string;
  /** Whether patients should be directed to a nearby location. */
  redirect_to_nearby: boolean;
}

/**
 * A clinic location with all operational details needed for
 * patient routing, scheduling, and insurance guidance.
 */
export interface Location {
  /** Unique location identifier. */
  location_id: string;

  /** Display name shown to patients (e.g., "Downtown Manhattan"). */
  display_name: string;

  /** Full street address. */
  address: string;

  /** US state abbreviation (e.g., "NY", "NJ"). */
  state: string;

  /** ZIP / postal code. */
  zip: string;

  /** Location phone number in E.164 format. */
  phone: string;

  /** List of vein treatment services available at this location. */
  services_offered: string[];

  /** Weekly operating hours. */
  hours: WeeklyHours;

  /** Scheduled closures (holidays, maintenance, etc.). */
  holiday_closures: HolidayClosure[];

  /** How this location integrates with the scheduling system. */
  scheduling_integration_type: SchedulingIntegrationType;

  /** Scheduling system API endpoint or configuration key. */
  scheduling_endpoint?: string;

  /** IDs of nearby locations to suggest as fallbacks. */
  fallback_nearby_locations: string[];

  /** State-specific insurance notes (e.g., Medicaid coverage rules). */
  state_insurance_notes: string;

  /** Whether this location is currently active and accepting patients. */
  active: boolean;

  /** Geographic coordinates for distance calculations. */
  latitude?: number;

  /** Geographic coordinates for distance calculations. */
  longitude?: number;

  /** Timezone identifier (e.g., "America/New_York"). */
  timezone: string;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}
