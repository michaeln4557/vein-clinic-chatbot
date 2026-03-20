/**
 * Test session and response trace types for the sandbox testing system.
 *
 * Operators can run test conversations against playbooks to verify
 * behavior before publishing changes. Each test session records
 * detailed traces for every response.
 */

/** Status of a test session. */
export enum TestSessionStatus {
  /** Session is actively being used. */
  Active = 'active',
  /** Session has been completed. */
  Completed = 'completed',
  /** Session was abandoned. */
  Abandoned = 'abandoned',
}

/** Outcome of a single test turn evaluation. */
export enum TestTurnOutcome {
  /** Response met expectations. */
  Pass = 'pass',
  /** Response partially met expectations. */
  Partial = 'partial',
  /** Response did not meet expectations. */
  Fail = 'fail',
  /** No evaluation criteria defined; outcome unknown. */
  Unevaluated = 'unevaluated',
}

/**
 * A test session created by an operator to validate bot behavior.
 */
export interface TestSession {
  /** Unique session identifier. */
  id: string;

  /** ID of the operator running the test. */
  operator_id: string;

  /** Display name for the test session. */
  name: string;

  /** Description of what is being tested. */
  description: string;

  /** ID of the playbook being tested (null for general testing). */
  playbook_id: string | null;

  /** Version of the playbook at time of testing. */
  playbook_version: number | null;

  /** Slider settings used for this test session. */
  slider_snapshot: Record<string, number>;

  /** Current session status. */
  status: TestSessionStatus;

  /** Simulated patient messages and bot responses. */
  turns: TestTurn[];

  /** Overall test result summary. */
  summary: TestSessionSummary | null;

  /** ISO 8601 timestamp of session start. */
  started_at: string;

  /** ISO 8601 timestamp of session end. */
  ended_at: string | null;
}

/** A single turn (patient message + bot response) in a test session. */
export interface TestTurn {
  /** Turn number (1-indexed). */
  turn_number: number;

  /** The simulated patient message. */
  patient_message: string;

  /** The bot's generated response. */
  bot_response: string;

  /** Detailed trace of the response generation. */
  response_trace: ResponseTrace;

  /** Operator evaluation of this turn. */
  outcome: TestTurnOutcome;

  /** Operator notes on this turn. */
  operator_notes: string | null;

  /** ISO 8601 timestamp of this turn. */
  timestamp: string;
}

/**
 * Detailed trace of how a bot response was generated.
 *
 * Provides full transparency into the decision-making process
 * for debugging and quality assurance.
 */
export interface ResponseTrace {
  /** ID of the orchestration trace for this response. */
  orchestration_trace_id: string;

  /** The detected intent. */
  detected_intent: string;

  /** Confidence in the detected intent (0-1). */
  intent_confidence: number;

  /** Which playbook(s) were activated. */
  active_playbooks: string[];

  /** Which playbook step was executed. */
  active_step_id: string | null;

  /** The prompt sent to the LLM (for debugging). */
  prompt_snapshot: string;

  /** The raw LLM response before post-processing. */
  raw_response: string;

  /** Post-processing transformations applied. */
  transformations_applied: string[];

  /** Policy rules that were evaluated. */
  policies_evaluated: string[];

  /** Policy rules that were triggered. */
  policies_triggered: string[];

  /** Fields extracted during this turn. */
  fields_extracted: Array<{
    field_name: string;
    value: string;
    confidence: number;
  }>;

  /** Slider values used for generation. */
  slider_values: Record<string, number>;

  /** Token usage for this response. */
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  /** Response generation latency in milliseconds. */
  latency_ms: number;

  /** Whether a fallback was used. */
  used_fallback: boolean;

  /** Model identifier used for generation. */
  model_id: string;
}

/** Summary statistics for a completed test session. */
export interface TestSessionSummary {
  /** Total number of turns in the session. */
  total_turns: number;

  /** Number of turns that passed. */
  passed: number;

  /** Number of turns that partially passed. */
  partial: number;

  /** Number of turns that failed. */
  failed: number;

  /** Number of unevaluated turns. */
  unevaluated: number;

  /** Average response confidence across all turns. */
  avg_confidence: number;

  /** Average response latency in milliseconds. */
  avg_latency_ms: number;

  /** Total tokens used across all turns. */
  total_tokens: number;

  /** Number of fallback responses used. */
  fallback_count: number;

  /** Number of policy violations triggered. */
  policy_violations: number;
}
