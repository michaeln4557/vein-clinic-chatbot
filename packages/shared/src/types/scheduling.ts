/**
 * Scheduling types for appointment booking and management.
 *
 * The scheduling system supports provisional bookings (holds) that
 * are later confirmed by clinic staff, as well as direct bookings
 * where the integration supports real-time slot reservation.
 */

/** Status of a scheduling request through the booking pipeline. */
export enum SchedulingRequestStatus {
  /** Request has been created but not yet processed. */
  Pending = 'pending',
  /** System is searching for available slots. */
  SearchingSlots = 'searching_slots',
  /** Slots have been presented to the patient. */
  SlotsPresented = 'slots_presented',
  /** Patient has selected a slot. */
  SlotSelected = 'slot_selected',
  /** Provisional hold placed on the selected slot. */
  ProvisionalHold = 'provisional_hold',
  /** Booking has been confirmed. */
  Confirmed = 'confirmed',
  /** Booking failed (no availability, system error, etc.). */
  Failed = 'failed',
  /** Patient cancelled before confirmation. */
  Cancelled = 'cancelled',
}

/** Type of appointment being scheduled. */
export enum AppointmentType {
  /** Initial consultation for new patients. */
  InitialConsultation = 'initial_consultation',
  /** Follow-up visit for existing patients. */
  FollowUp = 'follow_up',
  /** Ultrasound or diagnostic imaging appointment. */
  Ultrasound = 'ultrasound',
  /** Treatment procedure appointment. */
  Treatment = 'treatment',
}

/**
 * A request to schedule an appointment, created when the patient
 * expresses intent to book.
 */
export interface SchedulingRequest {
  /** Unique request identifier. */
  id: string;

  /** ID of the associated lead. */
  lead_id: string;

  /** ID of the conversation where booking was initiated. */
  conversation_id: string;

  /** Current status of the scheduling request. */
  status: SchedulingRequestStatus;

  /** Requested location ID. */
  location_id: string;

  /** Type of appointment requested. */
  appointment_type: AppointmentType;

  /** Patient's preferred date (ISO 8601 date format). */
  preferred_date: string | null;

  /** Patient's preferred time (HH:mm 24-hour format). */
  preferred_time: string | null;

  /** Alternative dates the patient would accept. */
  alternative_dates: string[];

  /** Slots that were presented to the patient. */
  presented_slots: AppointmentSlot[];

  /** The slot the patient selected, if any. */
  selected_slot_id: string | null;

  /** ID of the provisional booking, if one was created. */
  provisional_booking_id: string | null;

  /** Reason for failure, if status is 'failed'. */
  failure_reason: string | null;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}

/** An available appointment slot returned by the scheduling system. */
export interface AppointmentSlot {
  /** Unique slot identifier. */
  id: string;

  /** Location ID where this slot is available. */
  location_id: string;

  /** Provider / doctor name, if applicable. */
  provider_name: string | null;

  /** Appointment date in ISO 8601 date format. */
  date: string;

  /** Start time in HH:mm (24-hour) format. */
  start_time: string;

  /** End time in HH:mm (24-hour) format. */
  end_time: string;

  /** Duration in minutes. */
  duration_minutes: number;

  /** Type of appointment this slot is for. */
  appointment_type: AppointmentType;

  /** Whether the slot is still available (may change in real time). */
  available: boolean;

  /** External scheduling system ID for this slot. */
  external_slot_id: string | null;
}

/**
 * A provisional booking that holds a slot pending clinic confirmation.
 *
 * Provisional bookings expire after a configurable timeout if not
 * confirmed by clinic staff.
 */
export interface ProvisionalBooking {
  /** Unique booking identifier. */
  id: string;

  /** ID of the scheduling request that created this booking. */
  scheduling_request_id: string;

  /** ID of the selected appointment slot. */
  slot_id: string;

  /** ID of the lead/patient. */
  lead_id: string;

  /** ID of the location. */
  location_id: string;

  /** Appointment date in ISO 8601 date format. */
  date: string;

  /** Start time in HH:mm (24-hour) format. */
  start_time: string;

  /** End time in HH:mm (24-hour) format. */
  end_time: string;

  /** Type of appointment. */
  appointment_type: AppointmentType;

  /** Current booking status. */
  status: 'provisional' | 'confirmed' | 'expired' | 'cancelled';

  /** ISO 8601 timestamp when this provisional hold expires. */
  expires_at: string;

  /** Whether a confirmation message has been sent to the patient. */
  confirmation_sent: boolean;

  /** External scheduling system booking ID. */
  external_booking_id: string | null;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}
