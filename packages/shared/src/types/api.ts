/**
 * API request and response types for all system endpoints.
 *
 * Provides typed contracts for the REST API surface described
 * in the system brief section 22.
 */

import type { Lead, LeadStatus, BookingStatus } from './lead';
import type { Conversation, Message, Channel } from './conversation';
import type { ExtractedField, CrmSyncPayload, CrmReadyState } from './extraction';
import type { Playbook, PlaybookRevision, PlaybookStatus } from './playbook';
import type { PolicyRule } from './policy';
import type { Location } from './location';
import type { SchedulingRequest, AppointmentSlot, ProvisionalBooking } from './scheduling';
import type { InsuranceIntake } from './insurance';
import type { HumanHandoff, CallbackRequest, EscalationEvent } from './handoff';
import type { OperatorFeedback, ApprovedPhrase, ProhibitedPhrase } from './operator';
import type { SliderSetting, SliderPreset, SliderOverride } from './slider';
import type { AuditLogEntry } from './audit';
import type { AnalyticsEvent, AnalyticsMetric } from './analytics';
import type { User, Role } from './auth';
import type { OrchestrationTrace } from './orchestration';
import type { TestSession } from './test-session';

// ---------------------------------------------------------------------------
// Generic API envelope
// ---------------------------------------------------------------------------

/** Standard API success response wrapper. */
export interface ApiResponse<T> {
  /** Whether the request succeeded. */
  success: boolean;
  /** Response payload. */
  data: T;
  /** Optional human-readable message. */
  message?: string;
}

/** Standard API error response. */
export interface ApiError {
  /** Whether the request succeeded (always false). */
  success: false;
  /** Machine-readable error code. */
  error_code: string;
  /** Human-readable error message. */
  message: string;
  /** Field-level validation errors. */
  validation_errors?: Record<string, string[]>;
}

/** Paginated list response wrapper. */
export interface PaginatedResponse<T> {
  /** Whether the request succeeded. */
  success: boolean;
  /** The items in the current page. */
  data: T[];
  /** Pagination metadata. */
  pagination: {
    /** Current page number (1-indexed). */
    page: number;
    /** Number of items per page. */
    per_page: number;
    /** Total number of items across all pages. */
    total: number;
    /** Total number of pages. */
    total_pages: number;
  };
}

/** Common query parameters for list endpoints. */
export interface PaginationParams {
  /** Page number (1-indexed). */
  page?: number;
  /** Items per page. */
  per_page?: number;
  /** Field to sort by. */
  sort_by?: string;
  /** Sort direction. */
  sort_order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Conversations API
// ---------------------------------------------------------------------------

/** POST /api/conversations - Start a new conversation. */
export interface CreateConversationRequest {
  channel: Channel;
  patient_identifier: string;
  initial_message?: string;
  metadata?: Record<string, unknown>;
}

export type CreateConversationResponse = ApiResponse<Conversation>;

/** POST /api/conversations/:id/messages - Send a message. */
export interface SendMessageRequest {
  content: string;
  role: 'patient' | 'agent';
  attachment_ids?: string[];
}

export type SendMessageResponse = ApiResponse<{
  patient_message: Message;
  bot_response: Message | null;
  orchestration_trace: OrchestrationTrace;
}>;

/** GET /api/conversations/:id */
export type GetConversationResponse = ApiResponse<Conversation>;

/** GET /api/conversations */
export interface ListConversationsParams extends PaginationParams {
  channel?: Channel;
  status?: string;
  lead_id?: string;
  date_from?: string;
  date_to?: string;
}

export type ListConversationsResponse = PaginatedResponse<Conversation>;

// ---------------------------------------------------------------------------
// Leads API
// ---------------------------------------------------------------------------

/** GET /api/leads */
export interface ListLeadsParams extends PaginationParams {
  lead_status?: LeadStatus;
  booking_status?: BookingStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export type ListLeadsResponse = PaginatedResponse<Lead>;

/** GET /api/leads/:id */
export type GetLeadResponse = ApiResponse<Lead>;

/** PATCH /api/leads/:id */
export interface UpdateLeadRequest {
  full_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  insurance_provider?: string;
  insurance_member_id?: string;
  requested_location?: string;
  lead_status?: LeadStatus;
  booking_status?: BookingStatus;
  notes?: string;
}

export type UpdateLeadResponse = ApiResponse<Lead>;

/** GET /api/leads/:id/extractions */
export type GetLeadExtractionsResponse = ApiResponse<ExtractedField[]>;

/** GET /api/leads/:id/crm-sync-status */
export type GetCrmSyncStatusResponse = ApiResponse<{
  ready_state: CrmReadyState;
  payload: CrmSyncPayload;
}>;

/** POST /api/leads/:id/crm-sync */
export type TriggerCrmSyncResponse = ApiResponse<{
  sync_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
}>;

// ---------------------------------------------------------------------------
// Playbooks API
// ---------------------------------------------------------------------------

/** GET /api/playbooks */
export interface ListPlaybooksParams extends PaginationParams {
  status?: PlaybookStatus;
  name?: string;
}

export type ListPlaybooksResponse = PaginatedResponse<Playbook>;

/** GET /api/playbooks/:id */
export type GetPlaybookResponse = ApiResponse<Playbook>;

/** PUT /api/playbooks/:id */
export type UpdatePlaybookRequest = Partial<Omit<Playbook, 'id' | 'created_at' | 'updated_at' | 'version'>>;
export type UpdatePlaybookResponse = ApiResponse<Playbook>;

/** GET /api/playbooks/:id/revisions */
export type GetPlaybookRevisionsResponse = ApiResponse<PlaybookRevision[]>;

/** POST /api/playbooks/:id/revisions/:revisionId/approve */
export interface ApprovePlaybookRevisionRequest {
  approval_notes?: string;
}
export type ApprovePlaybookRevisionResponse = ApiResponse<PlaybookRevision>;

/** POST /api/playbooks/:id/publish */
export type PublishPlaybookResponse = ApiResponse<Playbook>;

// ---------------------------------------------------------------------------
// Policy API
// ---------------------------------------------------------------------------

/** GET /api/policies */
export interface ListPoliciesParams extends PaginationParams {
  category?: string;
  severity?: string;
  active?: boolean;
}

export type ListPoliciesResponse = PaginatedResponse<PolicyRule>;

/** GET /api/policies/:id */
export type GetPolicyResponse = ApiResponse<PolicyRule>;

/** PUT /api/policies/:id */
export type UpdatePolicyRequest = Partial<Omit<PolicyRule, 'id' | 'created_at' | 'updated_at'>>;
export type UpdatePolicyResponse = ApiResponse<PolicyRule>;

// ---------------------------------------------------------------------------
// Locations API
// ---------------------------------------------------------------------------

/** GET /api/locations */
export interface ListLocationsParams extends PaginationParams {
  state?: string;
  active?: boolean;
}

export type ListLocationsResponse = PaginatedResponse<Location>;

/** GET /api/locations/:id */
export type GetLocationResponse = ApiResponse<Location>;

/** PUT /api/locations/:id */
export type UpdateLocationRequest = Partial<Omit<Location, 'location_id' | 'created_at' | 'updated_at'>>;
export type UpdateLocationResponse = ApiResponse<Location>;

/** POST /api/locations */
export type CreateLocationRequest = Omit<Location, 'location_id' | 'created_at' | 'updated_at'>;
export type CreateLocationResponse = ApiResponse<Location>;

// ---------------------------------------------------------------------------
// Scheduling API
// ---------------------------------------------------------------------------

/** POST /api/scheduling/search-slots */
export interface SearchSlotsRequest {
  location_id: string;
  preferred_date?: string;
  preferred_time?: string;
  appointment_type?: string;
  date_range_days?: number;
}

export type SearchSlotsResponse = ApiResponse<AppointmentSlot[]>;

/** POST /api/scheduling/book-provisional */
export interface BookProvisionalRequest {
  lead_id: string;
  slot_id: string;
  conversation_id: string;
}

export type BookProvisionalResponse = ApiResponse<ProvisionalBooking>;

/** POST /api/scheduling/confirm/:bookingId */
export type ConfirmBookingResponse = ApiResponse<ProvisionalBooking>;

/** DELETE /api/scheduling/cancel/:bookingId */
export interface CancelBookingRequest {
  reason?: string;
}
export type CancelBookingResponse = ApiResponse<ProvisionalBooking>;

/** GET /api/scheduling/requests/:id */
export type GetSchedulingRequestResponse = ApiResponse<SchedulingRequest>;

// ---------------------------------------------------------------------------
// Insurance API
// ---------------------------------------------------------------------------

/** GET /api/insurance/:leadId */
export type GetInsuranceIntakeResponse = ApiResponse<InsuranceIntake>;

/** POST /api/insurance/:leadId/upload */
export interface UploadInsuranceCardRequest {
  side: 'front' | 'back';
  /** Base64 encoded image data. */
  image_data: string;
  mime_type: string;
}

export type UploadInsuranceCardResponse = ApiResponse<InsuranceIntake>;

// ---------------------------------------------------------------------------
// Handoff API
// ---------------------------------------------------------------------------

/** POST /api/handoffs */
export interface CreateHandoffRequest {
  conversation_id: string;
  lead_id: string;
  reason: string;
  priority?: string;
  context_summary?: string;
}

export type CreateHandoffResponse = ApiResponse<HumanHandoff>;

/** PATCH /api/handoffs/:id */
export interface UpdateHandoffRequest {
  status?: string;
  agent_id?: string;
  resolution_notes?: string;
}

export type UpdateHandoffResponse = ApiResponse<HumanHandoff>;

/** GET /api/handoffs */
export interface ListHandoffsParams extends PaginationParams {
  status?: string;
  agent_id?: string;
}

export type ListHandoffsResponse = PaginatedResponse<HumanHandoff>;

/** POST /api/callbacks */
export interface CreateCallbackRequest {
  lead_id: string;
  conversation_id: string;
  phone_number: string;
  preferred_time?: string;
  reason?: string;
  context_summary?: string;
}

export type CreateCallbackResponse = ApiResponse<CallbackRequest>;

/** GET /api/escalations */
export interface ListEscalationsParams extends PaginationParams {
  reason?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}

export type ListEscalationsResponse = PaginatedResponse<EscalationEvent>;

// ---------------------------------------------------------------------------
// Operator Feedback API
// ---------------------------------------------------------------------------

/** POST /api/feedback */
export interface SubmitFeedbackRequest {
  action_type: string;
  scope: string;
  conversation_id?: string;
  message_id?: string;
  playbook_id?: string;
  original_response?: string;
  corrected_response?: string;
  explanation: string;
  rating?: number;
  slider_adjustments?: Record<string, number>;
  action_data?: Record<string, unknown>;
}

export type SubmitFeedbackResponse = ApiResponse<OperatorFeedback>;

/** GET /api/feedback */
export interface ListFeedbackParams extends PaginationParams {
  action_type?: string;
  scope?: string;
  status?: string;
  operator_id?: string;
}

export type ListFeedbackResponse = PaginatedResponse<OperatorFeedback>;

/** PATCH /api/feedback/:id/review */
export interface ReviewFeedbackRequest {
  status: 'accepted' | 'rejected' | 'partially_applied';
  review_notes: string;
}

export type ReviewFeedbackResponse = ApiResponse<OperatorFeedback>;

// ---------------------------------------------------------------------------
// Phrases API
// ---------------------------------------------------------------------------

/** GET /api/phrases/approved */
export type ListApprovedPhrasesResponse = ApiResponse<ApprovedPhrase[]>;

/** POST /api/phrases/approved */
export interface CreateApprovedPhraseRequest {
  phrase: string;
  context: string;
  applicable_playbooks?: string[];
}

export type CreateApprovedPhraseResponse = ApiResponse<ApprovedPhrase>;

/** GET /api/phrases/prohibited */
export type ListProhibitedPhrasesResponse = ApiResponse<ProhibitedPhrase[]>;

/** POST /api/phrases/prohibited */
export interface CreateProhibitedPhraseRequest {
  phrase: string;
  reason: string;
  match_type?: 'exact' | 'contains' | 'regex';
  severity?: 'block' | 'warn';
}

export type CreateProhibitedPhraseResponse = ApiResponse<ProhibitedPhrase>;

// ---------------------------------------------------------------------------
// Sliders API
// ---------------------------------------------------------------------------

/** GET /api/sliders */
export type ListSlidersResponse = ApiResponse<SliderSetting[]>;

/** PATCH /api/sliders/:id */
export interface UpdateSliderRequest {
  internal_value: number;
}

export type UpdateSliderResponse = ApiResponse<SliderSetting>;

/** GET /api/sliders/presets */
export type ListSliderPresetsResponse = ApiResponse<SliderPreset[]>;

/** POST /api/sliders/presets/:id/apply */
export type ApplySliderPresetResponse = ApiResponse<SliderSetting[]>;

/** GET /api/sliders/overrides */
export type ListSliderOverridesResponse = ApiResponse<SliderOverride[]>;

/** POST /api/sliders/overrides */
export interface CreateSliderOverrideRequest {
  scope: string;
  channel?: string;
  playbook_id?: string;
  values: Record<string, number>;
  reason: string;
  expires_at?: string;
}

export type CreateSliderOverrideResponse = ApiResponse<SliderOverride>;

// ---------------------------------------------------------------------------
// Audit API
// ---------------------------------------------------------------------------

/** GET /api/audit */
export interface ListAuditLogsParams extends PaginationParams {
  entity_type?: string;
  entity_id?: string;
  who?: string;
  what?: string;
  date_from?: string;
  date_to?: string;
}

export type ListAuditLogsResponse = PaginatedResponse<AuditLogEntry>;

// ---------------------------------------------------------------------------
// Analytics API
// ---------------------------------------------------------------------------

/** GET /api/analytics/events */
export interface ListAnalyticsEventsParams extends PaginationParams {
  event_type?: string;
  date_from?: string;
  date_to?: string;
  conversation_id?: string;
  lead_id?: string;
}

export type ListAnalyticsEventsResponse = PaginatedResponse<AnalyticsEvent>;

/** GET /api/analytics/metrics */
export interface GetAnalyticsMetricsParams {
  period: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
}

export type GetAnalyticsMetricsResponse = ApiResponse<AnalyticsMetric[]>;

/** GET /api/analytics/dashboard */
export interface GetDashboardParams {
  period?: 'day' | 'week' | 'month';
}

export type GetDashboardResponse = ApiResponse<{
  conversations: AnalyticsMetric;
  leads: AnalyticsMetric;
  bookings: AnalyticsMetric;
  conversion_rate: AnalyticsMetric;
  avg_response_time: AnalyticsMetric;
  escalation_rate: AnalyticsMetric;
  satisfaction_score: AnalyticsMetric;
}>;

// ---------------------------------------------------------------------------
// Auth / Users API
// ---------------------------------------------------------------------------

/** POST /api/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = ApiResponse<{
  token: string;
  user: User;
  expires_at: string;
}>;

/** GET /api/users */
export interface ListUsersParams extends PaginationParams {
  role?: Role;
  active?: boolean;
}

export type ListUsersResponse = PaginatedResponse<User>;

/** GET /api/users/me */
export type GetCurrentUserResponse = ApiResponse<User>;

// ---------------------------------------------------------------------------
// Orchestration API
// ---------------------------------------------------------------------------

/** GET /api/orchestration/traces */
export interface ListOrchestrationTracesParams extends PaginationParams {
  conversation_id?: string;
  date_from?: string;
  date_to?: string;
}

export type ListOrchestrationTracesResponse = PaginatedResponse<OrchestrationTrace>;

// ---------------------------------------------------------------------------
// Test Sessions API
// ---------------------------------------------------------------------------

/** POST /api/test-sessions */
export interface CreateTestSessionRequest {
  name: string;
  description?: string;
  playbook_id?: string;
  slider_overrides?: Record<string, number>;
}

export type CreateTestSessionResponse = ApiResponse<TestSession>;

/** POST /api/test-sessions/:id/message */
export interface TestSessionMessageRequest {
  patient_message: string;
}

export type TestSessionMessageResponse = ApiResponse<{
  bot_response: string;
  trace: import('./test-session').ResponseTrace;
}>;

/** PATCH /api/test-sessions/:id/turns/:turnNumber */
export interface EvaluateTestTurnRequest {
  outcome: 'pass' | 'partial' | 'fail';
  operator_notes?: string;
}

export type EvaluateTestTurnResponse = ApiResponse<TestSession>;

/** GET /api/test-sessions */
export interface ListTestSessionsParams extends PaginationParams {
  operator_id?: string;
  playbook_id?: string;
  status?: string;
}

export type ListTestSessionsResponse = PaginatedResponse<TestSession>;
