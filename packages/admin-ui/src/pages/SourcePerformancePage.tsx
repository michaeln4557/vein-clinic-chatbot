import { useState } from 'react';
import { sourceComparisonData } from '../data/mockDashboardData';
import MiniSparkline from '../components/dashboard/MiniSparkline';
import { Trophy, AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

/* ══════════════════════════════════════════════
   SOURCE PERFORMANCE
   Decision-focused view: which sources perform,
   which need attention, and where they fail.
   ══════════════════════════════════════════════ */

/* Drop-off stage distribution per source */
const stageDistribution: Record<string, { early: number; symptoms: number; insurance: number; scheduling: number }> = {
  'Web Chat': { early: 30, symptoms: 10, insurance: 40, scheduling: 20 },
  'SMS Recovery': { early: 20, symptoms: 15, insurance: 35, scheduling: 30 },
  'Phone Inbound': { early: 15, symptoms: 5, insurance: 50, scheduling: 30 },
  'Referral Portal': { early: 50, symptoms: 20, insurance: 20, scheduling: 10 },
  'Google Ads': { early: 35, symptoms: 10, insurance: 35, scheduling: 20 },
  'Facebook': { early: 45, symptoms: 15, insurance: 30, scheduling: 10 },
};

const stageLabels: Record<string, string> = {
  early: 'Early exit',
  symptoms: 'Symptoms step',
  insurance: 'Insurance step',
  scheduling: 'Scheduling step',
};

function getBiggestDropOff(source: string): { stage: string; pct: number } | null {
  const dist = stageDistribution[source];
  if (!dist) return null;
  const entries = Object.entries(dist) as [keyof typeof dist, number][];
  const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { stage: stageLabels[max[0]], pct: max[1] };
}

function getAttentionSources() {
  const sorted = [...sourceComparisonData].sort((a, b) => a.rate - b.rate);
  return sorted
    .filter((s) => s.rate < 5)
    .slice(0, 3)
    .map((s) => {
      const drop = getBiggestDropOff(s.source);
      const reason = drop ? drop.stage.toLowerCase().replace(' step', '').replace(' exit', ' drop-off') : 'low volume';
      return { source: s.source, rate: s.rate, reason, dropPct: drop?.pct };
    });
}

function conversionColor(rate: number): string {
  if (rate >= 4) return 'text-emerald-700 bg-emerald-50';
  if (rate >= 2) return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function conversionSize(rate: number): string {
  if (rate >= 4) return 'text-emerald-700';
  if (rate >= 2) return 'text-amber-700';
  return 'text-red-700';
}

export default function SourcePerformancePage() {
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const sorted = [...sourceComparisonData].sort((a, b) =>
    sortAsc ? a.rate - b.rate : b.rate - a.rate
  );
  const maxRate = Math.max(...sorted.map((s) => s.rate));

  const newLeads = sorted.filter((s) => ['Web Chat', 'Google Ads', 'Facebook', 'Referral Portal'].includes(s.source));
  const recovery = sorted.filter((s) => ['SMS Recovery', 'Phone Inbound'].includes(s.source));

  const attentionSources = getAttentionSources();

  const toggleExpand = (source: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  const renderSourceCard = (src: typeof sorted[0]) => {
    const isBest = src.rate === maxRate && maxRate > 0;
    const isUnderperforming = src.rate < 5;
    const drop = getBiggestDropOff(src.source);
    const dist = stageDistribution[src.source];
    const expanded = expandedCards.has(src.source);

    return (
      <div
        key={src.source}
        className={`card card-body ${isBest ? 'ring-1 ring-emerald-200' : ''} ${isUnderperforming && src.rate < 1 ? 'ring-1 ring-red-200' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isBest && <Trophy className="w-3.5 h-3.5 text-emerald-500" />}
            <span className="text-sm font-semibold">{src.source}</span>
          </div>
          <div className="w-16">
            <MiniSparkline data={src.sparkline} width={60} height={20} />
          </div>
        </div>

        {/* PART 1: Conversion % as primary element */}
        <div className="mb-3">
          <p className={`text-3xl font-black ${conversionSize(src.rate)}`}>
            {src.rate}%
          </p>
          <p className="text-[10px] text-healthcare-muted -mt-0.5">Conversion Rate</p>
        </div>

        {/* Secondary metrics */}
        <div className="flex gap-6 mb-3 text-xs text-healthcare-muted">
          <div>
            <span className="font-semibold text-sm text-healthcare-text">{src.conversations}</span> conversations
          </div>
          <div>
            <span className="font-semibold text-sm text-healthcare-text">{src.bookings}</span> bookings
          </div>
        </div>

        {/* PART 2: Biggest drop-off (replaces multi-color bars) */}
        {drop && (
          <div>
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => toggleExpand(src.source)}
            >
              <p className="text-xs text-healthcare-muted">
                <span className="font-medium text-healthcare-text">Biggest drop-off:</span>{' '}
                {drop.stage} ({drop.pct}%)
              </p>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-healthcare-muted group-hover:text-healthcare-text" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-healthcare-muted group-hover:text-healthcare-text" />
              )}
            </div>

            {/* Expandable full breakdown */}
            {expanded && dist && (
              <div className="mt-2 pt-2 border-t border-healthcare-line space-y-1">
                {(Object.entries(dist) as [string, number][]).map(([stage, pct]) => (
                  <div key={stage} className="flex items-center gap-2 text-[11px]">
                    <span className="w-20 text-healthcare-muted capitalize">{stageLabels[stage]}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct === drop.pct ? 'bg-red-400' : 'bg-gray-300'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-8 text-right font-medium ${pct === drop.pct ? 'text-red-600' : 'text-healthcare-muted'}`}>
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSourceGroup = (title: string, subtitle: string, sources: typeof sorted) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">{title}</h2>
        <span className="text-[10px] text-healthcare-muted">{subtitle}</span>
        <div className="flex-1 h-px bg-healthcare-line" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sources.map(renderSourceCard)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header + sort toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h1>Source Performance</h1>
          <p className="text-sm text-healthcare-muted mt-1">
            Which sources convert, which need attention, and where they fail.
          </p>
        </div>
        {/* PART 3: Sort toggle */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-healthcare-muted hover:text-healthcare-text border border-healthcare-line rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortAsc ? 'Lowest first' : 'Highest first'}
        </button>
      </div>

      {/* PART 4: Where to Focus */}
      {attentionSources.length > 0 && (
        <div className="card card-body bg-red-50/50 border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-red-800">Where to Focus</h2>
          </div>
          <div className="space-y-1">
            {attentionSources.map((s) => (
              <p key={s.source} className="text-sm text-red-700">
                <span className="font-semibold">{s.source}:</span>{' '}
                {s.rate}% conversion
                {s.dropPct ? ` — ${s.reason} friction (${s.dropPct}%)` : ` — ${s.reason}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* PART 5: Renamed sections */}
      {renderSourceGroup('New Leads', 'Web Chat, Ads, Referrals', newLeads)}
      {renderSourceGroup('Recovery', 'Missed calls & SMS recovery', recovery)}
    </div>
  );
}
