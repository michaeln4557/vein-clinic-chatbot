/**
 * Orchestration trace types for the conversation engine.
 *
 * The orchestration layer decides which playbook to activate, manages
 * multi-step workflows, and tracks the decision-making process for
 * debugging and analytics.
 */

/** Risk level assessed for a patient message. */
export enum RiskLevel {
  /** No risk detected; standard processing. */
  Low = 'low',
  /** Moderate risk; extra validation may be needed. */
  Medium = 'medium',
  /** High risk; may require escalation or human review. */
  High = 'high',
  /** Critical risk; immediate escalation required. */
  Critical = 'critical',
}

/** Complexity assessment for a patient message or conversation. */
export enum ComplexityLevel {
  /** Simple, single-intent message. */
  Simple = 'simple',
  /** Moderate complexity with multiple elements. */
  Moderate = 'moderate',
  /** Complex message requiring multi-step handling. */
  Complex = 'complex',
  /** Highly complex situation beyond bot capability. */
  ExceedsCapability = 'exceeds_capability',
}

/** Stages of the conversation workflow. */
export enum WorkflowStage {
  /** Initial greeting and qualification. */
  Greeting = 'greeting',
  /** Collecting patient information. */
  DataCollection = 'data_collection',
  /** Collecting insurance information. */
  InsuranceCollection = 'insurance_collection',
  /** Scheduling an appointment. */
  Scheduling = 'scheduling',
  /** Answering questions / FAQ. */
  QuestionAnswering = 'question_answering',
  /** Following up on a previous interaction. */
  FollowUp = 'follow_up',
  /** Handling a reschedule or cancellation. */
  ModifyBooking = 'modify_booking',
  /** Escalation to a human agent. */
  Escalation = 'escalation',
  /** Wrapping up and closing the conversation. */
  Closing = 'closing',
}

/** Result of duplicate detection for a lead. */
export enum DuplicateDetectionResult {
  /** No duplicate found. */
  NoDuplicate = 'no_duplicate',
  /** Possible duplicate detected (low confidence). */
  PossibleDuplicate = 'possible_duplicate',
  /** Likely duplicate detected (high confidence). */
  LikelyDuplicate = 'likely_duplicate',
  /** Confirmed duplicate, needs resolution. */
  ConfirmedDuplicate = 'confirmed_duplicate',
}

/**
 * A trace record capturing the orchestration engine's decision-making
 * for a single turn in the conversation.
 *
 * Used for debugging, analytics, and operator transparency.
 */
export interface OrchestrationTrace {
  /** Unique trace identifier. */
  id: string;

  /** ID of the conversation this trace belongs to. */
  conversation_id: string;

  /** ID of the patient message that triggered this trace. */
  message_id: string;

  /** The detected intent from the patient's message. */
  detected_intent: string;

  /** Confidence score for the detected intent (0-1). */
  intent_confidence: number;

  /** Assessed complexity of the message. */
  complexity: ComplexityLevel;

  /** Assessed risk level. */
  risk_level: RiskLevel;

  /** Current stage of the conversation workflow. */
  workflow_stage: WorkflowStage;

  /** IDs of playbooks that are currently active. */
  active_playbooks: string[];

  /** Overall confidence score for the bot's response (0-1). */
  confidence_score: number;

  /** Whether a fallback response was used. */
  fallback_usage: boolean;

  /** Reason for fallback, if used. */
  fallback_reason: string | null;

  /** Whether an escalation was triggered or considered. */
  escalation_usage: boolean;

  /** Escalation reason, if applicable. */
  escalation_reason: string | null;

  /** Result of duplicate detection for the lead. */
  duplicate_detection_result: DuplicateDetectionResult;

  /** ID of the potential duplicate lead, if detected. */
  duplicate_lead_id: string | null;

  /** Current booking status in the context of this trace. */
  booking_status: string;

  /** Fields that were extracted during this turn. */
  extracted_fields: string[];

  /** Policy rules that were evaluated during this turn. */
  evaluated_policies: string[];

  /** Policy rules that were triggered (violated). */
  triggered_policies: string[];

  /** Slider values active during this turn. */
  slider_snapshot: Record<string, number>;

  /** Processing time in milliseconds. */
  processing_time_ms: number;

  /** Token usage for this turn. */
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  /** ISO 8601 timestamp of the trace. */
  timestamp: string;
}
