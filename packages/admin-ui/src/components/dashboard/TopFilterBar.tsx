import { useState } from 'react';
import { SlidersHorizontal, X, RotateCcw, MapPin } from 'lucide-react';
import { getLocationsByState, stateNames } from '../../data/locations';

/* ══════════════════════════════════════════════
   DASHBOARD PERSPECTIVE / VIEW TOGGLE
   ══════════════════════════════════════════════
   These are NOT filters — they are dashboard lenses
   that change which metrics are emphasized.
   - Overall: holistic view (default)
   - Bot Only: automated performance emphasis
   - Human Handoff: escalation + handoff emphasis
   - Recovery: missed call recovery emphasis
   ══════════════════════════════════════════════ */

export type DashboardView = 'overall' | 'bot' | 'human' | 'recovery';

const viewOptions: { key: DashboardView; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'bot', label: 'Bot Only' },
  { key: 'human', label: 'Human Handoff' },
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
  /** Dashboard perspective toggle */
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
  onReset,
  dashboardView = 'overall',
  onDashboardViewChange,
}: TopFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvancedFilters = channelValue !== 'all' || sourceValue !== 'all' || playbookValue !== 'all';
  const advancedCount = [channelValue !== 'all', sourceValue !== 'all', playbookValue !== 'all'].filter(Boolean).length;

  return (
    <>
      {/* ── Compact Control Bar ────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Range */}
        <div className="flex rounded-lg border border-healthcare-border overflow-hidden">
          {dateRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => onDateRangeChange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === r.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-healthcare-muted hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Compact Location */}
        <div className="relative flex items-center">
          <MapPin className="absolute left-2.5 w-3 h-3 text-healthcare-muted pointer-events-none" />
          <select
            className="select text-xs pl-7 pr-6 py-1.5 min-w-[140px]"
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

        {/* View / Perspective Toggle */}
        {onDashboardViewChange && (
          <div className="flex rounded-lg border border-healthcare-border overflow-hidden">
            {viewOptions.map((v) => (
              <button
                key={v.key}
                onClick={() => onDashboardViewChange(v.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dashboardView === v.key
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-healthcare-muted hover:bg-gray-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Advanced Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showAdvanced || hasAdvancedFilters
              ? 'bg-brand-50 text-brand-700 border-brand-200'
              : 'bg-white text-healthcare-muted border-healthcare-border hover:text-healthcare-text'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Advanced Filters
          {advancedCount > 0 && (
            <span className="bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {advancedCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Advanced Filters Panel ─────────────── */}
      {showAdvanced && (
        <div className="bg-white border border-healthcare-border rounded-xl shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-healthcare-text uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              {hasAdvancedFilters && (
                <button
                  onClick={() => {
                    onChannelChange('all');
                    onSourceChange('all');
                    onPlaybookChange('all');
                  }}
                  className="flex items-center gap-1 text-[10px] text-healthcare-muted hover:text-healthcare-text"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => setShowAdvanced(false)}
                className="p-1 text-healthcare-muted hover:text-healthcare-text rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Channel */}
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

            {/* Source */}
            <div>
              <label className="text-[10px] font-medium text-healthcare-muted mb-1 block">Source</label>
              <select className="select text-xs w-full" value={sourceValue} onChange={(e) => onSourceChange(e.target.value)}>
                <option value="all">All Sources</option>
                <option value="google">Google Ads</option>
                <option value="facebook">Facebook</option>
                <option value="organic">Organic</option>
                <option value="referral">Referral</option>
                <option value="bing">Bing Ads</option>
              </select>
            </div>

            {/* Playbook */}
            <div>
              <label className="text-[10px] font-medium text-healthcare-muted mb-1 block">Playbook</label>
              <select className="select text-xs w-full" value={playbookValue} onChange={(e) => onPlaybookChange(e.target.value)}>
                <option value="all">All Playbooks</option>
                <option value="new-patient-intake">New Patient Intake</option>
                <option value="insurance-collection">Insurance Collection</option>
                <option value="appointment-scheduling">Appointment Scheduling</option>
                <option value="missed-call-recovery">Missed Call Recovery</option>
                <option value="callback-request">Callback Request</option>
                <option value="faq">FAQ</option>
                <option value="human-handoff">Human Handoff</option>
              </select>
            </div>
          </div>

          {/* Active filters summary */}
          {hasAdvancedFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-healthcare-border">
              <span className="text-[10px] text-healthcare-muted">Active:</span>
              {channelValue !== 'all' && (
                <span className="badge bg-blue-50 text-blue-700 text-[10px]">
                  Channel: {channelValue}
                  <button onClick={() => onChannelChange('all')} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              {sourceValue !== 'all' && (
                <span className="badge bg-purple-50 text-purple-700 text-[10px]">
                  Source: {sourceValue}
                  <button onClick={() => onSourceChange('all')} className="ml-1 hover:text-purple-900">×</button>
                </span>
              )}
              {playbookValue !== 'all' && (
                <span className="badge bg-amber-50 text-amber-700 text-[10px]">
                  Playbook: {playbookValue}
                  <button onClick={() => onPlaybookChange('all')} className="ml-1 hover:text-amber-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
