/**
 * Operator feedback and phrase library types.
 *
 * Operators interact with the system through feedback actions that
 * can fix individual responses, improve playbooks, update the phrase
 * library, or flag policy issues. All feedback is tracked and audited.
 */

/** Types of feedback actions operators can take (from brief section 17). */
export enum FeedbackActionType {
  /** Approve a bot response as-is. */
  Approve = 'approve',
  /** Edit and correct a bot response. */
  EditResponse = 'edit_response',
  /** Flag a response as inappropriate or incorrect. */
  FlagResponse = 'flag_response',
  /** Suggest an alternative response. */
  SuggestAlternative = 'suggest_alternative',
  /** Add a phrase to the approved phrases list. */
  AddApprovedPhrase = 'add_approved_phrase',
  /** Add a phrase to the prohibited phrases list. */
  AddProhibitedPhrase = 'add_prohibited_phrase',
  /** Request a playbook modification. */
  RequestPlaybookChange = 'request_playbook_change',
  /** Report a policy violation. */
  ReportPolicyViolation = 'report_policy_violation',
  /** Override a bot decision (e.g., escalation, extraction). */
  OverrideDecision = 'override_decision',
  /** Adjust a tone/style slider for a specific context. */
  AdjustSlider = 'adjust_slider',
  /** Provide a rating for response quality. */
  RateResponse = 'rate_response',
  /** Escalate a feedback item that needs manager attention. */
  EscalateToManager = 'escalate_to_manager',
}

/** Scope of a feedback action's intended impact. */
export enum FeedbackScope {
  /** Fix this one specific response only. */
  OneTimeFix = 'one_time_fix',
  /** Improve the playbook for future similar situations. */
  PlaybookImprovement = 'playbook_improvement',
  /** Add to or modify the phrase library. */
  PhraseLibrary = 'phrase_library',
  /** Flag a systemic policy issue. */
  PolicyIssue = 'policy_issue',
}

/** Status of an operator feedback item. */
export enum FeedbackStatus {
  /** Feedback has been submitted. */
  Submitted = 'submitted',
  /** Feedback is being reviewed by a manager. */
  UnderReview = 'under_review',
  /** Feedback has been accepted and applied. */
  Accepted = 'accepted',
  /** Feedback has been rejected with a reason. */
  Rejected = 'rejected',
  /** Feedback has been partially applied. */
  PartiallyApplied = 'partially_applied',
}

/**
 * An operator feedback record capturing a specific action taken
 * by an operator to improve the system.
 */
export interface OperatorFeedback {
  /** Unique feedback identifier. */
  id: string;

  /** ID of the operator who submitted the feedback. */
  operator_id: string;

  /** Type of feedback action. */
  action_type: FeedbackActionType;

  /** Scope of the feedback's intended impact. */
  scope: FeedbackScope;

  /** Current processing status. */
  status: FeedbackStatus;

  /** ID of the conversation this feedback relates to. */
  conversation_id: string | null;

  /** ID of the specific message this feedback is about. */
  message_id: string | null;

  /** ID of the playbook involved, if applicable. */
  playbook_id: string | null;

  /** The original bot response text. */
  original_response: string | null;

  /** The operator's corrected or suggested response. */
  corrected_response: string | null;

  /** Free-form explanation from the operator. */
  explanation: string;

  /** Rating value (1-5) if action_type is rate_response. */
  rating: number | null;

  /** Slider adjustments if action_type is adjust_slider. */
  slider_adjustments: Record<string, number> | null;

  /** Structured data for the feedback action. */
  action_data: Record<string, unknown>;

  /** ID of the manager who reviewed, if applicable. */
  reviewed_by: string | null;

  /** Manager's review notes. */
  review_notes: string | null;

  /** ISO 8601 timestamp of submission. */
  submitted_at: string;

  /** ISO 8601 timestamp of review. */
  reviewed_at: string | null;

  /** ISO 8601 timestamp when the feedback was applied. */
  applied_at: string | null;
}

/**
 * A phrase that has been approved for bot usage.
 *
 * Approved phrases are preferred language that the bot should use
 * when communicating with patients in specific contexts.
 */
export interface ApprovedPhrase {
  /** Unique phrase identifier. */
  id: string;

  /** The approved phrase text. */
  phrase: string;

  /** Context or scenario where this phrase should be used. */
  context: string;

  /** IDs of playbooks where this phrase is relevant. */
  applicable_playbooks: string[];

  /** ID of the operator who added this phrase. */
  added_by: string;

  /** ID of the feedback that originated this phrase. */
  source_feedback_id: string | null;

  /** Whether this phrase is currently active. */
  active: boolean;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** Usage count in bot responses. */
  usage_count: number;
}

/**
 * A phrase that the bot must never use.
 *
 * Prohibited phrases are language patterns that violate policy,
 * are clinically inappropriate, or have been flagged by operators.
 */
export interface ProhibitedPhrase {
  /** Unique phrase identifier. */
  id: string;

  /** The prohibited phrase or pattern. */
  phrase: string;

  /** Why this phrase is prohibited. */
  reason: string;

  /** Whether to use exact matching or fuzzy/pattern matching. */
  match_type: 'exact' | 'contains' | 'regex';

  /** Severity: block prevents sending, warn alerts the operator. */
  severity: 'block' | 'warn';

  /** ID of the operator who added this prohibition. */
  added_by: string;

  /** ID of the feedback that originated this prohibition. */
  source_feedback_id: string | null;

  /** Whether this prohibition is currently active. */
  active: boolean;

  /** ISO 8601 timestamp of creation. */
  created_at: string;
}
