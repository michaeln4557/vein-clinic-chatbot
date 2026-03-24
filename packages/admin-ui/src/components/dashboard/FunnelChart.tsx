import type { FunnelStep } from '../../data/mockDashboardData';

interface FunnelChartProps {
  data: FunnelStep[];
  compact?: boolean;
  mode?: 'sms' | 'web' | 'combined';
  onModeChange?: (mode: 'sms' | 'web' | 'combined') => void;
  onStageClick?: (stage: FunnelStep) => void;
}

const statusColors: Record<string, string> = {
  good: '',
  watch: 'bg-amber-50',
  bad: 'bg-red-50',
};

const statusBarOverride: Record<string, string> = {
  good: '',
  watch: '#f59e0b',
  bad: '#ef4444',
};

const modes: { label: string; value: 'sms' | 'web' | 'combined' }[] = [
  { label: 'Combined', value: 'combined' },
  { label: 'SMS', value: 'sms' },
  { label: 'Web', value: 'web' },
];

/** Human-readable issue labels for funnel drop-off problems */
const DROP_OFF_THRESHOLD = 25; // percent — annotate if drop exceeds this

function getIssueLabel(stageName: string, dropOff: number): string | null {
  if (dropOff < DROP_OFF_THRESHOLD) return null;

  const labels: Record<string, string> = {
    'SMS Sent': 'DELIVERY ISSUE',
    'Patient Responded': 'LOW ENGAGEMENT',
    'Lead Created': 'QUALIFICATION GAP',
    'Booking Started': 'INSURANCE HESITATION',
    'Booking Confirmed': 'BOOKING FRICTION',
  };
  return labels[stageName] || 'CONVERSION ISSUE';
}

export default function FunnelChart({ data, compact = false, mode = 'combined', onModeChange, onStageClick }: FunnelChartProps) {
  const maxValue = data[0]?.value || 1;

  // Find weakest step
  const dropOffs = data
    .filter((s) => s.dropOffFromPrev !== null && s.dropOffFromPrev > 0)
    .map((s) => ({ name: s.name, drop: s.dropOffFromPrev! }));
  const worstStep = dropOffs.length > 0 ? dropOffs.reduce((a, b) => (a.drop > b.drop ? a : b)) : null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* Mode Toggle */}
      {onModeChange && (
        <div className="flex rounded-lg border border-healthcare-border overflow-hidden w-fit mb-2">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                mode === m.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-healthcare-muted hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {data.map((stage) => {
        const widthPct = (stage.value / maxValue) * 100;
        const barColor = statusBarOverride[stage.status] || stage.fill;
        const rowBg = statusColors[stage.status] || '';
        const clickable = !!onStageClick;
        const issueLabel = stage.dropOffFromPrev !== null ? getIssueLabel(stage.name, stage.dropOffFromPrev) : null;
        const isWeakest = worstStep?.name === stage.name;

        return (
          <div
            key={stage.name}
            className={`rounded-lg p-1.5 ${rowBg} ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''} ${isWeakest ? 'ring-1 ring-red-300' : ''}`}
            onClick={() => onStageClick?.(stage)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{stage.name}</span>
                {issueLabel && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isWeakest ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {issueLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>
                  {stage.value.toLocaleString()}
                </span>
                {stage.conversionFromPrev !== null && (
                  <span className={`text-healthcare-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    ({stage.conversionFromPrev}%)
                  </span>
                )}
              </div>
            </div>
            <div className={`w-full bg-gray-100 rounded-full ${compact ? 'h-2' : 'h-3'}`}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: barColor }}
              />
            </div>
            {/* Drop-off indicator */}
            {stage.dropOffFromPrev !== null && stage.dropOffFromPrev > 0 && (
              <div className="flex justify-end mt-0.5">
                <span className={`font-medium ${compact ? 'text-[9px]' : 'text-[10px]'} ${
                  stage.dropOffFromPrev >= DROP_OFF_THRESHOLD ? 'text-red-600' : 'text-red-400'
                }`}>
                  -{stage.dropOffFromPrev}% drop-off
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
