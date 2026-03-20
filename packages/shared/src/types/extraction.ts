/**
 * Field extraction types for progressive data capture from conversations.
 *
 * The extraction system pulls structured data from free-text patient
 * messages, tracks confidence levels, and manages the verification
 * lifecycle before syncing to the CRM.
 */

/** How a field value was obtained and its current trust level. */
export enum VerificationStatus {
  /** Value was directly captured from patient input. */
  Captured = 'captured',
  /** Value was inferred from context (e.g., area code -> location). */
  Inferred = 'inferred',
  /** Field has not been provided yet. */
  Missing = 'missing',
  /** Multiple conflicting values detected for this field. */
  Conflicting = 'conflicting',
  /** Value needs explicit confirmation from the patient. */
  NeedsConfirmation = 'needs_confirmation',
  /** Value has been confirmed by the patient or operator. */
  Verified = 'verified',
}

/** Names of all extractable fields aligned with the Lead model. */
export type ExtractableFieldName =
  | 'full_name'
  | 'date_of_birth'
  | 'phone_number'
  | 'email'
  | 'address'
  | 'insurance_provider'
  | 'insurance_member_id'
  | 'insurance_card_front'
  | 'insurance_card_back'
  | 'requested_location'
  | 'requested_date_raw'
  | 'requested_date_normalized'
  | 'requested_time_raw'
  | 'requested_time_normalized'
  | 'callback_preference'
  | 'preferred_contact_method';

/**
 * A single extracted field from a patient conversation.
 *
 * Tracks the raw input, normalized form, and verification state so that
 * operators and the CRM sync process can decide when data is trustworthy.
 */
export interface ExtractedField {
  /** Unique identifier for this extraction record. */
  id: string;

  /** Which lead field this extraction populates. */
  field_name: ExtractableFieldName;

  /** The exact text the patient provided (verbatim). */
  raw_value: string;

  /** System-normalized value (e.g., date parsing, phone formatting). */
  normalized_value: string | null;

  /** Operator-confirmed or patient-confirmed value. */
  verified_value: string | null;

  /** Model confidence in the extraction (0.0 - 1.0). */
  confidence: number;

  /** The surrounding text from which the value was extracted. */
  source_text: string;

  /** ID of the message that contained this data. */
  source_message_id: string;

  /** ISO 8601 timestamp of when the extraction occurred. */
  timestamp: string;

  /** Current verification lifecycle state. */
  verification_status: VerificationStatus;

  /** ID of the conversation this extraction belongs to. */
  conversation_id: string;

  /** ID of the lead this extraction is associated with. */
  lead_id: string;

  /** Previous extractions for this field that were superseded. */
  previous_values?: ExtractedField[];
}

/** Readiness state for syncing extracted data to the CRM. */
export enum CrmReadyState {
  /** Insufficient data to create a CRM record. */
  NotReady = 'not_ready',
  /** Some fields are captured but key fields are still missing. */
  PartiallyReady = 'partially_ready',
  /** Enough data to create/update the lead record. */
  ReadyForLeadSync = 'ready_for_lead_sync',
  /** All scheduling-required fields are present and verified. */
  ReadyForSchedulingSync = 'ready_for_scheduling_sync',
}

/**
 * Payload sent to the CRM when extracted fields are ready to sync.
 *
 * Contains all verified field values along with metadata about the
 * extraction quality and source conversation.
 */
export interface CrmSyncPayload {
  /** ID of the lead to create or update. */
  lead_id: string;

  /** Current readiness state. */
  ready_state: CrmReadyState;

  /** Map of field names to their best-available values. */
  fields: Record<ExtractableFieldName, {
    /** The value to sync (verified > normalized > raw). */
    value: string | null;
    /** Confidence in this value. */
    confidence: number;
    /** Verification status. */
    verification_status: VerificationStatus;
  }>;

  /** ID of the source conversation. */
  conversation_id: string;

  /** ISO 8601 timestamp of the sync attempt. */
  sync_timestamp: string;

  /** List of fields that still need to be collected. */
  missing_fields: ExtractableFieldName[];

  /** List of fields with conflicting values needing resolution. */
  conflicting_fields: ExtractableFieldName[];
}
