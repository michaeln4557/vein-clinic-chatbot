import {
  MessageSquare,
  CalendarCheck,
  CalendarCheck2,
  PhoneOff,
  PhoneCall,
  TrendingUp,
  Zap,
  Users,
  MessageCircle,
  PhoneForwarded,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ══════════════════════════════════════════════
   ATTRIBUTION MODEL
   ══════════════════════════════════════════════
   Every conversation has:
     conversation_source: 'chatbot_direct' | 'missed_call_recovery'
     conversation_engaged: boolean
     conversion_outcome: boolean
     conversion_path: 'bot_only' | 'human_handoff' | 'none'
     handoff_requested: boolean
     handoff_channel: 'callback' | 'sms' | 'none'
     handoff_timing: 'now' | 'scheduled' | 'unknown' | 'none'

   RULES:
   1. Every conversion has ONE source (chatbot_direct | missed_call_recovery)
   2. Every conversion has ONE path (bot_only | human_handoff)
   3. A conversion is counted ONCE in Total Conversions
   4. Missed call recovery is a SOURCE, not a separate conversion path
   5. Handoff requests are NOT conversions until a booking occurs
   6. Bot-Only and Human-Handoff are mutually exclusive
   ══════════════════════════════════════════════ */

export type ConversationSource = 'chatbot_direct' | 'missed_call_recovery';
export type ConversionPath = 'bot_only' | 'human_handoff' | 'none';
export type HandoffChannel = 'callback' | 'sms' | 'none';
export type HandoffTiming = 'now' | 'scheduled' | 'unknown' | 'none';

export interface ConversationRecord {
  id: string;
  source: ConversationSource;
  engaged: boolean;
  conversionOutcome: boolean;
  conversionPath: ConversionPath;
  handoffRequested: boolean;
  handoffChannel: HandoffChannel;
  handoffTiming: HandoffTiming;
}

/* ──────────────────────────────────────────────
   Raw conversation data (small numbers, 0–10)
   This drives ALL metric computations.
   ────────────────────────────────────────────── */
export const conversationRecords: ConversationRecord[] = [
  // Chatbot direct — bot-only conversions
  { id: 'C-001', source: 'chatbot_direct', engaged: true, conversionOutcome: true, conversionPath: 'bot_only', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },
  { id: 'C-002', source: 'chatbot_direct', engaged: true, conversionOutcome: true, conversionPath: 'bot_only', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },
  // Chatbot direct — human-handoff conversions
  { id: 'C-003', source: 'chatbot_direct', engaged: true, conversionOutcome: true, conversionPath: 'human_handoff', handoffRequested: true, handoffChannel: 'callback', handoffTiming: 'now' },
  // Chatbot direct — handoff requested, no conversion
  { id: 'C-004', source: 'chatbot_direct', engaged: true, conversionOutcome: false, conversionPath: 'none', handoffRequested: true, handoffChannel: 'callback', handoffTiming: 'scheduled' },
  { id: 'C-005', source: 'chatbot_direct', engaged: true, conversionOutcome: false, conversionPath: 'none', handoffRequested: true, handoffChannel: 'sms', handoffTiming: 'now' },
  // Chatbot direct — engaged, no conversion, no handoff
  { id: 'C-006', source: 'chatbot_direct', engaged: true, conversionOutcome: false, conversionPath: 'none', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },
  // Chatbot direct — not engaged
  { id: 'C-007', source: 'chatbot_direct', engaged: false, conversionOutcome: false, conversionPath: 'none', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },

  // Missed call recovery — bot-only conversion
  { id: 'C-008', source: 'missed_call_recovery', engaged: true, conversionOutcome: true, conversionPath: 'bot_only', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },
  // Missed call recovery — human-handoff conversion
  { id: 'C-009', source: 'missed_call_recovery', engaged: true, conversionOutcome: true, conversionPath: 'human_handoff', handoffRequested: true, handoffChannel: 'callback', handoffTiming: 'now' },
  // Missed call recovery — engaged, no conversion
  { id: 'C-010', source: 'missed_call_recovery', engaged: true, conversionOutcome: false, conversionPath: 'none', handoffRequested: true, handoffChannel: 'sms', handoffTiming: 'scheduled' },
  // Missed call recovery — not engaged
  { id: 'C-011', source: 'missed_call_recovery', engaged: false, conversionOutcome: false, conversionPath: 'none', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },
  { id: 'C-012', source: 'missed_call_recovery', engaged: false, conversionOutcome: false, conversionPath: 'none', handoffRequested: false, handoffChannel: 'none', handoffTiming: 'none' },
];

/* ══════════════════════════════════════════════
   COMPUTED METRICS (derived from records)
   No double-counting possible because every
   record has exactly one source + one path.
   ══════════════════════════════════════════════ */

const all = conversationRecords;
const engaged = all.filter((c) => c.engaged);
const converted = all.filter((c) => c.conversionOutcome);
const botOnly = converted.filter((c) => c.conversionPath === 'bot_only');
const humanHandoff = converted.filter((c) => c.conversionPath === 'human_handoff');
const handoffRequested = all.filter((c) => c.handoffRequested);
const handoffCallback = handoffRequested.filter((c) => c.handoffChannel === 'callback');
const handoffSms = handoffRequested.filter((c) => c.handoffChannel === 'sms');

// Missed call recovery subset
const mcr = all.filter((c) => c.source === 'missed_call_recovery');
const mcrEngaged = mcr.filter((c) => c.engaged);
const mcrConverted = mcr.filter((c) => c.conversionOutcome);
const mcrBotOnly = mcrConverted.filter((c) => c.conversionPath === 'bot_only');
const mcrHumanHandoff = mcrConverted.filter((c) => c.conversionPath === 'human_handoff');

export const computedMetrics = {
  // Section 1: Main Metrics
  conversationsInitiated: all.length,              // 12
  engagedConversations: engaged.length,            // 9
  engagementRate: Math.round((engaged.length / all.length) * 100), // 75%
  totalConversions: converted.length,              // 5
  totalConversionRate: Math.round((converted.length / all.length) * 1000) / 10, // 41.7%

  // Section 2: Conversion Breakdown
  botOnlyConversions: botOnly.length,              // 3
  humanHandoffConversions: humanHandoff.length,    // 2
  botOnlyConversionRate: Math.round((botOnly.length / Math.max(engaged.length, 1)) * 100), // 33%
  humanHandoffConversionRate: Math.round((humanHandoff.length / Math.max(handoffRequested.length, 1)) * 100), // 40%
  automationRate: Math.round((botOnly.length / Math.max(converted.length, 1)) * 100), // 60%
  humanRate: Math.round((humanHandoff.length / Math.max(converted.length, 1)) * 100), // 40%

  // Section 3: Human Handoff
  humanHandoffRequests: handoffRequested.length,   // 5
  handoffViaCallback: handoffCallback.length,      // 3
  handoffViaSms: handoffSms.length,                // 2

  // Section 4: Missed Call Recovery
  mcrConversations: mcr.length,                    // 5
  mcrEngaged: mcrEngaged.length,                   // 3
  mcrEngagementRate: Math.round((mcrEngaged.length / Math.max(mcr.length, 1)) * 100), // 60%
  mcrConversions: mcrConverted.length,             // 2
  mcrBotOnlyConversions: mcrBotOnly.length,        // 1
  mcrHumanHandoffConversions: mcrHumanHandoff.length, // 1
};

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

/* ══════════════════════════════════════════════
   KPI CARD SECTIONS
   ══════════════════════════════════════════════
   Section 1 — OVERVIEW: Top-line funnel health
   Section 2 — CONVERSION PATH: How conversions happened
   Section 3 — ESCALATION & RECOVERY: Supporting operational/source metrics
   ══════════════════════════════════════════════ */

/* ── Section 1: Overview ──────────────────────
   Volume + efficiency + outcome.
   Conversations Initiated = demand (count primary)
   Engagement Rate = quality (% primary)
   Total Conversion Rate = ultimate outcome (% primary)
   ────────────────────────────────────────────── */
export const kpiOverview: MetricCardData[] = [
  {
    id: 'conversations-initiated',
    label: 'Conversations Initiated',
    value: String(computedMetrics.conversationsInitiated),
    delta: '+3',
    deltaDirection: 'up',
    helpText: 'Count of every chatbot session started, including sessions from automated outreach and missed-call recovery flows. This is the top-of-funnel volume metric.',
    helperText: 'Includes direct chat, SMS, and recovery flows',
    status: 'default',
    icon: MessageSquare,
    color: 'bg-brand-50 text-brand-600',
    sparkline: [6, 8, 7, 9, 10, 11, 12],
  },
  {
    id: 'engagement-rate',
    label: 'Engagement Rate',
    value: `${computedMetrics.engagementRate}%`,
    delta: '+4%',
    deltaDirection: 'up',
    helpText: 'Percentage of initiated conversations where the patient meaningfully replied.',
    helperText: `${computedMetrics.engagedConversations} engaged conversations`,
    status: computedMetrics.engagementRate > 65 ? 'success' : computedMetrics.engagementRate >= 50 ? 'warning' : 'critical',
    icon: Zap,
    color: 'bg-sky-50 text-sky-600',
    sparkline: [62, 64, 66, 70, 72, 73, 75],
  },
  {
    id: 'total-conversions',
    label: 'Total Conversion Rate',
    value: `${computedMetrics.totalConversionRate}%`,
    delta: '+2.1%',
    deltaDirection: 'up',
    helpText: 'Percent of all initiated conversations that resulted in a booked appointment. Includes bot-only AND human-handoff bookings. Each conversion counted once — never in both.',
    helperText: `${computedMetrics.totalConversions} total conversions`,
    status: computedMetrics.totalConversionRate > 20 ? 'success' : computedMetrics.totalConversionRate >= 10 ? 'warning' : 'critical',
    icon: TrendingUp,
    color: 'bg-teal-50 text-teal-600',
    sparkline: [2, 3, 3, 4, 4, 5, 5],
  },
];

/* ── Section 2: Conversion Path ───────────────
   HOW conversions happened: bot vs human.
   Both show rate as primary, count as secondary.
   These two are mutually exclusive and sum to Total Conversions.
   ────────────────────────────────────────────── */
export const kpiConversionPath: MetricCardData[] = [
  {
    id: 'bot-only-conversions',
    label: 'Bot-Only Conversion Rate',
    value: `${computedMetrics.botOnlyConversionRate}%`,
    delta: '+3%',
    deltaDirection: 'up',
    helpText: 'Rate of engaged conversations that converted WITHOUT human involvement. Includes missed-call-recovery if conversion happened entirely through automation. Mutually exclusive with human-handoff.',
    helperText: `${computedMetrics.botOnlyConversions} bot-only conversions · of ${computedMetrics.engagedConversations} engaged`,
    status: 'success',
    icon: CalendarCheck,
    color: 'bg-emerald-50 text-emerald-600',
    sparkline: [1, 2, 2, 2, 3, 3, 3],
  },
  {
    id: 'human-handoff-conversions',
    label: 'Handoff Conversion Rate',
    value: `${computedMetrics.humanHandoffConversionRate}%`,
    delta: '+5%',
    deltaDirection: 'up',
    helpText: 'Rate of handoff requests that resulted in a booked appointment. Includes callback and SMS follow-up bookings. NOT counted in bot-only — mutually exclusive.',
    helperText: `${computedMetrics.humanHandoffConversions} human-handoff conversions · of ${computedMetrics.humanHandoffRequests} requests`,
    status: 'success',
    icon: CalendarCheck2,
    color: 'bg-teal-50 text-teal-600',
    sparkline: [0, 1, 1, 1, 1, 2, 2],
  },
];

/* ── Section 3: Escalation & Recovery ─────────
   Human Handoff Requests = operational volume (count primary)
   Missed Call Recovery = source performance (% primary)
   These are NOT conversion metrics. Handoff requests
   may or may not convert. MCR is a source classification.
   ────────────────────────────────────────────── */
export const kpiEscalationRecovery: MetricCardData[] = [
  {
    id: 'human-handoff-requests',
    label: 'Human Handoff Requests',
    value: String(computedMetrics.humanHandoffRequests),
    delta: '+1',
    deltaDirection: 'up',
    helpText: 'Conversations where the patient requested a real person. Includes callback requests, SMS requests, and "is this a real person" queries. This is NOT a conversion metric — it measures escalation demand.',
    helperText: `${computedMetrics.handoffViaCallback} callback · ${computedMetrics.handoffViaSms} SMS · Requested human follow-up`,
    status: 'warning',
    icon: PhoneCall,
    color: 'bg-amber-50 text-amber-600',
    sparkline: [2, 3, 3, 4, 4, 5, 5],
  },
  {
    id: 'missed-call-recovery',
    label: 'Missed Call Recovery (Source)',
    value: `${computedMetrics.mcrEngagementRate}%`,
    delta: '+5%',
    deltaDirection: 'up',
    helpText: `Entry source metric — missed calls followed by automated SMS outreach. ${computedMetrics.mcrConversations} recovery conversations, ${computedMetrics.mcrEngaged} engaged, ${computedMetrics.mcrConversions} converted (${computedMetrics.mcrBotOnlyConversions} bot-only, ${computedMetrics.mcrHumanHandoffConversions} human-handoff). Conversions are included in overall totals — not counted separately.`,
    helperText: `${computedMetrics.mcrConversations} recovery convos · ${computedMetrics.mcrConversions} converted · Included in total conversions`,
    status: computedMetrics.mcrEngagementRate > 20 ? 'success' : computedMetrics.mcrEngagementRate >= 10 ? 'warning' : 'critical',
    icon: PhoneOff,
    color: 'bg-purple-50 text-purple-600',
    sparkline: [2, 3, 3, 4, 4, 5, 5],
  },
];

/* ── Legacy exports (backwards compat) ────────
   kpiRow1 = Overview
   kpiRow2 = ConversionPath + EscalationRecovery
   ────────────────────────────────────────────── */
export const kpiRow1 = kpiOverview;
export const kpiRow2 = [...kpiConversionPath, ...kpiEscalationRecovery];

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
   Conversion Funnels
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

/** Funnel 1: Core Chatbot Funnel */
export const coreFunnelData: FunnelStep[] = [
  { name: 'Initiated', value: computedMetrics.conversationsInitiated, fill: '#0d9488', conversionFromPrev: null, dropOffFromPrev: null, status: 'good' },
  { name: 'Engaged', value: computedMetrics.engagedConversations, fill: '#14b8a6', conversionFromPrev: computedMetrics.engagementRate, dropOffFromPrev: 100 - computedMetrics.engagementRate, status: computedMetrics.engagementRate > 65 ? 'good' : 'watch' },
  { name: 'Converted', value: computedMetrics.totalConversions, fill: '#2dd4bf', conversionFromPrev: Math.round((computedMetrics.totalConversions / Math.max(computedMetrics.engagedConversations, 1)) * 100), dropOffFromPrev: Math.round((1 - computedMetrics.totalConversions / Math.max(computedMetrics.engagedConversations, 1)) * 100), status: computedMetrics.totalConversionRate > 20 ? 'good' : 'watch' },
];

/** Funnel 2: Automation vs Human */
export const automationFunnelData: FunnelStep[] = [
  { name: 'Engaged', value: computedMetrics.engagedConversations, fill: '#0d9488', conversionFromPrev: null, dropOffFromPrev: null, status: 'good' },
  { name: 'Bot-Handled', value: computedMetrics.engagedConversations - computedMetrics.humanHandoffRequests, fill: '#14b8a6', conversionFromPrev: null, dropOffFromPrev: null, status: 'good' },
  { name: 'Human-Handoff', value: computedMetrics.humanHandoffRequests, fill: '#f59e0b', conversionFromPrev: null, dropOffFromPrev: null, status: 'watch' },
  { name: 'Bot-Only Conv.', value: computedMetrics.botOnlyConversions, fill: '#10b981', conversionFromPrev: Math.round((computedMetrics.botOnlyConversions / Math.max(computedMetrics.engagedConversations - computedMetrics.humanHandoffRequests, 1)) * 100), dropOffFromPrev: null, status: 'good' },
  { name: 'Handoff Conv.', value: computedMetrics.humanHandoffConversions, fill: '#14b8a6', conversionFromPrev: Math.round((computedMetrics.humanHandoffConversions / Math.max(computedMetrics.humanHandoffRequests, 1)) * 100), dropOffFromPrev: null, status: 'good' },
];

/** Funnel 3: Human Handoff */
export const handoffFunnelData: FunnelStep[] = [
  { name: 'Handoff Requests', value: computedMetrics.humanHandoffRequests, fill: '#f59e0b', conversionFromPrev: null, dropOffFromPrev: null, status: 'watch' },
  { name: 'Via Callback', value: computedMetrics.handoffViaCallback, fill: '#f97316', conversionFromPrev: Math.round((computedMetrics.handoffViaCallback / Math.max(computedMetrics.humanHandoffRequests, 1)) * 100), dropOffFromPrev: null, status: 'watch' },
  { name: 'Via SMS', value: computedMetrics.handoffViaSms, fill: '#eab308', conversionFromPrev: Math.round((computedMetrics.handoffViaSms / Math.max(computedMetrics.humanHandoffRequests, 1)) * 100), dropOffFromPrev: null, status: 'watch' },
  { name: 'Handoff Conv.', value: computedMetrics.humanHandoffConversions, fill: '#10b981', conversionFromPrev: computedMetrics.humanHandoffConversionRate, dropOffFromPrev: 100 - computedMetrics.humanHandoffConversionRate, status: computedMetrics.humanHandoffConversionRate > 40 ? 'good' : 'watch' },
];

/** Funnel 4: Missed Call Recovery */
export const mcrFunnelData: FunnelStep[] = [
  { name: 'MCR Conversations', value: computedMetrics.mcrConversations, fill: '#7c3aed', conversionFromPrev: null, dropOffFromPrev: null, status: 'good' },
  { name: 'MCR Engaged', value: computedMetrics.mcrEngaged, fill: '#8b5cf6', conversionFromPrev: computedMetrics.mcrEngagementRate, dropOffFromPrev: 100 - computedMetrics.mcrEngagementRate, status: computedMetrics.mcrEngagementRate > 50 ? 'good' : 'watch' },
  { name: 'MCR Conversions', value: computedMetrics.mcrConversions, fill: '#a78bfa', conversionFromPrev: Math.round((computedMetrics.mcrConversions / Math.max(computedMetrics.mcrEngaged, 1)) * 100), dropOffFromPrev: Math.round((1 - computedMetrics.mcrConversions / Math.max(computedMetrics.mcrEngaged, 1)) * 100), status: 'good' },
  { name: 'MCR Bot-Only', value: computedMetrics.mcrBotOnlyConversions, fill: '#c4b5fd', conversionFromPrev: null, dropOffFromPrev: null, status: 'good' },
  { name: 'MCR Handoff', value: computedMetrics.mcrHumanHandoffConversions, fill: '#ddd6fe', conversionFromPrev: null, dropOffFromPrev: null, status: 'watch' },
];

/** Legacy default funnel (alias to core funnel) */
export const dashboardFunnelData: FunnelStep[] = coreFunnelData;

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
