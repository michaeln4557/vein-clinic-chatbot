import { useState } from 'react';
import { SlidersHorizontal, X, RotateCcw, MapPin } from 'lucide-react';
import { getLocationsByState, stateNames } from '../../data/locations';

/* ══════════════════════════════════════════════
   COMPACT CONTROL BAR
   ══════════════════════════════════════════════
   Minimal top controls: time range, location, view toggle.
   Advanced filters hidden behind icon button.
   ══════════════════════════════════════════════ */

export type DashboardView = 'overall' | 'bot' | 'human' | 'recovery';

const viewOptions: { key: DashboardView; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'bot', label: 'Bot Only' },
  { key: 'human', label: 'Human Assist' },
  { key: 'recovery', label: 'Recovery' },
];

interface TopFilterBarProps {
  dateRange: string;
  onDateRangeChange: (r: string) => void;
  locationValue: string;
  onLocationChange: (v: string) => void;
  channelValue: string;
  onChannelChange: (v: string) => void;
  sourceValue: string;
  onSourceChange: (v: string) => void;
  playbookValue: string;
  onPlaybookChange: (v: string) => void;
  onReset: () => void;
  dashboardView?: DashboardView;
  onDashboardViewChange?: (v: DashboardView) => void;
}

const dateRanges = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '14d', value: '14d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

const locationsByState = getLocationsByState();
const stateOrder = ['NY', 'NJ', 'CT', 'MD', 'TX', 'CA'];

export default function TopFilterBar({
  dateRange, onDateRangeChange,
  locationValue, onLocationChange,
  channelValue, onChannelChange,
  sourceValue, onSourceChange,
  playbookValue, onPlaybookChange,
  dashboardView = 'overall',
  onDashboardViewChange,
}: TopFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvancedFilters = channelValue !== 'all' || sourceValue !== 'all' || playbookValue !== 'all';
  const advancedCount = [channelValue !== 'all', sourceValue !== 'all', playbookValue !== 'all'].filter(Boolean).length;

  return (
    <>
      {/* ── Single-line compact controls ─────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Time Range */}
        <div className="flex rounded-lg border border-healthcare-line overflow-hidden">
          {dateRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => onDateRangeChange(r.value)}
              className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                dateRange === r.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-healthcare-muted hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Location */}
        <div className="relative flex items-center">
          <MapPin className="absolute left-2 w-3 h-3 text-healthcare-muted pointer-events-none" />
          <select
            className="select text-[11px] pl-6 pr-5 py-1.5 min-w-[130px]"
            value={locationValue}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            <option value="all">All Locations</option>
            {stateOrder.map((st) => {
              const locs = locationsByState[st];
              if (!locs?.length) return null;
              return (
                <optgroup key={st} label={stateNames[st] || st}>
                  {locs.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {/* Inline View Selector */}
        {onDashboardViewChange && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-healthcare-muted font-medium">View:</span>
            <div className="flex rounded-lg border border-healthcare-line overflow-hidden">
              {viewOptions.map((v) => (
                <button
                  key={v.key}
                  onClick={() => onDashboardViewChange(v.key)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    dashboardView === v.key
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-healthcare-muted hover:bg-gray-50'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters — icon only */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-1.5 rounded-lg border transition-colors ${
            showAdvanced || hasAdvancedFilters
              ? 'bg-brand-50 text-brand-700 border-brand-200'
              : 'bg-white text-healthcare-muted border-healthcare-line hover:text-healthcare-text'
          }`}
          title="Advanced Filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {advancedCount > 0 && (
            <span className="absolute -mt-6 ml-3 bg-brand-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {advancedCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Advanced Filters Panel ───────────── */}
      {showAdvanced && (
        <div className="bg-white border border-healthcare-line rounded-xl shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-healthcare-text uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              {hasAdvancedFilters && (
                <button
                  onClick={() => { onChannelChange('all'); onSourceChange('all'); onPlaybookChange('all'); }}
                  className="flex items-center gap-1 text-[10px] text-healthcare-muted hover:text-healthcare-text"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
              <button onClick={() => setShowAdvanced(false)} className="p-1 text-healthcare-muted hover:text-healthcare-text rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-medium text-healthcare-muted mb-1 block">Channel</label>
              <select className="select text-xs w-full" value={channelValue} onChange={(e) => onChannelChange(e.target.value)}>
                <option value="all">All Channels</option>
                <option value="web-chat">Web Chat</option>
                <option value="sms-recovery">SMS (Missed Call)</option>
                <option value="sms-inbound">SMS (Inbound)</option>
                <option value="phone">Phone Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-healthcare-muted mb-1 block">Source</label>
              <select className="select text-xs w-full" value={sourceValue} onChange={(e) => onSourceChange(e.target.value)}>
                <option value="all">All Sources</option>
                <option value="google">Google Ads</option>
                <option value="facebook">Facebook</option>
                <option value="organic">Organic</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-healthcare-muted mb-1 block">Playbook</label>
              <select className="select text-xs w-full" value={playbookValue} onChange={(e) => onPlaybookChange(e.target.value)}>
                <option value="all">All Playbooks</option>
                <option value="new-patient-intake">New Patient Intake</option>
                <option value="insurance-collection">Insurance Collection</option>
                <option value="missed-call-recovery">Missed Call Recovery</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
