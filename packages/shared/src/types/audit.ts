/**
 * Audit log types for tracking all system changes.
 *
 * Every meaningful action in the system produces an audit log entry
 * that records who did what, when, and why. This supports compliance
 * requirements and operational debugging.
 */

/** Types of entities that can be audited. */
export type AuditEntityType =
  | 'playbook'
  | 'policy_rule'
  | 'slider_setting'
  | 'slider_preset'
  | 'slider_override'
  | 'approved_phrase'
  | 'prohibited_phrase'
  | 'location'
  | 'lead'
  | 'conversation'
  | 'handoff'
  | 'callback_request'
  | 'scheduling_request'
  | 'insurance_intake'
  | 'user'
  | 'operator_feedback'
  | 'test_session';

/** Categories of audit actions. */
export enum AuditAction {
  /** Entity was created. */
  Created = 'created',
  /** Entity was updated. */
  Updated = 'updated',
  /** Entity was deleted or archived. */
  Deleted = 'deleted',
  /** Entity status changed. */
  StatusChanged = 'status_changed',
  /** Entity was published (e.g., playbook). */
  Published = 'published',
  /** Entity was approved (e.g., playbook revision, feedback). */
  Approved = 'approved',
  /** Entity was rejected (e.g., playbook revision, feedback). */
  Rejected = 'rejected',
  /** Access was granted to the entity. */
  AccessGranted = 'access_granted',
  /** Access was revoked from the entity. */
  AccessRevoked = 'access_revoked',
  /** Entity was exported. */
  Exported = 'exported',
  /** Configuration was changed. */
  ConfigChanged = 'config_changed',
  /** An escalation or handoff occurred. */
  Escalated = 'escalated',
  /** A sync to external system occurred. */
  ExternalSync = 'external_sync',
}

/**
 * A single audit log entry recording a system action.
 */
export interface AuditLogEntry {
  /** Unique audit log entry identifier. */
  id: string;

  /** ID of the user or system component that performed the action. */
  who: string;

  /** Human-readable name of the actor. */
  who_display_name: string;

  /** Role of the actor at the time of the action. */
  who_role: string;

  /** What action was performed. */
  what: AuditAction;

  /** Human-readable description of the action. */
  what_description: string;

  /** ISO 8601 timestamp of when the action occurred. */
  when: string;

  /** Reason or justification for the action. */
  why: string;

  /** Type of entity that was acted upon. */
  entity_type: AuditEntityType;

  /** ID of the entity that was acted upon. */
  entity_id: string;

  /** The value before the change (JSON-serialized). */
  previous_value: Record<string, unknown> | null;

  /** The value after the change (JSON-serialized). */
  new_value: Record<string, unknown> | null;

  /** IP address of the actor, if available. */
  ip_address: string | null;

  /** User agent string, if available. */
  user_agent: string | null;

  /** Additional context metadata. */
  metadata: Record<string, unknown>;
}
