import { useState, useMemo } from 'react';
import {
  Phone,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  UserRound,
  CalendarClock,
  ArrowUpRight,
  PhoneCall,
  Send,
  Calendar,
  Check,
  TrendingUp,
  Users,
  Timer,
  AlertCircle,
  Zap,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

type EscalationReason = 'requested_call' | 'requested_text' | 'escalation';
type QueueStatus = 'waiting' | 'in_progress' | 'completed';
type Priority = 'high' | 'medium' | 'low';
type QueueFilter = 'all' | 'waiting' | 'scheduled' | 'completed';

interface QueueItem {
  id: string;
  patientIdentifier: string;
  stage: string;
  reason: EscalationReason;
  requestedAt: string;
  requestedCallbackTime?: string;
  status: QueueStatus;
  priority: Priority;
  conversationId: string;
  location?: string;
}

interface MissedOpportunity {
  id: string;
  patientIdentifier: string;
  stage: string;
  droppedAt: string;
  lastMessage: string;
  conversationId: string;
}

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */

const reasonLabels: Record<EscalationReason, { label: string; icon: React.ElementType }> = {
  requested_call: { label: 'Requested Call', icon: PhoneCall },
  requested_text: { label: 'Requested Text', icon: MessageSquare },
  escalation: { label: 'Escalation', icon: AlertTriangle },
};

const priorityConfig: Record<Priority, { class: string; label: string }> = {
  high: { class: 'bg-red-100 text-red-700', label: 'High' },
  medium: { class: 'bg-amber-100 text-amber-700', label: 'Medium' },
  low: { class: 'bg-blue-100 text-blue-700', label: 'Low' },
};

function timeAgo(iso: string): { text: string; minutes: number } {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { text: 'Just now', minutes: 0 };
  if (mins < 60) return { text: `${mins}m`, minutes: mins };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `${hrs}h ${mins % 60}m`, minutes: mins };
  return { text: `${Math.floor(hrs / 24)}d`, minutes: mins };
}

function urgencyLevel(minutes: number): 'neutral' | 'warning' | 'urgent' {
  if (minutes > 10) return 'urgent';
  if (minutes >= 5) return 'warning';
  return 'neutral';
}

const urgencyStyles = {
  neutral: 'text-healthcare-muted',
  warning: 'text-amber-600 font-medium',
  urgent: 'text-red-600 font-semibold',
} as const;

const urgencyBorder = {
  neutral: '',
  warning: 'border-l-4 border-l-amber-400',
  urgent: 'border-l-4 border-l-red-500 bg-red-50/40',
} as const;

/** Returns true if the item needs immediate attention */
function isImmediate(item: QueueItem, minutes: number): boolean {
  if (item.status === 'completed') return false;
  return minutes > 10 || (item.priority === 'high' && item.status === 'waiting');
}

/* ═══════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════ */

const now = Date.now();

const mockQueue: QueueItem[] = [
  {
    id: 'q-1',
    patientIdentifier: 'Patient #2847',
    stage: 'Pre-Scheduling',
    reason: 'requested_call',
    requestedAt: new Date(now - 14 * 60000).toISOString(),
    status: 'waiting',
    priority: 'high',
    conversationId: 'conv-2847',
    location: 'Downtown',
  },
  {
    id: 'q-2',
    patientIdentifier: 'Patient #2851',
    stage: 'Insurance Verification',
    reason: 'escalation',
    requestedAt: new Date(now - 8 * 60000).toISOString(),
    status: 'waiting',
    priority: 'high',
    conversationId: 'conv-2851',
    location: 'Westside',
  },
  {
    id: 'q-3',
    patientIdentifier: 'Patient #2855',
    stage: 'Scheduling',
    reason: 'requested_text',
    requestedAt: new Date(now - 3 * 60000).toISOString(),
    status: 'waiting',
    priority: 'medium',
    conversationId: 'conv-2855',
    location: 'Northgate',
  },
  {
    id: 'q-4',
    patientIdentifier: 'Patient #2840',
    stage: 'Scheduling',
    reason: 'requested_call',
    requestedAt: new Date(now - 22 * 60000).toISOString(),
    requestedCallbackTime: '2:30 PM Today',
    status: 'in_progress',
    priority: 'high',
    conversationId: 'conv-2840',
    location: 'Downtown',
  },
  {
    id: 'q-5',
    patientIdentifier: 'Patient #2838',
    stage: 'Post-Consult',
    reason: 'requested_text',
    requestedAt: new Date(now - 45 * 60000).toISOString(),
    status: 'in_progress',
    priority: 'medium',
    conversationId: 'conv-2838',
    location: 'Eastside',
  },
  {
    id: 'q-6',
    patientIdentifier: 'Patient #2830',
    stage: 'Pre-Scheduling',
    reason: 'escalation',
    requestedAt: new Date(now - 90 * 60000).toISOString(),
    status: 'completed',
    priority: 'low',
    conversationId: 'conv-2830',
    location: 'Westside',
  },
  {
    id: 'q-7',
    patientIdentifier: 'Patient #2825',
    stage: 'Scheduling',
    reason: 'requested_call',
    requestedAt: new Date(now - 120 * 60000).toISOString(),
    status: 'completed',
    priority: 'medium',
    conversationId: 'conv-2825',
    location: 'Downtown',
  },
];

const mockMissedOpportunities: MissedOpportunity[] = [
  {
    id: 'mo-1',
    patientIdentifier: 'Patient #2844',
    stage: 'Reached Scheduling',
    droppedAt: new Date(now - 2 * 3600000).toISOString(),
    lastMessage: 'Let me think about it and get back to you.',
    conversationId: 'conv-2844',
  },
  {
    id: 'mo-2',
    patientIdentifier: 'Patient #2836',
    stage: 'Reached Scheduling',
    droppedAt: new Date(now - 5 * 3600000).toISOString(),
    lastMessage: 'I need to check my schedule first.',
    conversationId: 'conv-2836',
  },
  {
    id: 'mo-3',
    patientIdentifier: 'Patient #2829',
    stage: 'Insurance Pre-Auth',
    droppedAt: new Date(now - 8 * 3600000).toISOString(),
    lastMessage: "I'm not sure my insurance covers this.",
    conversationId: 'conv-2829',
  },
];

/* ═══════════════════════════════════════════════════
   Metrics
   ═══════════════════════════════════════════════════ */

const totalConversations = 142;
const escalatedCount = mockQueue.length;
const completedCount = mockQueue.filter((q) => q.status === 'completed').length;
const convertedAfterHuman = 2;
const avgResponseMinutes = 6;
const missedSlaCount = mockQueue.filter(
  (q) => q.status !== 'completed' && (Date.now() - new Date(q.requestedAt).getTime()) / 60000 > 10,
).length;

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */

export default function ReviewQueuePage() {
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [search, setSearch] = useState('');

  // Compute enriched items once
  const enrichedQueue = useMemo(
    () =>
      mockQueue.map((item) => {
        const elapsed = timeAgo(item.requestedAt);
        return { ...item, elapsed, urgency: urgencyLevel(elapsed.minutes) };
      }),
    [],
  );

  // Immediate attention: overdue OR high-priority waiting (max 5)
  const immediateItems = useMemo(
    () => enrichedQueue.filter((item) => isImmediate(item, item.elapsed.minutes)).slice(0, 5),
    [enrichedQueue],
  );

  // Filtered list for main queue
  const filtered = useMemo(() => {
    return enrichedQueue.filter((item) => {
      if (filter === 'waiting' && item.status !== 'waiting') return false;
      if (filter === 'scheduled' && !item.requestedCallbackTime) return false;
      if (filter === 'completed' && item.status !== 'completed') return false;
      if (
        search &&
        !item.patientIdentifier.toLowerCase().includes(search.toLowerCase()) &&
        !item.stage.toLowerCase().includes(search.toLowerCase()) &&
        !item.location?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [enrichedQueue, filter, search]);

  const waitingCount = enrichedQueue.filter((q) => q.status === 'waiting').length;

  // Next-action hint
  const needCallCount = immediateItems.filter(
    (i) => i.reason === 'requested_call' || i.reason === 'escalation',
  ).length;
  const needTextCount = immediateItems.filter((i) => i.reason === 'requested_text').length;
  const escalationWaiting = immediateItems.filter((i) => i.reason === 'escalation').length;

  const hints: string[] = [];
  if (needCallCount > 0) hints.push(`${needCallCount} patient${needCallCount > 1 ? 's' : ''} need${needCallCount === 1 ? 's' : ''} immediate call`);
  if (needTextCount > 0) hints.push(`${needTextCount} text response${needTextCount > 1 ? 's' : ''} waiting`);
  if (escalationWaiting > 0) hints.push(`${escalationWaiting} escalation${escalationWaiting > 1 ? 's' : ''} waiting`);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div>
        <h1>Human Recovery</h1>
        <p className="text-healthcare-muted mt-1">
          Live queue &mdash; act on what matters first
        </p>
      </div>

      {/* ── Next-Action Hint (Part 7) ──────────── */}
      {hints.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
          <Zap className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800">
            {hints.join(' · ')}
          </p>
        </div>
      )}

      {/* ── Top Metrics (Part 5 renamed) ─────── */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          icon={Users}
          label="Escalation Rate"
          value={`${((escalatedCount / totalConversations) * 100).toFixed(1)}%`}
          sub={`${escalatedCount} of ${totalConversations}`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Handled Rate"
          value={`${((completedCount / escalatedCount) * 100).toFixed(0)}%`}
          sub={`${completedCount} of ${escalatedCount} handled`}
        />
        <MetricCard
          icon={TrendingUp}
          label="Recovered Conversion"
          value={completedCount > 0 ? `${((convertedAfterHuman / completedCount) * 100).toFixed(0)}%` : '—'}
          sub={`${convertedAfterHuman} converted`}
        />
        <MetricCard
          icon={Timer}
          label="Time to First Response"
          value={`${avgResponseMinutes}m`}
          sub="Avg first response"
        />
        <MetricCard
          icon={AlertCircle}
          label="Missed Opportunities"
          value={`${missedSlaCount}`}
          sub="Not handled within SLA"
          variant={missedSlaCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* ── Immediate Attention (Part 1) ──────── */}
      {immediateItems.length > 0 && (
        <div className="card border-red-200">
          <div className="card-header bg-red-50/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-semibold text-red-800">Immediate Attention</h2>
            </div>
            <span className="text-xs font-medium text-red-600">
              {immediateItems.length} item{immediateItems.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-red-100">
            {immediateItems.map((item) => (
              <QueueRow key={item.id} item={item} elapsed={item.elapsed} compact />
            ))}
          </div>
        </div>
      )}

      {/* ── Missed Opportunities ─────────────── */}
      {mockMissedOpportunities.length > 0 && (
        <div className="card border-amber-200">
          <div className="card-header bg-amber-50/60">
            <div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-amber-800">Missed Opportunities</h2>
              </div>
              <p className="text-xs text-healthcare-muted mt-0.5 ml-6">
                Reached scheduling but did not convert &mdash; not escalated
              </p>
            </div>
            <span className="badge bg-amber-50 text-amber-700">{mockMissedOpportunities.length} recoverable</span>
          </div>
          <div className="divide-y divide-amber-100">
            {mockMissedOpportunities.map((opp) => {
              const elapsed = timeAgo(opp.droppedAt);
              return (
                <div key={opp.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{opp.patientIdentifier}</span>
                        <span className="text-xs text-healthcare-muted">{opp.stage}</span>
                        <span className="text-xs text-healthcare-muted">&middot; {elapsed.text} ago</span>
                      </div>
                      <p className="text-xs text-healthcare-muted truncate max-w-md">
                        &ldquo;{opp.lastMessage}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-healthcare-line bg-white hover:bg-gray-50 text-healthcare-text transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-healthcare-line bg-white hover:bg-gray-50 text-healthcare-text transition-colors">
                      <Send className="w-3.5 h-3.5" /> Text
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters ────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input
            type="text"
            placeholder="Search patients, stages, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-healthcare-line overflow-hidden">
          {(['all', 'waiting', 'scheduled', 'completed'] as QueueFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-healthcare-muted hover:bg-gray-50'
              }`}
            >
              {f}
              {f === 'waiting' && waitingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-700">
                  {waitingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Queue (Part 2 compact rows) ─── */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold">All Follow-Ups</h2>
          <span className="text-xs text-healthcare-muted">
            {waitingCount} waiting &middot; {filtered.length} showing
          </span>
        </div>
        <div className="divide-y divide-healthcare-line">
          {filtered.map((item) => (
            <QueueRow key={item.id} item={item} elapsed={item.elapsed} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-healthcare-muted">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No items match your criteria</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════
   QueueRow — compact card-style row (Part 2, 3, 4)
   ═══════════════════════════════════════════════════ */

function QueueRow({
  item,
  elapsed,
  compact,
}: {
  item: QueueItem;
  elapsed: { text: string; minutes: number };
  compact?: boolean;
}) {
  const reasonInfo = reasonLabels[item.reason];
  const ReasonIcon = reasonInfo.icon;
  const pCfg = priorityConfig[item.priority];
  const urg = urgencyLevel(elapsed.minutes);
  const isOverdue = item.status !== 'completed' && elapsed.minutes > 10;
  const isCompleted = item.status === 'completed';

  return (
    <div
      className={`px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
        isCompleted ? 'opacity-60' : urgencyBorder[urg]
      }`}
    >
      {/* Left: Patient info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isOverdue ? 'bg-red-100' : 'bg-brand-100'
          }`}
        >
          <UserRound className={`w-4 h-4 ${isOverdue ? 'text-red-700' : 'text-brand-700'}`} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Line 1: Patient + Location */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-healthcare-text">
              {item.patientIdentifier}
            </span>
            {item.location && (
              <span className="text-xs text-healthcare-muted">{item.location}</span>
            )}
            {item.requestedCallbackTime && (
              <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                <CalendarClock className="w-3 h-3" />
                {item.requestedCallbackTime}
              </span>
            )}
          </div>

          {/* Line 2: Stage + Reason */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-healthcare-muted">{item.stage}</span>
            <span className="text-xs text-healthcare-muted">&middot;</span>
            <span className="inline-flex items-center gap-1 text-xs text-healthcare-text">
              <ReasonIcon className="w-3 h-3" />
              {reasonInfo.label}
            </span>
          </div>

          {/* Line 3: Time + Priority + Status */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 text-xs ${urgencyStyles[urg]}`}>
              <Clock className="w-3 h-3" />
              {elapsed.text}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-semibold bg-red-600 text-white px-1.5 py-0.5 rounded">
                OVERDUE
              </span>
            )}
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${pCfg.class}`}>
              {pCfg.label}
            </span>
            <StatusBadge
              variant={
                item.status === 'waiting' ? 'warning' : item.status === 'in_progress' ? 'info' : 'success'
              }
              label={item.status === 'waiting' ? 'Waiting' : item.status === 'in_progress' ? 'In Progress' : 'Completed'}
            />
          </div>
        </div>
      </div>

      {/* Right: Actions (Part 4 — labeled buttons) */}
      {!isCompleted ? (
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-healthcare-line bg-white hover:bg-gray-50 text-healthcare-text transition-colors">
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-healthcare-line bg-white hover:bg-gray-50 text-healthcare-text transition-colors">
            <Send className="w-3.5 h-3.5" /> Text
          </button>
          {!compact && (
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-healthcare-line bg-white hover:bg-gray-50 text-healthcare-text transition-colors">
              <Calendar className="w-3.5 h-3.5" /> Schedule
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-brand-600 hover:bg-brand-700 text-white transition-colors">
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium shrink-0">
          <CheckCircle2 className="w-4 h-4" /> Completed
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MetricCard
   ═══════════════════════════════════════════════════ */

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  variant?: 'default' | 'danger';
}) {
  const isDanger = variant === 'danger';
  return (
    <div className={`card p-4 ${isDanger ? 'border-red-200 bg-red-50/30' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${isDanger ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-healthcare-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isDanger ? 'text-red-700' : 'text-healthcare-text'}`}>{value}</p>
      <p className="text-xs text-healthcare-muted mt-1">{sub}</p>
    </div>
  );
}
