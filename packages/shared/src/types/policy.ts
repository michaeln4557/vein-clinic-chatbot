/**
 * Policy rule types for compliance, clinical safety, and insurance guardrails.
 *
 * Policy rules are hard constraints that override playbook behavior.
 * Some rules are locked by compliance and cannot be edited by operators;
 * others can be tuned within defined bounds.
 */

/** Category of the policy rule. */
export enum PolicyCategory {
  /** Rules related to insurance verification, coverage, and claims. */
  Insurance = 'insurance',
  /** Rules ensuring clinical safety (e.g., no diagnosis, no medical advice). */
  ClinicalSafety = 'clinical_safety',
  /** Regulatory compliance rules (HIPAA, TCPA, state-specific). */
  Compliance = 'compliance',
}

/** Severity level determining what happens when a rule is triggered. */
export enum PolicySeverity {
  /** Hard block: the action is prevented entirely. */
  Block = 'block',
  /** Warning: the action proceeds but an alert is raised. */
  Warn = 'warn',
  /** Log only: the event is recorded but no action is taken. */
  Log = 'log',
}

/** Roles that may be granted edit access to a policy rule. */
export type PolicyEditableBy =
  | 'admin'
  | 'manager'
  | 'compliance_reviewer'
  | 'engineering';

/**
 * A single policy rule that constrains bot behavior.
 *
 * Policy rules are evaluated during response generation and can block,
 * warn, or log when the bot's proposed response or action violates
 * the rule.
 */
export interface PolicyRule {
  /** Unique identifier for this policy rule. */
  id: string;

  /** Human-readable name for the rule. */
  name: string;

  /** Category of the rule. */
  category: PolicyCategory;

  /** The rule text describing the constraint in natural language. */
  rule_text: string;

  /** What happens when this rule is triggered. */
  severity: PolicySeverity;

  /**
   * Whether this rule is locked (cannot be modified by operators).
   * Locked rules are typically set by compliance and engineering.
   */
  locked: boolean;

  /** Which roles are allowed to edit this rule (if not locked). */
  editable_by: PolicyEditableBy[];

  /** Optional regex or pattern for automated rule matching. */
  match_pattern?: string;

  /** IDs of playbooks this rule applies to (empty = all playbooks). */
  applicable_playbooks: string[];

  /** Whether this rule is currently active. */
  active: boolean;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last modification. */
  updated_at: string;

  /** ID of the user who last modified this rule. */
  last_modified_by: string;

  /** Human-readable explanation of why this rule exists. */
  rationale: string;
}
