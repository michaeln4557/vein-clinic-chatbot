/**
 * Lead and Patient types for the Vein Clinic CRM pipeline.
 *
 * A Lead represents an inbound inquiry that may or may not convert into a
 * booked patient. A Patient is the clinical identity created once a lead
 * is confirmed and scheduled.
 */

/** Lifecycle status of a lead through the sales/booking funnel. */
export enum LeadStatus {
  /** Brand-new inquiry, not yet contacted. */
  New = 'new',
  /** Initial outreach has been made. */
  Contacted = 'contacted',
  /** Lead has been qualified (insurance verified, intent confirmed). */
  Qualified = 'qualified',
  /** Booking flow has started but is not yet complete. */
  BookingStarted = 'booking_started',
  /** A provisional (unconfirmed) appointment has been created. */
  BookedProvisional = 'booked_provisional',
  /** Appointment is fully confirmed by the clinic. */
  BookedConfirmed = 'booked_confirmed',
  /** Lead was lost (no-show, declined, unreachable). */
  Lost = 'lost',
  /** Duplicate of another lead record. */
  Duplicate = 'duplicate',
}

/** Booking sub-status that tracks the scheduling lifecycle independently. */
export enum BookingStatus {
  /** No booking activity yet. */
  None = 'none',
  /** Patient has requested scheduling but no slot selected. */
  SchedulingRequested = 'scheduling_requested',
  /** Provisional hold placed on a slot; awaiting clinic confirmation. */
  Provisional = 'provisional',
  /** Appointment fully confirmed. */
  Confirmed = 'confirmed',
  /** Appointment was cancelled. */
  Cancelled = 'cancelled',
  /** Appointment was rescheduled to a new slot. */
  Rescheduled = 'rescheduled',
}

/** How the patient prefers to be contacted for follow-ups. */
export enum PreferredContactMethod {
  Phone = 'phone',
  SMS = 'sms',
  Email = 'email',
}

/** When the patient prefers to receive callbacks. */
export enum CallbackPreference {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
  Anytime = 'anytime',
  ASAP = 'asap',
}

/**
 * Core lead record representing an inbound patient inquiry.
 *
 * Fields are nullable because data is progressively extracted from
 * conversation; not all fields are available at intake time.
 */
export interface Lead {
  /** Unique identifier for this lead. */
  id: string;

  /** Patient's full legal name as provided. */
  full_name: string | null;

  /** Date of birth in ISO 8601 date format (YYYY-MM-DD). */
  date_of_birth: string | null;

  /** Phone number in E.164 format. */
  phone_number: string | null;

  /** Email address. */
  email: string | null;

  /** Full street address including city, state, ZIP. */
  address: string | null;

  /** Name of the patient's insurance provider / payer. */
  insurance_provider: string | null;

  /** Member ID from the insurance card. */
  insurance_member_id: string | null;

  /** URL or storage key for the front of the insurance card image. */
  insurance_card_front: string | null;

  /** URL or storage key for the back of the insurance card image. */
  insurance_card_back: string | null;

  /** Clinic location the patient wants to visit. */
  requested_location: string | null;

  /** Raw date text as the patient expressed it (e.g., "next Tuesday"). */
  requested_date_raw: string | null;

  /** Normalized appointment date in ISO 8601 format (YYYY-MM-DD). */
  requested_date_normalized: string | null;

  /** Raw time text as the patient expressed it (e.g., "morning", "2pm"). */
  requested_time_raw: string | null;

  /** Normalized appointment time in HH:mm (24-hour) format. */
  requested_time_normalized: string | null;

  /** When the patient prefers to receive callbacks. */
  callback_preference: CallbackPreference | null;

  /** How the patient prefers to be contacted. */
  preferred_contact_method: PreferredContactMethod | null;

  /** Current lifecycle status of the lead. */
  lead_status: LeadStatus;

  /** Current booking sub-status. */
  booking_status: BookingStatus;

  /** ID of the conversation that originated this lead. */
  source_conversation_id: string | null;

  /** Channel through which the lead arrived. */
  source_channel: string | null;

  /** ISO 8601 timestamp of lead creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;

  /** ID of the CRM record if synced externally. */
  external_crm_id: string | null;

  /** Free-form notes added by operators or the system. */
  notes: string | null;
}

/**
 * Patient record created once a lead is confirmed.
 *
 * Extends Lead data with clinical and scheduling identifiers.
 */
export interface Patient {
  /** Unique patient identifier. */
  id: string;

  /** Reference back to the originating lead. */
  lead_id: string;

  /** Patient's full legal name (confirmed). */
  full_name: string;

  /** Date of birth in ISO 8601 date format. */
  date_of_birth: string;

  /** Phone number in E.164 format. */
  phone_number: string;

  /** Email address. */
  email: string | null;

  /** Full street address. */
  address: string | null;

  /** Confirmed insurance provider. */
  insurance_provider: string | null;

  /** Confirmed insurance member ID. */
  insurance_member_id: string | null;

  /** URL or key for front of insurance card. */
  insurance_card_front: string | null;

  /** URL or key for back of insurance card. */
  insurance_card_back: string | null;

  /** Assigned clinic location ID. */
  location_id: string | null;

  /** External EMR / practice management system patient ID. */
  external_patient_id: string | null;

  /** ISO 8601 timestamp of patient record creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}
