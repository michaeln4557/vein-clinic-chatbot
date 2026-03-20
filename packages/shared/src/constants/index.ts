/**
 * Shared constants for the Vein Clinic chatbot platform.
 *
 * All enumerations and magic values used across the system are
 * centralized here as const arrays and literal types.
 */

// ---------------------------------------------------------------------------
// Playbook names
// ---------------------------------------------------------------------------

/** All canonical playbook names in the system. */
export const PLAYBOOK_NAMES = [
  'new_patient_intake',
  'insurance_collection',
  'appointment_scheduling',
  'faq',
  'follow_up',
  'reschedule',
  'cancellation',
  'human_handoff',
  'insurance_objection',
  'clinical_safety',
  'after_hours',
  'appointment_confirmation',
  'callback_request',
] as const;

export type PlaybookNameConst = (typeof PLAYBOOK_NAMES)[number];

// ---------------------------------------------------------------------------
// Lead & booking statuses
// ---------------------------------------------------------------------------

/** All lead lifecycle statuses. */
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'booking_started',
  'booked_provisional',
  'booked_confirmed',
  'lost',
  'duplicate',
] as const;

export type LeadStatusConst = (typeof LEAD_STATUSES)[number];

/** All booking sub-statuses. */
export const BOOKING_STATUSES = [
  'none',
  'scheduling_requested',
  'provisional',
  'confirmed',
  'cancelled',
  'rescheduled',
] as const;

export type BookingStatusConst = (typeof BOOKING_STATUSES)[number];

// ---------------------------------------------------------------------------
// Extractable field names
// ---------------------------------------------------------------------------

/** All field names that the extraction engine can capture. */
export const EXTRACTABLE_FIELD_NAMES = [
  'full_name',
  'date_of_birth',
  'phone_number',
  'email',
  'address',
  'insurance_provider',
  'insurance_member_id',
  'insurance_card_front',
  'insurance_card_back',
  'requested_location',
  'requested_date_raw',
  'requested_date_normalized',
  'requested_time_raw',
  'requested_time_normalized',
  'callback_preference',
  'preferred_contact_method',
] as const;

export type ExtractableFieldNameConst = (typeof EXTRACTABLE_FIELD_NAMES)[number];

/** Fields required for CRM lead sync. */
export const REQUIRED_CRM_FIELDS = [
  'full_name',
  'phone_number',
  'insurance_provider',
] as const;

/** Fields required for scheduling sync. */
export const REQUIRED_SCHEDULING_FIELDS = [
  'full_name',
  'phone_number',
  'insurance_provider',
  'requested_location',
  'requested_date_normalized',
] as const;

/** Optional fields that improve CRM readiness. */
export const OPTIONAL_CRM_FIELDS = [
  'email',
  'date_of_birth',
  'address',
  'insurance_member_id',
  'requested_time_normalized',
  'callback_preference',
  'preferred_contact_method',
] as const;

// ---------------------------------------------------------------------------
// Verification statuses
// ---------------------------------------------------------------------------

/** All verification lifecycle states. */
export const VERIFICATION_STATUSES = [
  'captured',
  'inferred',
  'missing',
  'conflicting',
  'needs_confirmation',
  'verified',
] as const;

export type VerificationStatusConst = (typeof VERIFICATION_STATUSES)[number];

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

/** All supported communication channels. */
export const CHANNELS = ['sms', 'web_chat'] as const;

export type ChannelConst = (typeof CHANNELS)[number];

// ---------------------------------------------------------------------------
// Participant roles
// ---------------------------------------------------------------------------

/** All participant roles in a conversation. */
export const PARTICIPANT_ROLES = ['patient', 'bot', 'agent'] as const;

export type ParticipantRoleConst = (typeof PARTICIPANT_ROLES)[number];

// ---------------------------------------------------------------------------
// Escalation reasons
// ---------------------------------------------------------------------------

/** All reasons that can trigger an escalation. */
export const ESCALATION_REASONS = [
  'patient_request',
  'negative_sentiment',
  'clinical_complaint',
  'insurance_complexity',
  'scheduling_conflict',
  'low_confidence',
  'conversation_timeout',
  'repeated_extraction_failure',
  'patient_dissatisfaction',
  'compliance_concern',
  'billing_dispute',
  'medical_emergency',
  'duplicate_resolution',
  'policy_triggered',
  'system_error',
] as const;

export type EscalationReasonConst = (typeof ESCALATION_REASONS)[number];

// ---------------------------------------------------------------------------
// Roles & permissions
// ---------------------------------------------------------------------------

/** All system roles. */
export const ROLES = [
  'frontline_operator',
  'manager',
  'admin',
  'engineering',
  'compliance_reviewer',
] as const;

export type RoleConst = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Slider preset names
// ---------------------------------------------------------------------------

/** All slider preset names. */
export const SLIDER_PRESET_NAMES = [
  'Concierge',
  'Balanced',
  'Efficiency',
  'Recovery_Mode',
  'Insurance_Sensitive',
] as const;

export type SliderPresetNameConst = (typeof SLIDER_PRESET_NAMES)[number];

// ---------------------------------------------------------------------------
// Feedback action types
// ---------------------------------------------------------------------------

/** All operator feedback action types. */
export const FEEDBACK_ACTION_TYPES = [
  'approve',
  'edit_response',
  'flag_response',
  'suggest_alternative',
  'add_approved_phrase',
  'add_prohibited_phrase',
  'request_playbook_change',
  'report_policy_violation',
  'override_decision',
  'adjust_slider',
  'rate_response',
  'escalate_to_manager',
] as const;

export type FeedbackActionTypeConst = (typeof FEEDBACK_ACTION_TYPES)[number];

/** All feedback scopes. */
export const FEEDBACK_SCOPES = [
  'one_time_fix',
  'playbook_improvement',
  'phrase_library',
  'policy_issue',
] as const;

export type FeedbackScopeConst = (typeof FEEDBACK_SCOPES)[number];

// ---------------------------------------------------------------------------
// Policy categories & severities
// ---------------------------------------------------------------------------

/** All policy rule categories. */
export const POLICY_CATEGORIES = [
  'insurance',
  'clinical_safety',
  'compliance',
] as const;

export type PolicyCategoryConst = (typeof POLICY_CATEGORIES)[number];

/** All policy severity levels. */
export const POLICY_SEVERITIES = ['block', 'warn', 'log'] as const;

export type PolicySeverityConst = (typeof POLICY_SEVERITIES)[number];

// ---------------------------------------------------------------------------
// Playbook statuses
// ---------------------------------------------------------------------------

/** All playbook lifecycle statuses. */
export const PLAYBOOK_STATUSES = [
  'draft',
  'review',
  'published',
  'archived',
] as const;

export type PlaybookStatusConst = (typeof PLAYBOOK_STATUSES)[number];

// ---------------------------------------------------------------------------
// System configuration defaults
// ---------------------------------------------------------------------------

/** Default slider settings for the Balanced preset. */
export const DEFAULT_SLIDER_SETTINGS = {
  warmth: 60,
  formality: 50,
  empathy: 60,
  urgency: 40,
  detail: 50,
} as const;

/** Provisional booking expiry time in minutes. */
export const PROVISIONAL_BOOKING_TTL_MINUTES = 15;

/** Maximum messages before suggesting escalation to a human. */
export const MAX_MESSAGES_BEFORE_ESCALATION_HINT = 20;

/** Threshold for duplicate lead detection (0-1). */
export const DUPLICATE_MATCH_THRESHOLD = 0.75;

/** Minimum confidence score for bot responses before fallback. */
export const MIN_CONFIDENCE_THRESHOLD = 0.6;

/** Maximum number of extraction retries before escalation. */
export const MAX_EXTRACTION_RETRIES = 3;

/** Maximum conversation idle time in minutes before timeout. */
export const CONVERSATION_IDLE_TIMEOUT_MINUTES = 30;

/** Maximum file size for insurance card uploads in bytes (10 MB). */
export const MAX_INSURANCE_CARD_FILE_SIZE = 10 * 1024 * 1024;

/** Accepted MIME types for insurance card uploads. */
export const ACCEPTED_CARD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
] as const;
