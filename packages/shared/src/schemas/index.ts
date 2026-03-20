/**
 * Zod validation schemas for key domain types.
 *
 * These schemas provide runtime validation for API inputs,
 * configuration changes, and data integrity checks. They mirror
 * the TypeScript types but add runtime enforcement.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

/** ISO 8601 date string (YYYY-MM-DD). */
export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Must be a valid ISO 8601 date (YYYY-MM-DD)'
);

/** ISO 8601 datetime string. */
export const isoDateTimeSchema = z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' });

/** E.164 phone number format. */
export const e164PhoneSchema = z.string().regex(
  /^\+[1-9]\d{1,14}$/,
  'Must be a valid E.164 phone number'
);

/** 24-hour time format HH:mm. */
export const time24Schema = z.string().regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  'Must be in HH:mm 24-hour format'
);

/** Confidence score between 0 and 1. */
export const confidenceSchema = z.number().min(0).max(1);

/** Slider value between 0 and 100. */
export const sliderValueSchema = z.number().int().min(0).max(100);

// ---------------------------------------------------------------------------
// Lead schemas
// ---------------------------------------------------------------------------

export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'booking_started',
  'booked_provisional',
  'booked_confirmed',
  'lost',
  'duplicate',
]);

export const bookingStatusSchema = z.enum([
  'none',
  'scheduling_requested',
  'provisional',
  'confirmed',
  'cancelled',
  'rescheduled',
]);

export const callbackPreferenceSchema = z.enum([
  'morning',
  'afternoon',
  'evening',
  'anytime',
  'asap',
]);

export const preferredContactMethodSchema = z.enum([
  'phone',
  'sms',
  'email',
]);

export const leadSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().nullable(),
  date_of_birth: isoDateSchema.nullable(),
  phone_number: e164PhoneSchema.nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  insurance_provider: z.string().nullable(),
  insurance_member_id: z.string().nullable(),
  insurance_card_front: z.string().nullable(),
  insurance_card_back: z.string().nullable(),
  requested_location: z.string().nullable(),
  requested_date_raw: z.string().nullable(),
  requested_date_normalized: isoDateSchema.nullable(),
  requested_time_raw: z.string().nullable(),
  requested_time_normalized: time24Schema.nullable(),
  callback_preference: callbackPreferenceSchema.nullable(),
  preferred_contact_method: preferredContactMethodSchema.nullable(),
  lead_status: leadStatusSchema,
  booking_status: bookingStatusSchema,
  source_conversation_id: z.string().nullable(),
  source_channel: z.string().nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  external_crm_id: z.string().nullable(),
  notes: z.string().nullable(),
});

export const updateLeadSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone_number: e164PhoneSchema.optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_member_id: z.string().optional(),
  requested_location: z.string().optional(),
  lead_status: leadStatusSchema.optional(),
  booking_status: bookingStatusSchema.optional(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Extraction schemas
// ---------------------------------------------------------------------------

export const verificationStatusSchema = z.enum([
  'captured',
  'inferred',
  'missing',
  'conflicting',
  'needs_confirmation',
  'verified',
]);

export const extractableFieldNameSchema = z.enum([
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
]);

export const extractedFieldSchema = z.object({
  id: z.string().min(1),
  field_name: extractableFieldNameSchema,
  raw_value: z.string(),
  normalized_value: z.string().nullable(),
  verified_value: z.string().nullable(),
  confidence: confidenceSchema,
  source_text: z.string(),
  source_message_id: z.string().min(1),
  timestamp: isoDateTimeSchema,
  verification_status: verificationStatusSchema,
  conversation_id: z.string().min(1),
  lead_id: z.string().min(1),
});

export const crmReadyStateSchema = z.enum([
  'not_ready',
  'partially_ready',
  'ready_for_lead_sync',
  'ready_for_scheduling_sync',
]);

// ---------------------------------------------------------------------------
// Playbook schemas
// ---------------------------------------------------------------------------

export const playbookNameSchema = z.enum([
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
]);

export const playbookStatusSchema = z.enum([
  'draft',
  'review',
  'published',
  'archived',
]);

export const toneSettingsSchema = z.object({
  warmth: sliderValueSchema,
  formality: sliderValueSchema,
  empathy: sliderValueSchema,
  urgency: sliderValueSchema,
  detail: sliderValueSchema,
});

export const triggerConditionSchema = z.object({
  type: z.enum(['intent', 'keyword', 'status_change', 'time_based', 'fallback', 'manual']),
  value: z.string(),
  confidence_threshold: confidenceSchema.optional(),
  priority: z.number().int().optional(),
});

export const stepTransitionSchema = z.object({
  condition: z.enum(['success', 'failure', 'timeout', 'escalation', 'skip', 'custom']),
  custom_expression: z.string().optional(),
  target_step_id: z.string().min(1),
});

export const playbookStepSchema = z.object({
  step_id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  prompt_template: z.string(),
  extraction_targets: z.array(z.string()).optional(),
  transitions: z.array(stepTransitionSchema),
  max_retries: z.number().int().min(0).optional(),
  requires_confirmation: z.boolean().optional(),
});

export const escalationRuleSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  condition: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.enum(['immediate_transfer', 'queue', 'callback']),
});

export const bookingTimingSchema = z.object({
  min_messages_before_booking: z.number().int().min(0).optional(),
  proactive_booking: z.boolean(),
  slot_presentation_delay: z.number().int().min(0).optional(),
});

export const playbookExampleSchema = z.object({
  scenario: z.string(),
  turns: z.array(z.object({
    role: z.enum(['patient', 'bot']),
    content: z.string(),
  })),
});

export const playbookSchema = z.object({
  id: z.string().min(1),
  name: playbookNameSchema,
  display_name: z.string().min(1),
  description: z.string(),
  version: z.number().int().min(1),
  status: playbookStatusSchema,
  trigger_conditions: z.array(triggerConditionSchema),
  response_goals: z.array(z.string()),
  steps: z.array(playbookStepSchema),
  allowed_language: z.array(z.string()),
  prohibited_language: z.array(z.string()),
  tone_settings: toneSettingsSchema,
  booking_timing: bookingTimingSchema,
  escalation_rules: z.array(escalationRuleSchema),
  examples: z.array(playbookExampleSchema),
  operator_settings: z.record(z.unknown()),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  last_modified_by: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Slider schemas
// ---------------------------------------------------------------------------

export const runtimeMappingSchema = z.object({
  parameter_name: z.string().min(1),
  parameter_min: z.number(),
  parameter_max: z.number(),
  mapping_type: z.enum(['linear', 'exponential', 'stepped']),
  steps: z.array(z.object({
    threshold: z.number(),
    value: z.number(),
    label: z.string(),
  })).optional(),
});

export const sliderSettingSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  internal_value: sliderValueSchema,
  default_value: sliderValueSchema,
  min: z.number().int().min(0),
  max: z.number().int().max(100),
  description: z.string(),
  runtime_mapping: runtimeMappingSchema,
  category: z.string().optional(),
  active: z.boolean(),
});

export const sliderPresetNameSchema = z.enum([
  'Concierge',
  'Balanced',
  'Efficiency',
  'Recovery_Mode',
  'Insurance_Sensitive',
]);

export const sliderPresetSchema = z.object({
  id: z.string().min(1),
  name: sliderPresetNameSchema,
  description: z.string(),
  values: z.record(z.number()),
  system_defined: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const sliderOverrideScopeSchema = z.enum(['global', 'channel', 'playbook']);

export const sliderOverrideSchema = z.object({
  id: z.string().min(1),
  scope: sliderOverrideScopeSchema,
  channel: z.string().optional(),
  playbook_id: z.string().optional(),
  values: z.record(z.number()),
  created_by: z.string().min(1),
  reason: z.string().min(1),
  active: z.boolean(),
  expires_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

// ---------------------------------------------------------------------------
// Feedback schemas
// ---------------------------------------------------------------------------

export const feedbackActionTypeSchema = z.enum([
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
]);

export const feedbackScopeSchema = z.enum([
  'one_time_fix',
  'playbook_improvement',
  'phrase_library',
  'policy_issue',
]);

export const feedbackStatusSchema = z.enum([
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'partially_applied',
]);

export const submitFeedbackSchema = z.object({
  action_type: feedbackActionTypeSchema,
  scope: feedbackScopeSchema,
  conversation_id: z.string().optional(),
  message_id: z.string().optional(),
  playbook_id: z.string().optional(),
  original_response: z.string().optional(),
  corrected_response: z.string().optional(),
  explanation: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  slider_adjustments: z.record(sliderValueSchema).optional(),
  action_data: z.record(z.unknown()).optional(),
});

export const reviewFeedbackSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'partially_applied']),
  review_notes: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Conversation schemas (for API input validation)
// ---------------------------------------------------------------------------

export const channelSchema = z.enum(['sms', 'web_chat']);

export const createConversationSchema = z.object({
  channel: channelSchema,
  patient_identifier: z.string().min(1),
  initial_message: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  role: z.enum(['patient', 'agent']),
  attachment_ids: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Scheduling schemas
// ---------------------------------------------------------------------------

export const searchSlotsSchema = z.object({
  location_id: z.string().min(1),
  preferred_date: isoDateSchema.optional(),
  preferred_time: time24Schema.optional(),
  appointment_type: z.string().optional(),
  date_range_days: z.number().int().min(1).max(90).optional(),
});

export const bookProvisionalSchema = z.object({
  lead_id: z.string().min(1),
  slot_id: z.string().min(1),
  conversation_id: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Inferred types from schemas (useful for validation-first patterns)
// ---------------------------------------------------------------------------

export type LeadInput = z.infer<typeof leadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ExtractedFieldInput = z.infer<typeof extractedFieldSchema>;
export type PlaybookInput = z.infer<typeof playbookSchema>;
export type SliderSettingInput = z.infer<typeof sliderSettingSchema>;
export type SliderPresetInput = z.infer<typeof sliderPresetSchema>;
export type SliderOverrideInput = z.infer<typeof sliderOverrideSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type ReviewFeedbackInput = z.infer<typeof reviewFeedbackSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SearchSlotsInput = z.infer<typeof searchSlotsSchema>;
export type BookProvisionalInput = z.infer<typeof bookProvisionalSchema>;
