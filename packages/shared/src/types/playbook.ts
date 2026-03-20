/**
 * Playbook types for the operator-configurable conversation engine.
 *
 * Playbooks define how the bot handles specific conversation scenarios.
 * Each playbook contains trigger conditions, response goals, allowed
 * language, tone settings, and step-by-step flows. Operators can edit
 * playbooks through the admin UI; all changes are versioned and audited.
 */

/** All playbook names defined in the system brief. */
export enum PlaybookName {
  /** First-touch greeting and intake for new patient inquiries. */
  NewPatientIntake = 'new_patient_intake',
  /** Collecting and verifying insurance information. */
  InsuranceCollection = 'insurance_collection',
  /** Scheduling an appointment (date, time, location selection). */
  AppointmentScheduling = 'appointment_scheduling',
  /** Answering frequently asked questions about vein treatments. */
  FAQ = 'faq',
  /** Re-engaging patients who have gone silent or dropped off. */
  FollowUp = 'follow_up',
  /** Handling appointment reschedule requests. */
  Reschedule = 'reschedule',
  /** Handling appointment cancellation requests. */
  Cancellation = 'cancellation',
  /** Escalating to a human agent when the bot cannot help. */
  HumanHandoff = 'human_handoff',
  /** Handling insurance-related objections and concerns. */
  InsuranceObjection = 'insurance_objection',
  /** Responding to clinical/medical questions with safety guardrails. */
  ClinicalSafety = 'clinical_safety',
  /** After-hours / out-of-office auto-response. */
  AfterHours = 'after_hours',
  /** Confirming a previously booked appointment. */
  AppointmentConfirmation = 'appointment_confirmation',
  /** Handling callback requests when the patient wants a phone call. */
  CallbackRequest = 'callback_request',
}

/** Lifecycle status of a playbook version. */
export enum PlaybookStatus {
  /** Being authored; not visible to the bot. */
  Draft = 'draft',
  /** Submitted for review by a manager/compliance reviewer. */
  Review = 'review',
  /** Approved and live; the bot actively uses this playbook. */
  Published = 'published',
  /** Retired; kept for audit history but no longer active. */
  Archived = 'archived',
}

/** A condition that triggers this playbook to activate. */
export interface TriggerCondition {
  /** Type of trigger (intent match, keyword, status change, etc.). */
  type: 'intent' | 'keyword' | 'status_change' | 'time_based' | 'fallback' | 'manual';
  /** The value or pattern to match against. */
  value: string;
  /** Minimum confidence threshold for intent-based triggers (0-1). */
  confidence_threshold?: number;
  /** Optional priority when multiple playbooks match (higher wins). */
  priority?: number;
}

/** A single step within a playbook's conversation flow. */
export interface PlaybookStep {
  /** Unique step identifier within this playbook. */
  step_id: string;
  /** Human-readable label for the step. */
  label: string;
  /** Description of what this step accomplishes. */
  description: string;
  /** The message template or prompt instruction for this step. */
  prompt_template: string;
  /** Fields to attempt extraction on during this step. */
  extraction_targets?: string[];
  /** Conditions that determine which step comes next. */
  transitions: StepTransition[];
  /** Maximum number of retry attempts for this step. */
  max_retries?: number;
  /** Whether this step requires patient confirmation before proceeding. */
  requires_confirmation?: boolean;
}

/** A transition rule from one step to another. */
export interface StepTransition {
  /** Condition that triggers this transition. */
  condition: 'success' | 'failure' | 'timeout' | 'escalation' | 'skip' | 'custom';
  /** Custom condition expression (when condition is 'custom'). */
  custom_expression?: string;
  /** ID of the target step. */
  target_step_id: string;
}

/** Tone and style settings for bot responses within a playbook. */
export interface ToneSettings {
  /** Warmth level (0 = clinical/formal, 100 = warm/friendly). */
  warmth: number;
  /** Formality level (0 = casual, 100 = very formal). */
  formality: number;
  /** Empathy level (0 = minimal acknowledgment, 100 = highly empathetic). */
  empathy: number;
  /** Urgency level (0 = relaxed pacing, 100 = time-sensitive). */
  urgency: number;
  /** Detail level (0 = brief/concise, 100 = thorough/detailed). */
  detail: number;
}

/** Rules for when the playbook should escalate to a human. */
export interface EscalationRule {
  /** Unique identifier for this rule. */
  id: string;
  /** Human-readable description of the escalation trigger. */
  description: string;
  /** Condition that triggers escalation. */
  condition: string;
  /** Priority of this escalation (higher = more urgent). */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Whether to immediately transfer or queue the escalation. */
  action: 'immediate_transfer' | 'queue' | 'callback';
}

/** Timing rules for when booking actions should occur. */
export interface BookingTiming {
  /** Minimum messages before suggesting booking. */
  min_messages_before_booking?: number;
  /** Whether to offer booking proactively or wait for patient request. */
  proactive_booking: boolean;
  /** Delay in seconds before presenting available slots. */
  slot_presentation_delay?: number;
}

/** An example conversation snippet for the playbook. */
export interface PlaybookExample {
  /** Description of the scenario. */
  scenario: string;
  /** The example conversation turns. */
  turns: Array<{
    role: 'patient' | 'bot';
    content: string;
  }>;
}

/**
 * A complete playbook definition governing bot behavior for a scenario.
 */
export interface Playbook {
  /** Unique playbook identifier. */
  id: string;

  /** The canonical name of this playbook. */
  name: PlaybookName;

  /** Human-readable display title. */
  display_name: string;

  /** Description of what this playbook handles. */
  description: string;

  /** Monotonically increasing version number. */
  version: number;

  /** Current lifecycle status. */
  status: PlaybookStatus;

  /** Conditions that cause this playbook to activate. */
  trigger_conditions: TriggerCondition[];

  /** High-level goals for what responses should accomplish. */
  response_goals: string[];

  /** Ordered steps in the conversation flow. */
  steps: PlaybookStep[];

  /** Phrases and patterns the bot is encouraged to use. */
  allowed_language: string[];

  /** Phrases and patterns the bot must never use. */
  prohibited_language: string[];

  /** Tone and style settings. */
  tone_settings: ToneSettings;

  /** Rules for when booking actions should occur. */
  booking_timing: BookingTiming;

  /** Rules for escalating to a human agent. */
  escalation_rules: EscalationRule[];

  /** Example conversations demonstrating expected behavior. */
  examples: PlaybookExample[];

  /** Operator-specific settings and overrides. */
  operator_settings: Record<string, unknown>;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last modification. */
  updated_at: string;

  /** ID of the user who last modified this playbook. */
  last_modified_by: string;
}

/**
 * A versioned revision record for playbook change tracking.
 *
 * Every edit to a playbook creates a revision so that changes can be
 * reviewed, approved, and rolled back.
 */
export interface PlaybookRevision {
  /** Unique revision identifier. */
  id: string;

  /** ID of the playbook this revision belongs to. */
  playbook_id: string;

  /** Version number of this revision. */
  version: number;

  /** ID of the user who made the change. */
  changed_by: string;

  /** ISO 8601 timestamp of the change. */
  changed_at: string;

  /** The previous value (JSON-serialized diff). */
  previous_value: Record<string, unknown>;

  /** The new value (JSON-serialized diff). */
  new_value: Record<string, unknown>;

  /** Human-readable summary of what changed. */
  change_summary: string;

  /** Approval state of this revision. */
  approval_state: 'pending' | 'approved' | 'rejected' | 'auto_approved';

  /** ID of the user who approved/rejected, if applicable. */
  approved_by?: string;

  /** ISO 8601 timestamp of approval/rejection, if applicable. */
  approved_at?: string;

  /** Publish state of this revision. */
  publish_state: 'unpublished' | 'publishing' | 'published' | 'rolled_back';
}
