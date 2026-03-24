import {
  MessageSquare,
  CalendarCheck,
  CalendarCheck2,
  PhoneOff,
  PhoneCall,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ──────────────────────────────────────────────
   Decision Bar
   ────────────────────────────────────────────── */

export interface DecisionBarData {
  severity: 'healthy' | 'warning' | 'critical' | 'info';
  title: string;
  reason: string;
  ctaLabel: string;
  ctaTarget: string;
}

export const decisionBarData: DecisionBarData = {
  severity: 'warning',
  title: 'Callback backlog growing',
  reason: '3 callbacks waiting over 30 min',
  ctaLabel: 'View Queue',
  ctaTarget: '#callbacks',
};

/* ──────────────────────────────────────────────
   KPI / Metric Cards
   ────────────────────────────────────────────── */

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  helpText?: string;
  helperText?: string;
  status?: 'default' | 'success' | 'warning' | 'critical';
  icon: LucideIcon;
  color: string;
  sparkline: number[];
}

/* ── Row 1: Primary Performance Line ────────── */
export const kpiRow1: MetricCardData[] = [
  {
    id: 'total-conversations',
    label: 'Conversations',
    value: '7',
    delta: '+2',
    deltaDirection: 'up',
    helpText: 'Total chatbot conversation sessions where the patient responded at least once. Includes web chat, SMS, and missed-call recovery replies.',
    helperText: 'Includes web, SMS, and missed-call recovery replies',
    status: 'default',
    icon: MessageSquare,
    color: 'bg-brand-50 text-brand-600',
    sparkline: [3, 5, 4, 6, 5, 8, 7],
  },
  {
    id: 'first-message-response',
    label: 'First Response Rate',
    value: '68.5%',
    delta: '+2.1%',
    deltaDirection: 'up',
    helpText: 'Percent of conversations where the patient replied after the bot\'s first message.',
    status: 'success',       // 68.5% > 65% = healthy/green
    icon: Zap,
    color: 'bg-sky-50 text-sky-600',
    sparkline: [62, 64, 65, 66, 67, 68, 69],
  },
  {
    id: 'total-conversion-rate',
    label: 'Total Conversion',
    value: '10.0%',
    delta: '+1.2%',
    deltaDirection: 'up',
    helpText: 'Percent of conversations that resulted in either a direct bot booking or a booking completed after callback.',
    helperText: 'Includes bot + callback bookings',
    status: 'warning',       // 10% is boundary — warning/yellow (10–20%)
    icon: TrendingUp,
    color: 'bg-teal-50 text-teal-600',
    sparkline: [7, 8, 8, 9, 9, 10, 10],
  },
];

/* ── Row 2: Conversion Path + Operations ────── */
export const kpiRow2: MetricCardData[] = [
  {
    id: 'bot-bookings',
    label: 'Bot Bookings',
    value: '3',
    delta: '+1',
    deltaDirection: 'up',
    helpText: 'Appointments fully completed inside the chatbot without requiring a human callback.',
    helperText: 'Booked without human involvement',
    status: 'success',       // positive volume — neutral/success
    icon: CalendarCheck,
    color: 'bg-emerald-50 text-emerald-600',
    sparkline: [1, 2, 2, 3, 2, 3, 3],
  },
  {
    id: 'missed-call-recovery',
    label: 'Missed Call Recovery',
    value: '7.3%',
    delta: '+0.4%',
    deltaDirection: 'up',
    helpText: 'Percent of missed-call follow-up cases that turned into chatbot engagement or successful conversion, based on the selected reporting definition.',
    status: 'critical',      // 7.3% < 10% = critical/red
    icon: PhoneOff,
    color: 'bg-purple-50 text-purple-600',
    sparkline: [5, 6, 6, 7, 7, 7, 8],
  },
  {
    id: 'callback-requests',
    label: 'Callback Requests',
    value: '4',
    delta: '+2',
    deltaDirection: 'up',
    helpText: 'Number of conversations where the patient requested a callback, either immediately or later.',
    status: 'warning',       // volume metric — warning because trending up
    icon: PhoneCall,
    color: 'bg-amber-50 text-amber-600',
    sparkline: [1, 2, 1, 3, 2, 3, 4],
  },
  {
    id: 'callback-booked',
    label: 'Callback Booked',
    value: '2',
    delta: '+1',
    deltaDirection: 'up',
    helpText: 'Appointments completed after a human callback. These are NOT counted as bot bookings.',
    helperText: 'Booked after speaking with a team member',
    status: 'success',       // 2/4 = 50% callback-booked rate > 40% = healthy
    icon: CalendarCheck2,
    color: 'bg-teal-50 text-teal-600',
    sparkline: [0, 1, 1, 2, 1, 2, 2],
  },
];

/** Combined for legacy compatibility */
export const dashboardMetrics: MetricCardData[] = [...kpiRow1, ...kpiRow2];

/* ──────────────────────────────────────────────
   Legacy KPI (kept for analytics pages)
   ────────────────────────────────────────────── */

export interface KpiMetric {
  id: string;
  label: string;
  description: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: LucideIcon;
  color: string;
  sparkline: number[];
}

export const dashboardKpis: KpiMetric[] = dashboardMetrics.map((m) => ({
  id: m.id,
  label: m.label,
  description: m.helpText || '',
  value: m.value,
  change: m.delta || '',
  trend: m.deltaDirection || 'flat',
  icon: m.icon,
  color: m.color,
  sparkline: m.sparkline,
}));

/* ──────────────────────────────────────────────
   Conversion Funnel
   ────────────────────────────────────────────── */

export interface FunnelStep {
  name: string;
  value: number;
  fill: string;
  conversionFromPrev: number | null;
  dropOffFromPrev: number | null;
  status: 'good' | 'watch' | 'bad';
}

// Keep legacy alias
export type FunnelStage = FunnelStep;

export const dashboardFunnelData: FunnelStep[] = [
  { name: 'Missed Calls', value: 10, fill: '#0d9488', conversionFromPrev: null, dropOffFromPrev: null, status: 'good' },
  { name: 'SMS Sent', value: 8, fill: '#14b8a6', conversionFromPrev: 80.0, dropOffFromPrev: 20.0, status: 'good' },
  { name: 'Patient Responded', value: 5, fill: '#2dd4bf', conversionFromPrev: 62.5, dropOffFromPrev: 37.5, status: 'watch' },
  { name: 'Lead Created', value: 4, fill: '#5eead4', conversionFromPrev: 80.0, dropOffFromPrev: 20.0, status: 'good' },
  { name: 'Booking Started', value: 3, fill: '#99f6e4', conversionFromPrev: 75.0, dropOffFromPrev: 25.0, status: 'watch' },
  { name: 'Booking Confirmed', value: 2, fill: '#ccfbf1', conversionFromPrev: 66.7, dropOffFromPrev: 33.3, status: 'bad' },
];

/* ──────────────────────────────────────────────
   Source Performance
   ────────────────────────────────────────────── */

export interface SourceRow {
  source: string;
  conversations: number;
  bookings: number;
  rate: number;
  callbackRate: number;
  ncs: number;
  costPerBooking: number | null;
  sparkline: number[];
}

export const sourceComparisonData: SourceRow[] = [
  { source: 'Web Chat', conversations: 3, bookings: 1, rate: 3.2, callbackRate: 2.1, ncs: 8, costPerBooking: null, sparkline: [2, 3, 2, 4, 3, 3, 3] },
  { source: 'SMS Recovery', conversations: 5, bookings: 2, rate: 4.0, callbackRate: 1.5, ncs: 7, costPerBooking: null, sparkline: [3, 4, 5, 4, 5, 5, 5] },
  { source: 'Phone Inbound', conversations: 2, bookings: 1, rate: 5.0, callbackRate: 3.2, ncs: 9, costPerBooking: null, sparkline: [1, 2, 2, 3, 2, 2, 2] },
  { source: 'Referral Portal', conversations: 1, bookings: 0, rate: 0.0, callbackRate: 0.0, ncs: 6, costPerBooking: null, sparkline: [1, 0, 1, 1, 0, 1, 1] },
  { source: 'Google Ads', conversations: 4, bookings: 1, rate: 2.5, callbackRate: 1.8, ncs: 7, costPerBooking: 8.50, sparkline: [2, 3, 4, 3, 4, 4, 4] },
  { source: 'Facebook', conversations: 2, bookings: 0, rate: 0.0, callbackRate: 1.0, ncs: 6, costPerBooking: null, sparkline: [1, 1, 2, 1, 2, 2, 2] },
];

/* ──────────────────────────────────────────────
   Operations Panel
   ────────────────────────────────────────────── */

export interface OperationsPanelData {
  activeCount: number;
  waitingCount: number;
  handoffCount: number;
  avgWaitSeconds: number;
  longestWaitSeconds: number;
  topIssues: Array<{
    label: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export const operationsPanelData: OperationsPanelData = {
  activeCount: 3,
  waitingCount: 1,
  handoffCount: 0,
  avgWaitSeconds: 45,
  longestWaitSeconds: 425,
  topIssues: [
    { label: 'Insurance confusion', count: 3, severity: 'high' },
    { label: 'Tone issues', count: 2, severity: 'medium' },
    { label: 'Low confidence', count: 1, severity: 'medium' },
    { label: 'Policy flags', count: 1, severity: 'low' },
  ],
};

/* ──────────────────────────────────────────────
   Live Queue (legacy — kept for LiveQueuePanel)
   ────────────────────────────────────────────── */

export interface LiveQueueData {
  activeCount: number;
  avgWaitSeconds: number;
  byStatus: { status: string; count: number; color: string }[];
  recentSessions: { id: string; playbook: string; duration: string; status: string }[];
}

export const liveQueueData: LiveQueueData = {
  activeCount: 3,
  avgWaitSeconds: 45,
  byStatus: [
    { status: 'Engaged', count: 2, color: 'bg-emerald-500' },
    { status: 'Waiting', count: 1, color: 'bg-amber-500' },
    { status: 'Handoff', count: 0, color: 'bg-red-500' },
  ],
  recentSessions: [
    { id: 'CONV-2901', playbook: 'New Patient Intake', duration: '3m 12s', status: 'active' },
    { id: 'CONV-2899', playbook: 'Insurance Collection', duration: '5m 48s', status: 'active' },
    { id: 'CONV-2897', playbook: 'Missed Call Recovery', duration: '1m 22s', status: 'active' },
    { id: 'CONV-2895', playbook: 'Callback Request', duration: '7m 05s', status: 'warning' },
  ],
};

/* ──────────────────────────────────────────────
   Flagged Conversations (legacy — kept for FlaggedConversationsTable)
   ────────────────────────────────────────────── */

export interface FlaggedItem {
  id: string;
  type: 'low_confidence' | 'policy_violation' | 'operator_flag' | 'sentiment';
  snippet: string;
  playbook: string;
  time: string;
}

export const flaggedConversations: FlaggedItem[] = [
  { id: 'FLAG-101', type: 'low_confidence', snippet: 'Bot confidence dropped below 0.4 on insurance question', playbook: 'Insurance Collection', time: '8 min ago' },
  { id: 'FLAG-100', type: 'policy_violation', snippet: 'Response contained prohibited phrase "guaranteed coverage"', playbook: 'Insurance Reassurance', time: '22 min ago' },
  { id: 'FLAG-099', type: 'sentiment', snippet: 'Patient expressed frustration after 3rd repeated question', playbook: 'New Patient Intake', time: '35 min ago' },
  { id: 'FLAG-098', type: 'operator_flag', snippet: 'Operator flagged tone as "too clinical" for SMS channel', playbook: 'Missed Call Recovery', time: '1 hr ago' },
];

/* ──────────────────────────────────────────────
   Callback Panel
   ────────────────────────────────────────────── */

export interface CallbackPanelSummary {
  pendingCount: number;
  avgResponseMinutes: number;
  callbackConversionRate: number;
  missedCallbacks: number;
}

export const callbackPanelSummary: CallbackPanelSummary = {
  pendingCount: 3,
  avgResponseMinutes: 8,
  callbackConversionRate: 6.2,
  missedCallbacks: 1,
};

export interface CallbackItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
  waitTime: string;
  ageMinutes: number;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'scheduled' | 'overdue';
}

export const callbackQueue: CallbackItem[] = [
  { id: 'CB-441', priority: 'high', source: 'Insurance Escalation', waitTime: '12m', ageMinutes: 12, assignedTo: 'Sarah M.', status: 'pending' },
  { id: 'CB-440', priority: 'medium', source: 'Booking Fallback', waitTime: '18m', ageMinutes: 18, assignedTo: 'Unassigned', status: 'pending' },
  { id: 'CB-439', priority: 'medium', source: 'Patient Request', waitTime: '25m', ageMinutes: 25, assignedTo: 'Mike T.', status: 'in_progress' },
  { id: 'CB-438', priority: 'low', source: 'Follow-up', waitTime: '42m', ageMinutes: 42, assignedTo: 'Unassigned', status: 'overdue' },
];

/* ──────────────────────────────────────────────
   Playbook Health
   ────────────────────────────────────────────── */

export interface PlaybookHealthRow {
  playbookId: string;
  name: string;
  ncs: number;
  dropOffRate: number;
  conversationVolume: number;
  impactScore: number;
}

export const playbookHealthData: PlaybookHealthRow[] = [
  { playbookId: 'insurance-collection', name: 'Insurance Collection', ncs: 5, dropOffRate: 2.8, conversationVolume: 4, impactScore: 11.2 },
  { playbookId: 'scheduling-unavailable', name: 'Scheduling Unavailable', ncs: 6, dropOffRate: 2.2, conversationVolume: 3, impactScore: 6.6 },
  { playbookId: 'low-confidence-fallback', name: 'Low Confidence Fallback', ncs: 7, dropOffRate: 1.9, conversationVolume: 2, impactScore: 3.8 },
].sort((a, b) => b.impactScore - a.impactScore);

// Legacy alias
export interface ProblematicPlaybook {
  name: string;
  ncsScore: number;
  dropOffRate: number;
  conversations: number;
}

export const problematicPlaybooks: ProblematicPlaybook[] = playbookHealthData.map((p) => ({
  name: p.name,
  ncsScore: p.ncs,
  dropOffRate: p.dropOffRate,
  conversations: p.conversationVolume,
}));

/* ──────────────────────────────────────────────
   Quality Panel
   ────────────────────────────────────────────── */

export interface QualityPanelData {
  ncs: number;
  earlyDropOffRate: number;
  askedForHumanEarly: number;
  operatorEditRate: number;
  ncsTrend: number[];
}

export const qualityPanelData: QualityPanelData = {
  ncs: 7.4,
  earlyDropOffRate: 1.8,
  askedForHumanEarly: 2,
  operatorEditRate: 3.1,
  ncsTrend: [6, 7, 7, 8, 7, 7, 7],
};

/* ──────────────────────────────────────────────
   Alerts
   ────────────────────────────────────────────── */

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  ageLabel: string;
  owner?: string;
  actionLabel: string;
  actionTarget: string;
  confidence?: 'High' | 'Medium' | 'Low';
  expectedImpact?: string;
}

export const dashboardAlerts: AlertItem[] = [
  { id: 'ALT-1', severity: 'critical', title: 'Insurance drop-off exceeded threshold', description: 'Drop-off rate hit 28%, above the 25% limit', ageLabel: '12m', owner: 'Sarah M.', actionLabel: 'Review Playbook', actionTarget: '/playbooks/insurance', confidence: 'High', expectedImpact: '+8–12% conversion if resolved' },
  { id: 'ALT-2', severity: 'warning', title: 'Callback queue backlog', description: '3 items waiting over 30 min', ageLabel: '18m', owner: 'Unassigned', actionLabel: 'Assign Callbacks', actionTarget: '#callbacks', confidence: 'High', expectedImpact: 'Prevent missed conversions' },
  { id: 'ALT-3', severity: 'warning', title: 'Feels Human Score below threshold', description: 'Scheduling Unavailable playbook score dropped to 6', ageLabel: '45m', actionLabel: 'Review Responses', actionTarget: '/playbooks/scheduling', confidence: 'Medium', expectedImpact: '+1–2 pts if tone adjusted' },
  { id: 'ALT-4', severity: 'info', title: 'A/B test reached significance', description: '"Recovery Tone B" is the winner — 15% higher engagement', ageLabel: '2h', actionLabel: 'Promote Winner', actionTarget: '/playbooks/ab-tests', confidence: 'High', expectedImpact: '+3–5% response rate' },
];

/* ──────────────────────────────────────────────
   Drilldown Drawer
   ────────────────────────────────────────────── */

export interface DrawerContext {
  type: 'funnel_stage' | 'source' | 'alert' | 'callback' | 'playbook';
  id: string;
  label: string;
}
