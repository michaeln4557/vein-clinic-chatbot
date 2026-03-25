import { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Eye,
  Send,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  PhoneOff,
  Heart,
  AlertTriangle,
  Settings,
  Star,
  ArrowRight,
  Wrench,
  BarChart3,
  Map as MapIcon,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

/* ══════════════════════════════════════════════
   PLAYBOOK DATA MODEL
   ══════════════════════════════════════════════ */

type PlaybookStatus = 'draft' | 'review' | 'published' | 'archived';
type PlaybookTier = 'primary' | 'secondary' | 'background';
type PlaybookGroup =
  | 'core_revenue'
  | 'growth_recovery'
  | 'patient_experience'
  | 'exceptions_escalation'
  | 'system_routing';

/** Journey stages — ordered by real patient conversation flow */
type JourneyStage = 'entry' | 'intake' | 'qualification' | 'friction' | 'conversion' | 'exception';

/** Exit type for a playbook within a conversation:
 *  progressed — moved to the next playbook in the journey
 *  converted  — booking completed inside this playbook
 *  escalated  — human handoff triggered
 *  dropped    — patient stopped responding
 *  blocked    — no availability or constraint prevented progress
 */
type PlaybookExitType = 'progressed' | 'converted' | 'escalated' | 'dropped' | 'blocked';

interface Playbook {
  id: string;
  name: string;
  description: string;
  status: PlaybookStatus;
  version: string;
  lastModified: string;
  modifiedBy: string;
  category: string;
  triggerIntents: string[];
  channels: ('sms' | 'chat' | 'voice')[];
  steps: number;
  requiredFields: string[];
  toneProfile: string;
  escalationEnabled: boolean;
  routesTo: string[];
  conversionRate?: number;
  avgResponseTime?: string;
  group: PlaybookGroup;
  tier: PlaybookTier;
  totalConversions?: number;
  conversationVolume?: number;
  journeyStage: JourneyStage;
}

/* ──────────────────────────────────────────────
   PLAYBOOK FLOW TRACKING DATA MODEL
   ──────────────────────────────────────────────
   For each conversation, we store an ordered list
   of playbook steps showing how the patient moved
   through the system. Each step records:
   - which playbook was entered
   - how the patient exited that playbook
   This enables per-playbook funnel analysis.
   ────────────────────────────────────────────── */

interface PlaybookFlowStep {
  playbookId: string;
  entered: boolean;
  exitType: PlaybookExitType;
}

interface ConversationFlow {
  conversationId: string;
  playbookSequence: PlaybookFlowStep[];
}

/** Aggregated metrics per playbook (derived from flow data) */
interface PlaybookFunnelMetrics {
  playbookId: string;
  enteredCount: number;
  progressedCount: number;
  conversionCount: number;
  escalationCount: number;
  dropoffCount: number;
  blockedCount: number;
  // Derived rates
  progressionRate: number;
  conversionRate: number;
  escalationRate: number;
  dropoffRate: number;
  blockedRate: number;
}

/* ──────────────────────────────────────────────
   Mock conversation flow data
   Represents 12 conversations flowing through
   multi-playbook journeys
   ────────────────────────────────────────────── */

const mockConversationFlows: ConversationFlow[] = [
  // Happy path: Greeting → Inbound → Screening → Scheduling → Converted
  { conversationId: 'CF-01', playbookSequence: [
    { playbookId: 'pb-7', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-6', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-4', entered: true, exitType: 'converted' },
  ]},
  { conversationId: 'CF-02', playbookSequence: [
    { playbookId: 'pb-7', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-6', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-4', entered: true, exitType: 'converted' },
  ]},
  // Drop at insurance
  { conversationId: 'CF-03', playbookSequence: [
    { playbookId: 'pb-7', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-3', entered: true, exitType: 'dropped' },
  ]},
  { conversationId: 'CF-04', playbookSequence: [
    { playbookId: 'pb-7', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-3', entered: true, exitType: 'dropped' },
  ]},
  { conversationId: 'CF-05', playbookSequence: [
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-3', entered: true, exitType: 'dropped' },
  ]},
  // Escalated at insurance
  { conversationId: 'CF-06', playbookSequence: [
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-3', entered: true, exitType: 'escalated' },
  ]},
  // Missed call recovery → converted
  { conversationId: 'CF-07', playbookSequence: [
    { playbookId: 'pb-2', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-4', entered: true, exitType: 'converted' },
  ]},
  { conversationId: 'CF-08', playbookSequence: [
    { playbookId: 'pb-2', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-6', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-4', entered: true, exitType: 'converted' },
  ]},
  // Missed call recovery → dropped
  { conversationId: 'CF-09', playbookSequence: [
    { playbookId: 'pb-2', entered: true, exitType: 'dropped' },
  ]},
  // Blocked at scheduling
  { conversationId: 'CF-10', playbookSequence: [
    { playbookId: 'pb-1', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-6', entered: true, exitType: 'progressed' },
    { playbookId: 'pb-4', entered: true, exitType: 'blocked' },
  ]},
  // Complaint → escalated
  { conversationId: 'CF-11', playbookSequence: [
    { playbookId: 'pb-12', entered: true, exitType: 'escalated' },
  ]},
  // Greeting → dropped early
  { conversationId: 'CF-12', playbookSequence: [
    { playbookId: 'pb-7', entered: true, exitType: 'dropped' },
  ]},
];

/* ──────────────────────────────────────────────
   Aggregation: compute per-playbook funnel metrics
   from raw conversation flow data
   ────────────────────────────────────────────── */

function computePlaybookFunnelMetrics(flows: ConversationFlow[]): PlaybookFunnelMetrics[] {
  const metricsMap = new Map<string, { entered: number; progressed: number; converted: number; escalated: number; dropped: number; blocked: number }>();

  for (const flow of flows) {
    for (const step of flow.playbookSequence) {
      if (!step.entered) continue;
      if (!metricsMap.has(step.playbookId)) {
        metricsMap.set(step.playbookId, { entered: 0, progressed: 0, converted: 0, escalated: 0, dropped: 0, blocked: 0 });
      }
      const m = metricsMap.get(step.playbookId)!;
      m.entered++;
      switch (step.exitType) {
        case 'progressed': m.progressed++; break;
        case 'converted': m.converted++; break;
        case 'escalated': m.escalated++; break;
        case 'dropped': m.dropped++; break;
        case 'blocked': m.blocked++; break;
      }
    }
  }

  return Array.from(metricsMap.entries()).map(([playbookId, m]) => ({
    playbookId,
    enteredCount: m.entered,
    progressedCount: m.progressed,
    conversionCount: m.converted,
    escalationCount: m.escalated,
    dropoffCount: m.dropped,
    blockedCount: m.blocked,
    progressionRate: Math.round((m.progressed / Math.max(m.entered, 1)) * 100),
    conversionRate: Math.round((m.converted / Math.max(m.entered, 1)) * 100),
    escalationRate: Math.round((m.escalated / Math.max(m.entered, 1)) * 100),
    dropoffRate: Math.round((m.dropped / Math.max(m.entered, 1)) * 100),
    blockedRate: Math.round((m.blocked / Math.max(m.entered, 1)) * 100),
  }));
}

const playbookFunnelMetrics = computePlaybookFunnelMetrics(mockConversationFlows);

/* ──────────────────────────────────────────────
   Failure detection thresholds
   ────────────────────────────────────────────── */
const DROPOFF_THRESHOLD = 25;
const ESCALATION_THRESHOLD = 20;
const BOTTLENECK_THRESHOLD = 15; // progression rate drop vs expected

interface FailureFlag {
  type: 'high_dropoff' | 'high_escalation' | 'bottleneck' | 'blocked';
  label: string;
  severity: 'critical' | 'warning';
}

function detectFailures(metrics: PlaybookFunnelMetrics): FailureFlag[] {
  const flags: FailureFlag[] = [];
  if (metrics.dropoffRate >= DROPOFF_THRESHOLD) {
    flags.push({
      type: 'high_dropoff',
      label: `${metrics.dropoffRate}% drop-off`,
      severity: metrics.dropoffRate >= 40 ? 'critical' : 'warning',
    });
  }
  if (metrics.escalationRate >= ESCALATION_THRESHOLD) {
    flags.push({
      type: 'high_escalation',
      label: `${metrics.escalationRate}% escalation`,
      severity: metrics.escalationRate >= 30 ? 'critical' : 'warning',
    });
  }
  if (metrics.blockedRate > 10) {
    flags.push({
      type: 'blocked',
      label: `${metrics.blockedRate}% blocked`,
      severity: 'warning',
    });
  }
  return flags;
}

/* ──────────────────────────────────────────────
   Flow View: compute common playbook transitions
   ────────────────────────────────────────────── */

interface FlowTransition {
  from: string;
  to: string;
  count: number;
  dropoffAtFrom: number;
}

function computeFlowTransitions(flows: ConversationFlow[], playbooks: Playbook[]): FlowTransition[] {
  const transMap = new Map<string, { count: number }>();
  const dropoffs = new Map<string, number>();

  for (const flow of flows) {
    const seq = flow.playbookSequence;
    for (let i = 0; i < seq.length; i++) {
      if (seq[i].exitType === 'dropped' || seq[i].exitType === 'blocked') {
        dropoffs.set(seq[i].playbookId, (dropoffs.get(seq[i].playbookId) || 0) + 1);
      }
      if (i < seq.length - 1 && seq[i].exitType === 'progressed') {
        const key = `${seq[i].playbookId}→${seq[i + 1].playbookId}`;
        const existing = transMap.get(key);
        if (existing) existing.count++;
        else transMap.set(key, { count: 1 });
      }
    }
  }

  const nameMap = new Map(playbooks.map((p) => [p.id, p.name]));

  return Array.from(transMap.entries())
    .map(([key, val]) => {
      const [fromId, toId] = key.split('→');
      return {
        from: nameMap.get(fromId) || fromId,
        to: nameMap.get(toId) || toId,
        count: val.count,
        dropoffAtFrom: dropoffs.get(fromId) || 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/* ──────────────────────────────────────────────
   Group metadata (unchanged from previous)
   ────────────────────────────────────────────── */

interface GroupMeta {
  key: PlaybookGroup;
  label: string;
  subtitle: string;
  icon: typeof TrendingUp;
  color: string;
  defaultCollapsed: boolean;
}

const groupOrder: GroupMeta[] = [
  { key: 'core_revenue', label: 'Core Revenue Playbooks', subtitle: 'Flows that turn inquiries into booked patients', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', defaultCollapsed: false },
  { key: 'growth_recovery', label: 'Growth & Recovery', subtitle: 'Flows that recover missed demand and re-engage patients', icon: PhoneOff, color: 'text-purple-600 bg-purple-50', defaultCollapsed: false },
  { key: 'patient_experience', label: 'Patient Experience', subtitle: 'Flows that improve engagement and front-door experience', icon: Heart, color: 'text-sky-600 bg-sky-50', defaultCollapsed: false },
  { key: 'exceptions_escalation', label: 'Exceptions & Escalation', subtitle: 'Flows that safely route edge cases and human-required issues', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', defaultCollapsed: false },
  { key: 'system_routing', label: 'System & Routing', subtitle: 'Backend logic and utility routing workflows', icon: Settings, color: 'text-gray-500 bg-gray-100', defaultCollapsed: true },
];

/* ──────────────────────────────────────────────
   Mock Playbooks (same data as before)
   ────────────────────────────────────────────── */

const mockPlaybooks: Playbook[] = [
  { id: 'pb-1', name: 'Inbound New Patient', description: 'Handles first-time patient inquiries, gathers symptoms and insurance info', status: 'published', version: 'v3.2', lastModified: '2026-03-18', modifiedBy: 'Sarah M.', category: 'Inbound', triggerIntents: ['new_patient_inquiry', 'first_visit', 'general_question'], channels: ['sms', 'chat'], steps: 6, requiredFields: ['name', 'phone', 'insurance', 'symptoms'], toneProfile: 'Warm & Professional', escalationEnabled: true, routesTo: ['Booking Conversion', 'Insurance Collection'], conversionRate: 68, avgResponseTime: '< 2 min', group: 'core_revenue', tier: 'primary', totalConversions: 8, conversationVolume: 12, journeyStage: 'intake' },
  { id: 'pb-4', name: 'Appointment Scheduling', description: 'Books consultations with provider availability and location matching', status: 'published', version: 'v4.1', lastModified: '2026-03-15', modifiedBy: 'Mike R.', category: 'Scheduling', triggerIntents: ['wants_appointment', 'ready_to_book', 'schedule_request'], channels: ['sms', 'chat', 'voice'], steps: 7, requiredFields: ['name', 'phone', 'location', 'insurance', 'preferred_time'], toneProfile: 'Efficient & Warm', escalationEnabled: false, routesTo: ['Location Routing', 'Scheduling Unavailable'], conversionRate: 82, avgResponseTime: '< 4 min', group: 'core_revenue', tier: 'primary', totalConversions: 6, conversationVolume: 7, journeyStage: 'conversion' },
  { id: 'pb-6', name: 'Vein Screening Qualification', description: 'Pre-screens patients for vein treatment eligibility based on symptoms', status: 'published', version: 'v3.0', lastModified: '2026-03-12', modifiedBy: 'Sarah M.', category: 'Screening', triggerIntents: ['symptom_inquiry', 'eligibility_check', 'do_i_need_treatment'], channels: ['chat', 'sms'], steps: 5, requiredFields: ['symptoms', 'duration', 'severity'], toneProfile: 'Empathetic & Informative', escalationEnabled: true, routesTo: ['Booking Conversion', 'FAQ'], conversionRate: 61, avgResponseTime: '< 3 min', group: 'core_revenue', tier: 'primary', totalConversions: 4, conversationVolume: 6, journeyStage: 'qualification' },
  { id: 'pb-3', name: 'Insurance Pre-Authorization', description: 'Guides patients through insurance verification and pre-auth requirements', status: 'review', version: 'v1.4', lastModified: '2026-03-20', modifiedBy: 'Sarah M.', category: 'Insurance', triggerIntents: ['insurance_question', 'coverage_inquiry', 'pre_auth_needed'], channels: ['sms', 'chat'], steps: 7, requiredFields: ['name', 'insurance_provider', 'member_id', 'procedure_type'], toneProfile: 'Reassuring & Detailed', escalationEnabled: true, routesTo: ['Booking Conversion', 'Human Handoff'], conversionRate: 55, avgResponseTime: '< 3 min', group: 'core_revenue', tier: 'primary', totalConversions: 3, conversationVolume: 5, journeyStage: 'friction' },
  { id: 'pb-2', name: 'Missed Call Recovery', description: 'Automated SMS follow-up for unreturned calls within business hours', status: 'published', version: 'v2.8', lastModified: '2026-03-17', modifiedBy: 'Dr. Garcia', category: 'Recovery', triggerIntents: ['missed_call_detected'], channels: ['sms'], steps: 5, requiredFields: ['phone'], toneProfile: 'Warm & Concise', escalationEnabled: true, routesTo: ['Booking Conversion', 'Callback Request', 'FAQ'], conversionRate: 42, avgResponseTime: '< 2 min', group: 'growth_recovery', tier: 'primary', totalConversions: 5, conversationVolume: 10, journeyStage: 'entry' },
  { id: 'pb-10', name: 'Patient Reactivation', description: 'Re-engages patients who missed follow-ups or dropped off care plan', status: 'draft', version: 'v0.4', lastModified: '2026-03-20', modifiedBy: 'Dr. Garcia', category: 'Recovery', triggerIntents: ['patient_inactive_30d', 'missed_follow_up'], channels: ['sms'], steps: 4, requiredFields: ['patient_name', 'last_visit_date'], toneProfile: 'Gentle & Non-Pushy', escalationEnabled: false, routesTo: ['Booking Conversion'], conversionRate: undefined, avgResponseTime: 'Scheduled', group: 'growth_recovery', tier: 'secondary', conversationVolume: 0, journeyStage: 'entry' },
  { id: 'pb-7', name: 'Web Chat Greeting', description: 'Initial engagement for website visitors with contextual responses', status: 'published', version: 'v2.5', lastModified: '2026-03-10', modifiedBy: 'Mike R.', category: 'Inbound', triggerIntents: ['chat_opened', 'website_visitor'], channels: ['chat'], steps: 3, requiredFields: [], toneProfile: 'Friendly & Brief', escalationEnabled: false, routesTo: ['Inbound New Patient', 'FAQ', 'Booking Conversion'], conversionRate: 38, avgResponseTime: 'Instant', group: 'patient_experience', tier: 'secondary', conversationVolume: 8, journeyStage: 'entry' },
  { id: 'pb-8', name: 'After-Hours Handler', description: 'Manages inquiries outside business hours with appropriate expectations', status: 'published', version: 'v1.8', lastModified: '2026-03-09', modifiedBy: 'Sarah M.', category: 'Inbound', triggerIntents: ['after_hours_message', 'off_hours_call'], channels: ['sms', 'chat'], steps: 3, requiredFields: [], toneProfile: 'Warm & Expectation-Setting', escalationEnabled: false, routesTo: ['Callback Request'], conversionRate: 29, avgResponseTime: 'Instant', group: 'patient_experience', tier: 'secondary', conversationVolume: 4, journeyStage: 'entry' },
  { id: 'pb-9', name: 'Appointment Reminder', description: 'Sends confirmation and reminder sequences before scheduled visits', status: 'published', version: 'v2.3', lastModified: '2026-03-08', modifiedBy: 'Mike R.', category: 'Scheduling', triggerIntents: ['reminder_trigger', 'appointment_approaching'], channels: ['sms'], steps: 4, requiredFields: ['patient_name', 'appointment_date', 'location'], toneProfile: 'Friendly & Direct', escalationEnabled: false, routesTo: ['Booking Conversion'], conversionRate: undefined, avgResponseTime: 'Scheduled', group: 'patient_experience', tier: 'secondary', conversationVolume: 6, journeyStage: 'conversion' },
  { id: 'pb-5', name: 'Post-Procedure Follow-Up', description: 'Automated check-ins after treatment, monitors recovery symptoms', status: 'published', version: 'v2.0', lastModified: '2026-03-14', modifiedBy: 'Dr. Garcia', category: 'Follow-Up', triggerIntents: ['post_procedure_trigger', 'recovery_check'], channels: ['sms'], steps: 4, requiredFields: ['patient_name', 'procedure_date', 'procedure_type'], toneProfile: 'Caring & Clinical', escalationEnabled: true, routesTo: ['Human Handoff', 'Callback Request'], conversionRate: undefined, avgResponseTime: 'Scheduled', group: 'patient_experience', tier: 'secondary', conversationVolume: 3, journeyStage: 'conversion' },
  { id: 'pb-12', name: 'Complaint Escalation', description: 'Identifies dissatisfied patients and routes to management', status: 'published', version: 'v1.5', lastModified: '2026-03-06', modifiedBy: 'Dr. Garcia', category: 'Escalation', triggerIntents: ['negative_sentiment', 'complaint', 'frustrated_patient'], channels: ['sms', 'chat', 'voice'], steps: 4, requiredFields: ['patient_name', 'issue_description'], toneProfile: 'Empathetic & Urgent', escalationEnabled: true, routesTo: ['Human Handoff'], conversionRate: undefined, avgResponseTime: '< 1 min', group: 'exceptions_escalation', tier: 'background', conversationVolume: 2, journeyStage: 'exception' },
  { id: 'pb-11', name: 'Referral Processing', description: 'Handles incoming physician referrals and patient onboarding', status: 'draft', version: 'v0.2', lastModified: '2026-03-19', modifiedBy: 'Sarah M.', category: 'Inbound', triggerIntents: ['physician_referral', 'referral_received'], channels: ['sms', 'chat'], steps: 6, requiredFields: ['patient_name', 'referring_physician', 'referral_reason', 'insurance'], toneProfile: 'Professional & Thorough', escalationEnabled: true, routesTo: ['Booking Conversion', 'Insurance Collection'], conversionRate: undefined, avgResponseTime: '< 5 min', group: 'exceptions_escalation', tier: 'background', conversationVolume: 1, journeyStage: 'intake' },
  { id: 'pb-13', name: 'Multi-Location Routing', description: 'Directs patients to nearest/preferred location based on availability', status: 'archived', version: 'v1.0', lastModified: '2026-02-28', modifiedBy: 'Mike R.', category: 'Scheduling', triggerIntents: ['location_inquiry', 'nearest_location', 'zip_code_provided'], channels: ['sms', 'chat'], steps: 3, requiredFields: ['zip_code'], toneProfile: 'Helpful & Efficient', escalationEnabled: false, routesTo: ['Booking Conversion'], conversionRate: 74, avgResponseTime: 'Instant', group: 'system_routing', tier: 'background', conversationVolume: 4, journeyStage: 'conversion' },
];

const channelLabels: Record<string, string> = { sms: 'SMS', chat: 'Chat', voice: 'Voice' };

/* ──────────────────────────────────────────────
   JOURNEY STAGE METADATA & ORDERING
   ────────────────────────────────────────────── */

interface JourneyStageMeta {
  key: JourneyStage;
  label: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;        // text color class
  bgColor: string;      // background color class
  borderColor: string;  // ring / border for highlight
  stageNumber: number;
}

const journeyStageOrder: JourneyStageMeta[] = [
  { key: 'entry', label: 'Entry', description: 'First touchpoints — web chat, missed calls, after-hours, reactivation', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', stageNumber: 1 },
  { key: 'intake', label: 'Intake', description: 'Gathering patient information — symptoms, insurance, contact details', icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', stageNumber: 2 },
  { key: 'qualification', label: 'Qualification', description: 'Screening patients for eligibility and treatment candidacy', icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', stageNumber: 3 },
  { key: 'friction', label: 'Friction / Decision', description: 'Points where patients face barriers — insurance, hesitation, objections', icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', stageNumber: 4 },
  { key: 'conversion', label: 'Conversion', description: 'Booking, scheduling, reminders, and post-procedure follow-up', icon: Star, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', stageNumber: 5 },
  { key: 'exception', label: 'Exceptions', description: 'Edge cases — complaints, escalations, and safety routing', icon: PhoneOff, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', stageNumber: 6 },
];

/** Stage-level aggregated metrics (summed across all playbooks in the stage) */
interface StageSummary {
  totalEntered: number;
  avgProgressionRate: number;
  totalDropoff: number;
  totalEscalated: number;
  hasHighestDropoff: boolean;
}

function computeStageSummaries(
  stages: JourneyStageMeta[],
  playbooks: Playbook[],
  funnelMetrics: PlaybookFunnelMetrics[],
): Map<JourneyStage, StageSummary> {
  const summaries = new Map<JourneyStage, StageSummary>();

  let maxDropoffStage: JourneyStage | null = null;
  let maxDropoffRate = -1;

  for (const stage of stages) {
    const stagePlaybooks = playbooks.filter((pb) => pb.journeyStage === stage.key);
    const stageMetrics = stagePlaybooks
      .map((pb) => funnelMetrics.find((m) => m.playbookId === pb.id))
      .filter(Boolean) as PlaybookFunnelMetrics[];

    const totalEntered = stageMetrics.reduce((sum, m) => sum + m.enteredCount, 0);
    const totalDropoff = stageMetrics.reduce((sum, m) => sum + m.dropoffCount, 0);
    const totalEscalated = stageMetrics.reduce((sum, m) => sum + m.escalationCount, 0);
    const avgProgressionRate = stageMetrics.length > 0
      ? Math.round(stageMetrics.reduce((sum, m) => sum + m.progressionRate, 0) / stageMetrics.length)
      : 0;

    const dropoffRate = totalEntered > 0 ? (totalDropoff / totalEntered) * 100 : 0;
    if (dropoffRate > maxDropoffRate) {
      maxDropoffRate = dropoffRate;
      maxDropoffStage = stage.key;
    }

    summaries.set(stage.key, { totalEntered, avgProgressionRate, totalDropoff, totalEscalated, hasHighestDropoff: false });
  }

  // Mark the stage with highest drop-off
  if (maxDropoffStage && maxDropoffRate > 0) {
    const s = summaries.get(maxDropoffStage)!;
    summaries.set(maxDropoffStage, { ...s, hasHighestDropoff: true });
  }

  return summaries;
}

/* ══════════════════════════════════════════════
   BUILDER VIEW CARD (existing streamlined card)
   ══════════════════════════════════════════════ */

function PlaybookCard({ pb }: { pb: Playbook }) {
  const [expanded, setExpanded] = useState(false);
  const isPrimary = pb.tier === 'primary';

  return (
    <div className={`card overflow-hidden transition-shadow ${isPrimary ? 'ring-1 ring-emerald-200/60' : ''}`}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {isPrimary && <Star className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" />}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{pb.name}</h3>
            <p className="text-[10px] text-healthcare-muted">{pb.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge variant={pb.status} label={pb.status} />
          <button className="btn-ghost p-1" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
          <button className="btn-ghost p-1" title="Preview"><Eye className="w-3.5 h-3.5" /></button>
          {pb.status === 'review' && (
            <button className="btn-primary text-[10px] px-2 py-1" title="Publish">
              <Send className="w-3 h-3" /> Publish
            </button>
          )}
          <button className="btn-ghost p-1" title="More"><MoreHorizontal className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="card-body space-y-2.5">
        <p className="text-xs text-healthcare-muted leading-relaxed">{pb.description}</p>
        <div className="flex items-center gap-4 text-xs">
          {pb.conversionRate !== undefined && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <TrendingUp className="w-3 h-3" />{pb.conversionRate}% conversion
            </span>
          )}
          {pb.totalConversions !== undefined && pb.totalConversions > 0 && (
            <span className="text-teal-600 font-medium">{pb.totalConversions} conversions</span>
          )}
          {pb.conversationVolume !== undefined && pb.conversationVolume > 0 && (
            <span className="text-healthcare-muted"><Users className="w-3 h-3 inline mr-0.5" />{pb.conversationVolume} convos</span>
          )}
        </div>
        {pb.routesTo.length > 0 && (
          <p className="text-[10px] text-healthcare-muted">Routes to: {pb.routesTo.join(', ')}</p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-healthcare-border">
          <span className="text-[10px] text-healthcare-muted">{pb.version} · Modified {pb.lastModified} by {pb.modifiedBy}</span>
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-brand-600 hover:text-brand-800 font-medium flex items-center gap-0.5">
            {expanded ? 'Hide' : 'Details'}
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>
        {expanded && (
          <div className="space-y-2 pt-2 border-t border-healthcare-border/50">
            <DetailRow label="Triggers">
              {pb.triggerIntents.map((t) => <span key={t} className="badge bg-amber-50 text-amber-700">{t.replace(/_/g, ' ')}</span>)}
            </DetailRow>
            <DetailRow label="Channels">
              {pb.channels.map((ch) => <span key={ch} className="badge bg-blue-50 text-blue-700">{channelLabels[ch]}</span>)}
            </DetailRow>
            {pb.requiredFields.length > 0 && (
              <DetailRow label="Required Fields">
                {pb.requiredFields.map((f) => <span key={f} className="badge bg-gray-100 text-gray-600">{f.replace(/_/g, ' ')}</span>)}
              </DetailRow>
            )}
            <div className="flex items-center gap-4 text-[10px] text-healthcare-muted">
              <span>Tone: {pb.toneProfile}</span>
              <span>{pb.steps} steps</span>
              <span>Response: {pb.avgResponseTime}</span>
              {pb.escalationEnabled && <span className="text-amber-600">Escalation enabled</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-healthcare-muted mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MANAGER VIEW CARD
   Shows funnel metrics + failure flags
   ══════════════════════════════════════════════ */

function ManagerCard({ pb, metrics }: { pb: Playbook; metrics: PlaybookFunnelMetrics | undefined }) {
  if (!metrics) {
    return (
      <div className="card card-body">
        <h3 className="text-sm font-semibold">{pb.name}</h3>
        <p className="text-[10px] text-healthcare-muted mt-1">No flow data available</p>
      </div>
    );
  }

  const failures = detectFailures(metrics);
  const hasFailure = failures.some((f) => f.severity === 'critical');
  const hasWarning = failures.some((f) => f.severity === 'warning') && !hasFailure;

  return (
    <div className={`card overflow-hidden ${hasFailure ? 'ring-1 ring-red-300' : hasWarning ? 'ring-1 ring-amber-200' : ''}`}>
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{pb.name}</h3>
          <p className="text-[10px] text-healthcare-muted">{pb.category}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge variant={pb.status} label={pb.status} />
          {failures.map((f, i) => (
            <span
              key={i}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                f.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      <div className="card-body">
        {/* Primary KPI: Progression Rate */}
        <div className="flex items-center gap-6 mb-3">
          <div>
            <p className="text-[10px] text-healthcare-muted">Entered</p>
            <p className="text-lg font-bold">{metrics.enteredCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-healthcare-muted">Progression Rate</p>
            <p className={`text-lg font-bold ${metrics.progressionRate >= 60 ? 'text-emerald-600' : metrics.progressionRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
              {metrics.progressionRate}%
            </p>
          </div>
        </div>

        {/* Exit breakdown bar */}
        <div className="space-y-1.5">
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
            {metrics.progressionRate > 0 && (
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${metrics.progressionRate}%` }} title={`Progressed: ${metrics.progressionRate}%`} />
            )}
            {metrics.conversionRate > 0 && (
              <div className="h-full bg-teal-500 transition-all" style={{ width: `${metrics.conversionRate}%` }} title={`Converted: ${metrics.conversionRate}%`} />
            )}
            {metrics.escalationRate > 0 && (
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${metrics.escalationRate}%` }} title={`Escalated: ${metrics.escalationRate}%`} />
            )}
            {metrics.dropoffRate > 0 && (
              <div className="h-full bg-red-400 transition-all" style={{ width: `${metrics.dropoffRate}%` }} title={`Dropped: ${metrics.dropoffRate}%`} />
            )}
            {metrics.blockedRate > 0 && (
              <div className="h-full bg-gray-400 transition-all" style={{ width: `${metrics.blockedRate}%` }} title={`Blocked: ${metrics.blockedRate}%`} />
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
            {metrics.progressedCount > 0 && (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Progressed {metrics.progressionRate}%</span>
            )}
            {metrics.conversionCount > 0 && (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" />Converted {metrics.conversionRate}%</span>
            )}
            {metrics.escalationCount > 0 && (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Escalated {metrics.escalationRate}%</span>
            )}
            {metrics.dropoffCount > 0 && (
              <span className={`flex items-center gap-1 ${metrics.dropoffRate >= DROPOFF_THRESHOLD ? 'font-bold text-red-600' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-red-400" />Dropped {metrics.dropoffRate}%
              </span>
            )}
            {metrics.blockedCount > 0 && (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />Blocked {metrics.blockedRate}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   JOURNEY CARD (clean manager card for journey view)
   Shows: name, entered, progression rate, drop-off/escalation, bar
   ══════════════════════════════════════════════ */

function JourneyCard({ pb, metrics }: { pb: Playbook; metrics: PlaybookFunnelMetrics | undefined }) {
  if (!metrics) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-healthcare-border/50">
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{pb.name}</h4>
          <p className="text-[10px] text-healthcare-muted mt-0.5">No flow data</p>
        </div>
        <StatusBadge variant={pb.status} label={pb.status} />
      </div>
    );
  }

  const failures = detectFailures(metrics);
  const hasCritical = failures.some((f) => f.severity === 'critical');
  const hasWarning = failures.some((f) => f.severity === 'warning') && !hasCritical;

  const progressionColor = metrics.progressionRate >= 60
    ? 'text-emerald-600' : metrics.progressionRate >= 40
    ? 'text-amber-600' : 'text-red-600';

  return (
    <div className={`rounded-lg border px-4 py-3 transition-all ${
      hasCritical ? 'bg-red-50/60 border-red-300 ring-1 ring-red-200' :
      hasWarning ? 'bg-amber-50/40 border-amber-200' :
      'bg-white border-healthcare-border/60'
    }`}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Name + failure badges */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h4 className="text-sm font-semibold">{pb.name}</h4>
          {failures.map((f, i) => (
            <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
              f.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>{f.label}</span>
          ))}
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-5 shrink-0 text-center">
          <div>
            <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Entered</p>
            <p className="text-sm font-bold">{metrics.enteredCount}</p>
          </div>
          <div>
            <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Progression</p>
            <p className={`text-sm font-bold ${progressionColor}`}>{metrics.progressionRate}%</p>
          </div>
          {metrics.dropoffCount > 0 && (
            <div>
              <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Drop-off</p>
              <p className={`text-sm font-bold ${metrics.dropoffRate >= DROPOFF_THRESHOLD ? 'text-red-600' : 'text-gray-500'}`}>
                {metrics.dropoffRate}%
              </p>
            </div>
          )}
          {metrics.escalationCount > 0 && (
            <div>
              <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Escalated</p>
              <p className={`text-sm font-bold ${metrics.escalationRate >= ESCALATION_THRESHOLD ? 'text-amber-600' : 'text-gray-500'}`}>
                {metrics.escalationRate}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mini funnel bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 mt-2.5">
        {metrics.progressionRate > 0 && (
          <div className="h-full bg-emerald-500" style={{ width: `${metrics.progressionRate}%` }} />
        )}
        {metrics.conversionRate > 0 && (
          <div className="h-full bg-teal-500" style={{ width: `${metrics.conversionRate}%` }} />
        )}
        {metrics.escalationRate > 0 && (
          <div className="h-full bg-amber-500" style={{ width: `${metrics.escalationRate}%` }} />
        )}
        {metrics.dropoffRate > 0 && (
          <div className="h-full bg-red-400" style={{ width: `${metrics.dropoffRate}%` }} />
        )}
        {metrics.blockedRate > 0 && (
          <div className="h-full bg-gray-400" style={{ width: `${metrics.blockedRate}%` }} />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   JOURNEY STAGE SECTION
   Groups playbooks under a stage header with
   summary metrics and flow arrow between stages
   ══════════════════════════════════════════════ */

function JourneyStageSection({
  stage,
  playbooks,
  funnelMetrics,
  summary,
  isLast,
}: {
  stage: JourneyStageMeta;
  playbooks: Playbook[];
  funnelMetrics: PlaybookFunnelMetrics[];
  summary: StageSummary;
  isLast: boolean;
}) {
  const StageIcon = stage.icon;

  return (
    <div className="relative">
      {/* Stage container */}
      <div className={`rounded-xl border-2 overflow-hidden ${
        summary.hasHighestDropoff ? 'border-red-300 ring-2 ring-red-100' : stage.borderColor
      }`}>
        {/* Stage header */}
        <div className={`${stage.bgColor} px-5 py-3`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/80 shadow-sm shrink-0">
              <span className={`text-xs font-bold ${stage.color}`}>{stage.stageNumber}</span>
            </div>
            <StageIcon className={`w-4 h-4 ${stage.color} shrink-0`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm font-bold ${stage.color}`}>{stage.label}</h3>
                {summary.hasHighestDropoff && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                    Highest Drop-off
                  </span>
                )}
              </div>
              <p className="text-[10px] text-healthcare-muted">{stage.description}</p>
            </div>

            {/* Stage-level summary KPIs */}
            {summary.totalEntered > 0 && (
              <div className="flex items-center gap-5 ml-auto shrink-0">
                <div className="text-center">
                  <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Entered</p>
                  <p className="text-base font-bold">{summary.totalEntered}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Avg Progression</p>
                  <p className={`text-base font-bold ${
                    summary.avgProgressionRate >= 60 ? 'text-emerald-600' :
                    summary.avgProgressionRate >= 40 ? 'text-amber-600' : 'text-red-600'
                  }`}>{summary.avgProgressionRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-healthcare-muted uppercase tracking-wide">Drop-off</p>
                  <p className={`text-base font-bold ${summary.totalDropoff > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {summary.totalDropoff}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cards within this stage */}
        <div className="p-4 space-y-2 bg-white">
          {playbooks.length === 0 ? (
            <p className="text-xs text-healthcare-muted py-2 text-center">No playbooks in this stage</p>
          ) : (
            playbooks.map((pb) => (
              <JourneyCard
                key={pb.id}
                pb={pb}
                metrics={funnelMetrics.find((m) => m.playbookId === pb.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Arrow connector to next stage */}
      {!isLast && (
        <div className="flex justify-center py-1.5">
          <div className="flex flex-col items-center text-healthcare-muted">
            <div className="w-px h-3 bg-gray-300" />
            <ChevronDown className="w-4 h-4 -mt-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   FLOW VIEW COMPONENT
   Shows playbook-to-playbook transitions
   ══════════════════════════════════════════════ */

function FlowView({ playbooks }: { playbooks: Playbook[] }) {
  const transitions = computeFlowTransitions(mockConversationFlows, playbooks);

  // Find the most common full path
  const pathCounts = new Map<string, number>();
  for (const flow of mockConversationFlows) {
    const names = flow.playbookSequence.map((s) => {
      const pb = playbooks.find((p) => p.id === s.playbookId);
      return pb?.name || s.playbookId;
    });
    const path = names.join(' → ');
    pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
  }
  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Transition Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Playbook Transitions</h3>
          <p className="text-[10px] text-healthcare-muted mt-0.5">How conversations move between playbooks</p>
        </div>
        <div className="card-body">
          <div className="space-y-2">
            {transitions.map((t, i) => {
              const totalFrom = playbookFunnelMetrics.find(
                (m) => playbooks.find((p) => p.id === m.playbookId)?.name === t.from
              )?.enteredCount || 1;
              const transitionRate = Math.round((t.count / totalFrom) * 100);

              return (
                <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-50">
                  <span className="text-xs font-medium w-40 truncate">{t.from}</span>
                  <div className="flex items-center gap-1.5 text-healthcare-muted">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium text-emerald-600">{transitionRate}%</span>
                  </div>
                  <span className="text-xs font-medium w-40 truncate">{t.to}</span>
                  <span className="text-[10px] text-healthcare-muted ml-auto">{t.count} conversations</span>
                  {t.dropoffAtFrom > 0 && (
                    <span className="text-[9px] text-red-600 font-medium">
                      {t.dropoffAtFrom} dropped at {t.from}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Common Patient Journeys */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Most Common Patient Journeys</h3>
          <p className="text-[10px] text-healthcare-muted mt-0.5">Top conversation paths through the playbook system</p>
        </div>
        <div className="card-body space-y-2">
          {topPaths.map(([path, count], i) => {
            const steps = path.split(' → ');
            return (
              <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-[10px] font-bold text-healthcare-muted w-5">#{i + 1}</span>
                <div className="flex items-center gap-1 flex-wrap flex-1">
                  {steps.map((step, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-healthcare-border">
                        {step}
                      </span>
                      {j < steps.length - 1 && <ArrowRight className="w-3 h-3 text-healthcare-muted shrink-0" />}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-healthcare-muted shrink-0">{count} convos</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PLAYBOOKS PAGE
   ══════════════════════════════════════════════ */

type ViewMode = 'journey' | 'builder';

export default function PlaybooksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('journey');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlaybookStatus | 'all'>('all');
  const [showFlowView, setShowFlowView] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<PlaybookGroup>>(
    new Set(groupOrder.filter((g) => g.defaultCollapsed).map((g) => g.key))
  );

  const toggleGroup = (key: PlaybookGroup) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = mockPlaybooks.filter((pb) => {
    const matchesSearch =
      pb.name.toLowerCase().includes(search.toLowerCase()) ||
      pb.description.toLowerCase().includes(search.toLowerCase()) ||
      pb.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groupedPlaybooks = groupOrder.map((group) => ({
    ...group,
    playbooks: filtered.filter((pb) => pb.group === group.key),
  })).filter((g) => g.playbooks.length > 0);

  // Journey view: group by stage, compute stage summaries
  const stageSummaries = computeStageSummaries(journeyStageOrder, filtered, playbookFunnelMetrics);
  const journeyStages = journeyStageOrder.map((stage) => ({
    ...stage,
    playbooks: filtered.filter((pb) => pb.journeyStage === stage.key),
  }));

  // Failure summary for journey view
  const failurePlaybooks = filtered.filter((pb) => {
    const m = playbookFunnelMetrics.find((fm) => fm.playbookId === pb.id);
    return m && detectFailures(m).length > 0;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Playbooks</h1>
          <p className="text-sm text-healthcare-muted mt-1">
            {viewMode === 'journey'
              ? 'Patient journey flow — identify drop-offs, friction, and progression across stages.'
              : 'Manage the conversation flows that drive patient acquisition, booking, recovery, and exception handling.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('journey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'journey' ? 'bg-white text-healthcare-text shadow-sm' : 'text-healthcare-muted hover:text-healthcare-text'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />Journey View
            </button>
            <button
              onClick={() => setViewMode('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'builder' ? 'bg-white text-healthcare-text shadow-sm' : 'text-healthcare-muted hover:text-healthcare-text'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />Grid View
            </button>
          </div>
          {viewMode === 'builder' && (
            <button className="btn-primary">
              <Plus className="w-4 h-4" /> New Playbook
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input type="text" placeholder="Search playbooks..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        {viewMode === 'builder' && (
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
            {(['all', 'published', 'review', 'draft', 'archived'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-white text-healthcare-text shadow-sm' : 'text-healthcare-muted hover:text-healthcare-text'
                }`}
              >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        )}
        {viewMode === 'journey' && (
          <button
            onClick={() => setShowFlowView(!showFlowView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showFlowView ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-healthcare-muted border-healthcare-border hover:text-healthcare-text'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Flow View
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════
         JOURNEY VIEW (Patient Journey Flow)
         ════════════════════════════════════════ */}
      {viewMode === 'journey' && (
        <>
          {/* Failure Summary Banner */}
          {failurePlaybooks.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-800">
                  {failurePlaybooks.length} playbook{failurePlaybooks.length > 1 ? 's' : ''} with failure signals
                </p>
                <p className="text-[10px] text-red-600">
                  {failurePlaybooks.map((pb) => pb.name).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Flow View (toggle) */}
          {showFlowView && <FlowView playbooks={mockPlaybooks} />}

          {/* Journey Stage Sections — vertical funnel layout */}
          {!showFlowView && (
            <div className="space-y-0">
              {journeyStages.map((stage, i) => (
                <JourneyStageSection
                  key={stage.key}
                  stage={stage}
                  playbooks={stage.playbooks}
                  funnelMetrics={playbookFunnelMetrics}
                  summary={stageSummaries.get(stage.key) || { totalEntered: 0, avgProgressionRate: 0, totalDropoff: 0, totalEscalated: 0, hasHighestDropoff: false }}
                  isLast={i === journeyStages.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
         BUILDER VIEW (existing grouped layout)
         ════════════════════════════════════════ */}
      {viewMode === 'builder' && (
        <>
          <div className="flex items-center gap-6 text-xs text-healthcare-muted">
            <span>{mockPlaybooks.length} total playbooks</span>
            <span>{mockPlaybooks.filter((p) => p.status === 'published').length} published</span>
            <span>{mockPlaybooks.filter((p) => p.tier === 'primary').length} core revenue</span>
            <span>{mockPlaybooks.filter((p) => p.status === 'draft').length} in development</span>
          </div>

          {groupedPlaybooks.map((group) => {
            const isCollapsed = collapsedGroups.has(group.key);
            const GroupIcon = group.icon;
            const [iconColor, iconBg] = group.color.split(' ');
            return (
              <div key={group.key}>
                <button onClick={() => toggleGroup(group.key)} className="w-full flex items-center gap-3 mb-3 group cursor-pointer">
                  <div className={`p-1.5 rounded-lg ${iconBg}`}>
                    <GroupIcon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-healthcare-text">{group.label}</h2>
                      <span className="text-[10px] text-healthcare-muted bg-gray-100 px-1.5 py-0.5 rounded">{group.playbooks.length}</span>
                    </div>
                    <p className="text-[10px] text-healthcare-muted">{group.subtitle}</p>
                  </div>
                  <div className="flex-1 h-px bg-healthcare-border" />
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-healthcare-muted" /> : <ChevronDown className="w-4 h-4 text-healthcare-muted" />}
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ml-10">
                    {group.playbooks.map((pb) => <PlaybookCard key={pb.id} pb={pb} />)}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-healthcare-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No playbooks match your criteria</p>
        </div>
      )}
    </div>
  );
}
