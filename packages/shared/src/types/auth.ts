/**
 * Authentication, authorization, and role-based access control types.
 *
 * Defines the role hierarchy and permission model for controlling
 * who can view, edit, and approve changes across the system.
 */

/** System roles with increasing privilege levels. */
export enum Role {
  /** Front-line staff handling conversations and feedback. */
  FrontlineOperator = 'frontline_operator',
  /** Team lead with approval authority and playbook editing. */
  Manager = 'manager',
  /** Full system administrator with all permissions. */
  Admin = 'admin',
  /** Engineering team with system configuration access. */
  Engineering = 'engineering',
  /** Compliance reviewer with audit and policy authority. */
  ComplianceReviewer = 'compliance_reviewer',
}

/** Granular permissions that can be assigned to roles. */
export enum Permission {
  // --- Conversation ---
  /** View conversation history. */
  ConversationsView = 'conversations:view',
  /** Intervene in active conversations. */
  ConversationsIntervene = 'conversations:intervene',

  // --- Leads ---
  /** View lead records. */
  LeadsView = 'leads:view',
  /** Edit lead records. */
  LeadsEdit = 'leads:edit',

  // --- Playbooks ---
  /** View playbook configurations. */
  PlaybooksView = 'playbooks:view',
  /** Edit playbook configurations. */
  PlaybooksEdit = 'playbooks:edit',
  /** Approve playbook revisions for publishing. */
  PlaybooksApprove = 'playbooks:approve',
  /** Publish approved playbook revisions. */
  PlaybooksPublish = 'playbooks:publish',

  // --- Policy ---
  /** View policy rules. */
  PoliciesView = 'policies:view',
  /** Edit unlocked policy rules. */
  PoliciesEdit = 'policies:edit',
  /** Edit locked policy rules. */
  PoliciesEditLocked = 'policies:edit_locked',

  // --- Sliders ---
  /** View slider settings. */
  SlidersView = 'sliders:view',
  /** Adjust slider values. */
  SlidersAdjust = 'sliders:adjust',
  /** Create and manage slider overrides. */
  SlidersOverride = 'sliders:override',

  // --- Phrases ---
  /** View approved and prohibited phrases. */
  PhrasesView = 'phrases:view',
  /** Add or modify approved phrases. */
  PhrasesEdit = 'phrases:edit',

  // --- Feedback ---
  /** Submit operator feedback. */
  FeedbackSubmit = 'feedback:submit',
  /** Review and approve/reject feedback. */
  FeedbackReview = 'feedback:review',

  // --- Locations ---
  /** View location configurations. */
  LocationsView = 'locations:view',
  /** Edit location configurations. */
  LocationsEdit = 'locations:edit',

  // --- Analytics ---
  /** View analytics dashboards. */
  AnalyticsView = 'analytics:view',
  /** Export analytics data. */
  AnalyticsExport = 'analytics:export',

  // --- Audit ---
  /** View audit logs. */
  AuditView = 'audit:view',

  // --- Users ---
  /** Manage user accounts and roles. */
  UsersManage = 'users:manage',

  // --- Testing ---
  /** Create and run test sessions. */
  TestSessionsManage = 'test_sessions:manage',

  // --- System ---
  /** Access system configuration settings. */
  SystemConfig = 'system:config',
}

/** Default permission mappings for each role. */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.FrontlineOperator]: [
    Permission.ConversationsView,
    Permission.ConversationsIntervene,
    Permission.LeadsView,
    Permission.PlaybooksView,
    Permission.PoliciesView,
    Permission.SlidersView,
    Permission.PhrasesView,
    Permission.FeedbackSubmit,
    Permission.LocationsView,
    Permission.AnalyticsView,
  ],
  [Role.Manager]: [
    Permission.ConversationsView,
    Permission.ConversationsIntervene,
    Permission.LeadsView,
    Permission.LeadsEdit,
    Permission.PlaybooksView,
    Permission.PlaybooksEdit,
    Permission.PlaybooksApprove,
    Permission.PoliciesView,
    Permission.PoliciesEdit,
    Permission.SlidersView,
    Permission.SlidersAdjust,
    Permission.SlidersOverride,
    Permission.PhrasesView,
    Permission.PhrasesEdit,
    Permission.FeedbackSubmit,
    Permission.FeedbackReview,
    Permission.LocationsView,
    Permission.LocationsEdit,
    Permission.AnalyticsView,
    Permission.AnalyticsExport,
    Permission.AuditView,
    Permission.TestSessionsManage,
  ],
  [Role.Admin]: Object.values(Permission),
  [Role.Engineering]: Object.values(Permission),
  [Role.ComplianceReviewer]: [
    Permission.ConversationsView,
    Permission.LeadsView,
    Permission.PlaybooksView,
    Permission.PlaybooksApprove,
    Permission.PoliciesView,
    Permission.PoliciesEdit,
    Permission.PoliciesEditLocked,
    Permission.SlidersView,
    Permission.PhrasesView,
    Permission.PhrasesEdit,
    Permission.FeedbackReview,
    Permission.LocationsView,
    Permission.AnalyticsView,
    Permission.AnalyticsExport,
    Permission.AuditView,
  ],
};

/**
 * A system user with role-based access control.
 */
export interface User {
  /** Unique user identifier. */
  id: string;

  /** User's email address (used for login). */
  email: string;

  /** User's display name. */
  display_name: string;

  /** Assigned role. */
  role: Role;

  /** Explicitly granted permissions (in addition to role defaults). */
  additional_permissions: Permission[];

  /** Explicitly denied permissions (overrides role defaults). */
  denied_permissions: Permission[];

  /** Whether the user account is active. */
  active: boolean;

  /** ISO 8601 timestamp of last login. */
  last_login_at: string | null;

  /** ISO 8601 timestamp of account creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}
