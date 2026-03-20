/**
 * Human handoff, callback request, and escalation types.
 *
 * These types govern how and when the bot transfers control to a
 * human agent, schedules callbacks, and records escalation events
 * for monitoring and improvement.
 */

/** Reasons that trigger a human handoff (from brief section 12). */
export enum EscalationReason {
  /** Patient explicitly asked to speak with a human. */
  PatientRequest = 'patient_request',
  /** Bot detected negative sentiment or frustration. */
  NegativeSentiment = 'negative_sentiment',
  /** Patient expressed a clinical complaint or symptom concern. */
  ClinicalComplaint = 'clinical_complaint',
  /** Insurance verification requires human judgment. */
  InsuranceComplexity = 'insurance_complexity',
  /** Scheduling conflict that cannot be resolved automatically. */
  SchedulingConflict = 'scheduling_conflict',
  /** Bot confidence fell below the acceptable threshold. */
  LowConfidence = 'low_confidence',
  /** Patient has been in the conversation too long without resolution. */
  ConversationTimeout = 'conversation_timeout',
  /** Multiple failed extraction attempts for required fields. */
  RepeatedExtractionFailure = 'repeated_extraction_failure',
  /** Patient expressed dissatisfaction with the bot's responses. */
  PatientDissatisfaction = 'patient_dissatisfaction',
  /** Legal or compliance-sensitive topic detected. */
  ComplianceConcern = 'compliance_concern',
  /** Billing or payment dispute. */
  BillingDispute = 'billing_dispute',
  /** Emergency or urgent medical situation detected. */
  MedicalEmergency = 'medical_emergency',
  /** Duplicate lead detected that needs manual resolution. */
  DuplicateResolution = 'duplicate_resolution',
  /** Policy rule triggered a mandatory escalation. */
  PolicyTriggered = 'policy_triggered',
  /** Bot encountered an unrecoverable error. */
  SystemError = 'system_error',
}

/** Priority level for the escalation. */
export enum EscalationPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/** Current status of a human handoff. */
export enum HandoffStatus {
  /** Handoff has been requested but no agent assigned. */
  Requested = 'requested',
  /** An agent has been assigned and is joining. */
  AgentAssigned = 'agent_assigned',
  /** Agent is actively handling the conversation. */
  InProgress = 'in_progress',
  /** Handoff is complete; conversation resolved by agent. */
  Completed = 'completed',
  /** Handoff was cancelled (e.g., patient left before agent joined). */
  Cancelled = 'cancelled',
  /** No agent was available; fallback action taken. */
  NoAgentAvailable = 'no_agent_available',
}

/**
 * A human handoff record created when the bot transfers
 * a conversation to a clinic agent.
 */
export interface HumanHandoff {
  /** Unique handoff identifier. */
  id: string;

  /** ID of the conversation being handed off. */
  conversation_id: string;

  /** ID of the associated lead. */
  lead_id: string;

  /** Current handoff status. */
  status: HandoffStatus;

  /** Why the handoff was triggered. */
  reason: EscalationReason;

  /** Priority level. */
  priority: EscalationPriority;

  /** ID of the assigned human agent, if any. */
  agent_id: string | null;

  /** Summary of the conversation context for the agent. */
  context_summary: string;

  /** Key data points collected so far for quick agent reference. */
  collected_data: Record<string, string | null>;

  /** ID of the playbook that was active when handoff occurred. */
  active_playbook_id: string | null;

  /** The bot's last message before handing off. */
  last_bot_message: string | null;

  /** Estimated wait time in seconds communicated to the patient. */
  estimated_wait_seconds: number | null;

  /** ISO 8601 timestamp of handoff request. */
  requested_at: string;

  /** ISO 8601 timestamp of agent assignment. */
  assigned_at: string | null;

  /** ISO 8601 timestamp of handoff completion. */
  completed_at: string | null;

  /** Agent's resolution notes. */
  resolution_notes: string | null;
}

/** Status of a callback request. */
export enum CallbackStatus {
  /** Callback has been requested. */
  Requested = 'requested',
  /** Callback has been scheduled for a specific time. */
  Scheduled = 'scheduled',
  /** Callback attempt is in progress. */
  InProgress = 'in_progress',
  /** Callback was completed successfully. */
  Completed = 'completed',
  /** Callback attempt failed (no answer, wrong number, etc.). */
  Failed = 'failed',
  /** Callback was cancelled by the patient. */
  Cancelled = 'cancelled',
}

/**
 * A callback request created when a patient wants to receive
 * a phone call from clinic staff.
 */
export interface CallbackRequest {
  /** Unique callback request identifier. */
  id: string;

  /** ID of the associated lead. */
  lead_id: string;

  /** ID of the conversation where callback was requested. */
  conversation_id: string;

  /** Current callback status. */
  status: CallbackStatus;

  /** Phone number to call. */
  phone_number: string;

  /** Patient's preferred callback time window. */
  preferred_time: string | null;

  /** ISO 8601 timestamp of the scheduled callback, if set. */
  scheduled_at: string | null;

  /** Reason the patient wants a callback. */
  reason: string | null;

  /** Context summary for the person making the callback. */
  context_summary: string;

  /** Number of callback attempts made. */
  attempt_count: number;

  /** ID of the agent assigned to make the callback. */
  assigned_agent_id: string | null;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;

  /** Notes from the callback attempt. */
  outcome_notes: string | null;
}

/**
 * An escalation event logged whenever an escalation condition
 * is detected, whether or not it results in a full handoff.
 */
export interface EscalationEvent {
  /** Unique event identifier. */
  id: string;

  /** ID of the conversation where the escalation occurred. */
  conversation_id: string;

  /** ID of the associated lead. */
  lead_id: string;

  /** The reason for escalation. */
  reason: EscalationReason;

  /** Priority of this escalation event. */
  priority: EscalationPriority;

  /** ID of the message that triggered the escalation. */
  trigger_message_id: string;

  /** ID of the handoff created, if one was initiated. */
  handoff_id: string | null;

  /** ID of the callback request created, if applicable. */
  callback_request_id: string | null;

  /** Whether the escalation resulted in an actual handoff. */
  resulted_in_handoff: boolean;

  /** Action taken in response to the escalation. */
  action_taken: 'handoff' | 'callback' | 'queue' | 'suppressed' | 'auto_resolved';

  /** Additional context about the escalation. */
  context: Record<string, unknown>;

  /** ISO 8601 timestamp of the event. */
  timestamp: string;
}
