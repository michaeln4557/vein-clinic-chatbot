import MetricCard from '../components/dashboard/MetricCard';
import TopFilterBar, { type DashboardView } from '../components/dashboard/TopFilterBar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Zap,
  Bot,
  Users,
  Target,
  CheckCircle2,
  PhoneOff,
} from 'lucide-react';
import {
  kpiOverview,
  computedMetrics,
} from '../data/mockDashboardData';

/* ══════════════════════════════════════════════
   MAYA'S PERFORMANCE — Control Tower
   ══════════════════════════════════════════════
   Under 5 seconds a manager knows:
   1. Good or bad?     → Hero conversion
   2. Biggest problem? → Key Issues
   3. What to do?      → Suggested Actions
   ══════════════════════════════════════════════ */

const defaultFilters = {
  dateRange: '14d',
  location: 'all',
  channel: 'all',
  source: 'all',
  playbook: 'all',
};

function conversionStatus(rate: number) {
  if (rate >= 80) return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', label: 'On track' };
  if (rate >= 70) return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', label: 'Near target' };
  return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', label: 'Below target — action needed' };
}

const conversionTrend = [32, 35, 34, 38, 36, 40, 42];
const conversionTrendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Key Issues (merged attention + drop-off) ── */
const keyIssues: { text: string; severity: 'critical' | 'warning' | 'positive'; link: string; action: string; actionTarget: string }[] = [
  {
    text: 'Insurance step drop-off (-38%) — Friction',
    severity: 'critical',
    link: '/funnel',
    action: 'Increase Humanization (3 → 4)',
    actionTarget: '/sliders',
  },
  {
    text: 'Human handoffs increased (+12% vs last period)',
    severity: 'warning',
    link: '/funnel',
    action: 'Add earlier insurance reassurance',
    actionTarget: '/playbooks',
  },
  {
    text: 'Engagement improving (+4%) — early-stage changes working',
    severity: 'positive',
    link: '/conversations',
    action: 'Increase Booking Approach to capitalize',
    actionTarget: '/sliders',
  },
];

/* ── Last change impact ──────────────────────── */
const lastChangeImpact = {
  change: 'Humanization increased (2 → 3)',
  timeAgo: '3 days ago',
  effects: [
    { metric: 'Engagement Rate', delta: '+8%', direction: 'up' as const },
    { metric: 'Bot Conversion', delta: '+3%', direction: 'up' as const },
    { metric: 'Human Handoffs', delta: '-2', direction: 'down' as const },
  ],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardView, setDashboardView] = useState<DashboardView>('overall');
  const [dateRange, setDateRange] = useState(defaultFilters.dateRange);
  const [location, setLocation] = useState(defaultFilters.location);
  const [channel, setChannel] = useState(defaultFilters.channel);
  const [source, setSource] = useState(defaultFilters.source);
  const [playbook, setPlaybook] = useState(defaultFilters.playbook);

  const resetFilters = () => {
    setDateRange(defaultFilters.dateRange);
    setLocation(defaultFilters.location);
    setChannel(defaultFilters.channel);
    setSource(defaultFilters.source);
    setPlaybook(defaultFilters.playbook);
  };

  const convStatus = conversionStatus(computedMetrics.totalConversionRate);

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-col gap-3">
        <div>
          <h1>Maya's Performance</h1>
          <p className="text-sm text-healthcare-muted mt-0.5">
            What's happening and what should you do?
          </p>
        </div>
        <TopFilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          locationValue={location}
          onLocationChange={setLocation}
          channelValue={channel}
          onChannelChange={setChannel}
          sourceValue={source}
          onSourceChange={setSource}
          playbookValue={playbook}
          onPlaybookChange={setPlaybook}
          onReset={resetFilters}
          dashboardView={dashboardView}
          onDashboardViewChange={setDashboardView}
        />
      </div>

      {/* ══════════════════════════════════════════
         HERO ROW — Overall Conversion (dominant) + Engagement + Conversations
         ══════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">
        {/* PRIMARY: Overall Conversion Rate */}
        <div
          className={`col-span-12 md:col-span-5 card card-body border-l-4 ${convStatus.border} ${convStatus.bg} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => navigate('/funnel')}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target className={`w-5 h-5 ${convStatus.color}`} />
              <p className="text-sm font-semibold">Overall Conversion Rate</p>
            </div>
            <ArrowRight className="w-4 h-4 text-healthcare-muted" />
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className={`text-5xl font-black ${convStatus.color}`}>
                {computedMetrics.totalConversionRate}%
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${convStatus.bg} ${convStatus.color} border ${convStatus.border}`}>
                  {convStatus.label}
                </span>
                <span className="text-[10px] text-healthcare-muted">Target: 70%+</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-medium">+2.1%</span>
                <span className="text-healthcare-muted">vs last period</span>
              </div>
            </div>
            <div className="flex-1 flex items-end gap-0.5 h-16 ml-4">
              {conversionTrend.map((val, i) => {
                const maxVal = Math.max(...conversionTrend);
                const height = (val / maxVal) * 100;
                const isLast = i === conversionTrend.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${isLast ? 'bg-teal-500' : 'bg-teal-200/70'}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[7px] text-healthcare-muted mt-0.5">{conversionTrendLabels[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-healthcare-muted mt-2">
            {computedMetrics.totalConversions} total conversions from {computedMetrics.conversationsInitiated} conversations
          </p>
        </div>

        {/* SECONDARY: Engagement + Conversations */}
        <div className="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpiOverview.filter((m) => m.id !== 'total-conversions').map((m) => (
            <MetricCard
              key={m.id}
              {...m}
              prominent
              onClick={() => m.id === 'engagement-rate' ? navigate('/funnel') : navigate('/conversations')}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
         KEY ISSUES & ACTIONS (compact single card)
         ══════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Key Issues & Actions</h2>
          <div className="flex-1 h-px bg-healthcare-line" />
        </div>
        <div className="card card-body divide-y divide-healthcare-line">
          {keyIssues.map((issue, i) => {
            const dot = issue.severity === 'positive' ? 'bg-blue-500' : 'bg-red-500';
            const rowBg = issue.severity !== 'positive' ? 'bg-red-50/60 -mx-4 px-4 rounded' : '';
            return (
              <div
                key={i}
                className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${rowBg}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <p className="text-xs text-gray-700 flex-1 min-w-0">{issue.text}</p>
                <button
                  onClick={() => navigate(issue.actionTarget)}
                  className="text-[10px] font-medium text-teal-700 hover:text-teal-900 whitespace-nowrap shrink-0"
                >
                  {issue.action} →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Visual break ──────────────────────── */}
      <div className="h-px bg-healthcare-line" />

      {/* ══════════════════════════════════════════
         AUTOMATION PERFORMANCE (single combined card)
         Bot %, Human %, Handoff Rate in one view
         ══════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Automation Performance</h2>
          <div className="flex-1 h-px bg-healthcare-line" />
        </div>

        <div className="card card-body">
          {/* Automation bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 shrink-0">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-semibold">Automation Split</span>
            </div>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${computedMetrics.automationRate}%` }} />
              <div className="h-full bg-teal-400 rounded-r-full" style={{ width: `${computedMetrics.humanRate}%` }} />
            </div>
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3 text-emerald-600" />
                <span className="font-bold">{computedMetrics.automationRate}%</span>
                <span className="text-healthcare-muted">bot</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-teal-500" />
                <span className="font-bold">{computedMetrics.humanRate}%</span>
                <span className="text-healthcare-muted">human</span>
              </span>
            </div>
          </div>

          {/* Bot Conversion (boxed) | Human Escalation → Human Conversion (boxed together) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bot Conversion — standalone box */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 text-center px-4 py-4">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-[10px] font-medium text-emerald-700">Bot Conversion</p>
              </div>
              <p className="text-3xl font-black text-emerald-700">{computedMetrics.botOnlyConversionRate}%</p>
              <p className="text-[10px] text-healthcare-muted mt-0.5">{computedMetrics.botOnlyConversions} bookings</p>
            </div>

            {/* Human Escalation → Human Conversion — connected box */}
            <div className="rounded-lg border border-teal-200 bg-teal-50/30 px-4 py-4">
              <div className="flex items-center justify-around">
                {/* Human Escalation */}
                <div className="text-center">
                  <p className="text-[10px] font-medium text-amber-700 mb-1">Human Escalation</p>
                  <p className="text-2xl font-black text-amber-700">{computedMetrics.humanHandoffRate}%</p>
                  <p className="text-[10px] text-healthcare-muted">{computedMetrics.humanHandoffRequests} requests</p>
                </div>
                {/* Arrow */}
                <div className="flex flex-col items-center px-2">
                  <ArrowRight className="w-5 h-5 text-teal-400" />
                </div>
                {/* Human Conversion */}
                <div className="text-center">
                  <p className="text-[10px] font-medium text-teal-700 mb-1">Human Conversion</p>
                  <p className="text-2xl font-black text-teal-700">{computedMetrics.humanHandoffConversionRate}%</p>
                  <p className="text-[10px] text-healthcare-muted">{computedMetrics.humanHandoffConversions} bookings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
         MISSED CALL RECOVERY (lower priority, compact)
         ══════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Missed Call Recovery</h2>
          <div className="flex-1 h-px bg-healthcare-line" />
        </div>
        <div
          className="card card-body flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/sources')}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-semibold">Recovery Engagement</p>
                <p className="text-[10px] text-healthcare-muted">{computedMetrics.mcrConversations} conversations</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-700">{computedMetrics.mcrEngagementRate}%</p>
              <p className="text-[9px] text-healthcare-muted">engaged</p>
            </div>
            <div className="h-8 w-px bg-healthcare-line" />
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Bot className="w-3 h-3 text-emerald-500" />
                  <span className="text-sm font-bold">{computedMetrics.mcrBotOnlyConversions}</span>
                </div>
                <p className="text-[9px] text-healthcare-muted">bot conv.</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-teal-500" />
                  <span className="text-sm font-bold">{computedMetrics.mcrHumanHandoffConversions}</span>
                </div>
                <p className="text-[9px] text-healthcare-muted">human conv.</p>
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-healthcare-muted shrink-0" />
        </div>
      </div>

      {/* ══════════════════════════════════════════
         LAST CHANGE IMPACT (compact footer)
         ══════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Last Change</h2>
          <div className="flex-1 h-px bg-healthcare-line" />
        </div>
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs font-semibold">{lastChangeImpact.change}</p>
                <p className="text-[10px] text-healthcare-muted">{lastChangeImpact.timeAgo}</p>
              </div>
              {lastChangeImpact.effects.map((effect) => (
                <div key={effect.metric} className="flex items-center gap-1.5">
                  {effect.direction === 'up'
                    ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                    : <TrendingDown className="w-3 h-3 text-emerald-500" />
                  }
                  <span className="text-[10px] text-healthcare-muted">{effect.metric}</span>
                  <span className="text-xs font-bold text-emerald-700">{effect.delta}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/sliders')}
              className="text-[10px] font-medium text-brand-600 hover:text-brand-800 shrink-0"
            >
              Controls →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
