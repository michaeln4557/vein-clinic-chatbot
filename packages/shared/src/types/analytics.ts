/**
 * Analytics event types for tracking all system metrics.
 *
 * Covers all metrics from the system brief section 19, including
 * conversation metrics, booking funnel, response quality, operator
 * activity, and system health.
 */

/** All analytics event types tracked by the system. */
export enum AnalyticsEventType {
  // --- Conversation Metrics ---
  /** A new conversation was started. */
  ConversationStarted = 'conversation_started',
  /** A conversation was completed (resolved). */
  ConversationCompleted = 'conversation_completed',
  /** A conversation was abandoned by the patient. */
  ConversationAbandoned = 'conversation_abandoned',
  /** A message was sent by the bot. */
  BotMessageSent = 'bot_message_sent',
  /** A message was received from the patient. */
  PatientMessageReceived = 'patient_message_received',
  /** Average conversation duration recorded. */
  ConversationDuration = 'conversation_duration',
  /** Number of messages in a conversation. */
  MessageCount = 'message_count',

  // --- Booking Funnel ---
  /** A new lead was created. */
  LeadCreated = 'lead_created',
  /** Lead status changed (includes from/to in metadata). */
  LeadStatusChanged = 'lead_status_changed',
  /** Booking flow was initiated. */
  BookingStarted = 'booking_started',
  /** A provisional booking was created. */
  ProvisionalBookingCreated = 'provisional_booking_created',
  /** A booking was confirmed. */
  BookingConfirmed = 'booking_confirmed',
  /** A booking was cancelled. */
  BookingCancelled = 'booking_cancelled',
  /** A booking was rescheduled. */
  BookingRescheduled = 'booking_rescheduled',
  /** Lead-to-booking conversion recorded. */
  ConversionRecorded = 'conversion_recorded',

  // --- Extraction Quality ---
  /** A field was successfully extracted. */
  FieldExtracted = 'field_extracted',
  /** An extraction was verified by the patient or operator. */
  ExtractionVerified = 'extraction_verified',
  /** An extraction conflict was detected. */
  ExtractionConflict = 'extraction_conflict',
  /** CRM sync was attempted. */
  CrmSyncAttempted = 'crm_sync_attempted',
  /** CRM sync succeeded. */
  CrmSyncSucceeded = 'crm_sync_succeeded',
  /** CRM sync failed. */
  CrmSyncFailed = 'crm_sync_failed',

  // --- Response Quality ---
  /** Bot response confidence score recorded. */
  ResponseConfidence = 'response_confidence',
  /** Fallback response was used (bot was unsure). */
  FallbackUsed = 'fallback_used',
  /** Policy rule was triggered during response generation. */
  PolicyRuleTriggered = 'policy_rule_triggered',
  /** Response was blocked by a policy rule. */
  ResponseBlocked = 'response_blocked',
  /** Response latency was recorded. */
  ResponseLatency = 'response_latency',

  // --- Escalation Metrics ---
  /** An escalation event occurred. */
  EscalationTriggered = 'escalation_triggered',
  /** A human handoff was initiated. */
  HandoffInitiated = 'handoff_initiated',
  /** A human handoff was completed. */
  HandoffCompleted = 'handoff_completed',
  /** A callback was requested. */
  CallbackRequested = 'callback_requested',
  /** A callback was completed. */
  CallbackCompleted = 'callback_completed',

  // --- Insurance Metrics ---
  /** Insurance intake was started. */
  InsuranceIntakeStarted = 'insurance_intake_started',
  /** Insurance card was uploaded. */
  InsuranceCardUploaded = 'insurance_card_uploaded',
  /** Insurance verification was completed. */
  InsuranceVerified = 'insurance_verified',

  // --- Operator Activity ---
  /** Operator submitted feedback. */
  OperatorFeedbackSubmitted = 'operator_feedback_submitted',
  /** Operator approved a response. */
  OperatorApprovedResponse = 'operator_approved_response',
  /** Operator edited a response. */
  OperatorEditedResponse = 'operator_edited_response',
  /** Operator flagged a response. */
  OperatorFlaggedResponse = 'operator_flagged_response',
  /** Playbook was modified by an operator. */
  PlaybookModified = 'playbook_modified',
  /** Slider was adjusted by an operator. */
  SliderAdjusted = 'slider_adjusted',

  // --- System Health ---
  /** System error occurred. */
  SystemError = 'system_error',
  /** API rate limit was hit. */
  RateLimitHit = 'rate_limit_hit',
  /** External service call (scheduling, CRM) was made. */
  ExternalServiceCall = 'external_service_call',
  /** External service call failed. */
  ExternalServiceFailure = 'external_service_failure',

  // --- Duplicate Detection ---
  /** A potential duplicate lead was detected. */
  DuplicateDetected = 'duplicate_detected',
  /** A duplicate was resolved (merged or dismissed). */
  DuplicateResolved = 'duplicate_resolved',

  // --- Test Sessions ---
  /** A test session was started. */
  TestSessionStarted = 'test_session_started',
  /** A test session was completed. */
  TestSessionCompleted = 'test_session_completed',
}

/**
 * A single analytics event recorded by the system.
 */
export interface AnalyticsEvent {
  /** Unique event identifier. */
  id: string;

  /** Type of event. */
  event_type: AnalyticsEventType;

  /** ISO 8601 timestamp of the event. */
  timestamp: string;

  /** ID of the conversation, if applicable. */
  conversation_id: string | null;

  /** ID of the lead, if applicable. */
  lead_id: string | null;

  /** ID of the user/operator who triggered the event, if applicable. */
  user_id: string | null;

  /** Communication channel where the event occurred. */
  channel: string | null;

  /** Event-specific data payload. */
  data: Record<string, unknown>;

  /** Duration or numeric value associated with the event. */
  value: number | null;

  /** Session or request ID for correlation. */
  session_id: string | null;
}

/**
 * An aggregated analytics metric for dashboard display.
 */
export interface AnalyticsMetric {
  /** Name of the metric. */
  metric_name: string;

  /** Current value. */
  value: number;

  /** Previous period value for comparison. */
  previous_value: number | null;

  /** Percentage change from previous period. */
  change_percentage: number | null;

  /** Time period this metric covers. */
  period: 'hour' | 'day' | 'week' | 'month';

  /** ISO 8601 timestamp of when this metric was computed. */
  computed_at: string;
}
