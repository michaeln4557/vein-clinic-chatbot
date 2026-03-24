import { RotateCcw } from 'lucide-react';
import { getLocationsByState, stateNames } from '../../data/locations';

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
}: TopFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Toggle */}
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

      {/* Location — grouped by state */}
      <select className="select text-xs" value={locationValue} onChange={(e) => onLocationChange(e.target.value)}>
        <option value="all">All Locations</option>
        {stateOrder.map((st) => {
          const locs = locationsByState[st];
          if (!locs?.length) return null;
          return (
            <optgroup key={st} label={stateNames[st] || st}>
              {locs.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      {/* Channel */}
      <select className="select text-xs" value={channelValue} onChange={(e) => onChannelChange(e.target.value)}>
        <option value="all">All Channels</option>
        <option value="web-chat">Web Chat</option>
        <option value="sms-recovery">SMS (Missed Call)</option>
        <option value="sms-inbound">SMS (Inbound)</option>
        <option value="phone">Phone Transfer</option>
      </select>

      {/* Source */}
      <select className="select text-xs" value={sourceValue} onChange={(e) => onSourceChange(e.target.value)}>
        <option value="all">All Sources</option>
        <option value="google">Google Ads</option>
        <option value="facebook">Facebook</option>
        <option value="organic">Organic</option>
        <option value="referral">Referral</option>
        <option value="bing">Bing Ads</option>
      </select>

      {/* Playbook */}
      <select className="select text-xs" value={playbookValue} onChange={(e) => onPlaybookChange(e.target.value)}>
        <option value="all">All Playbooks</option>
        <option value="new-patient-intake">New Patient Intake</option>
        <option value="insurance-collection">Insurance Collection</option>
        <option value="appointment-scheduling">Appointment Scheduling</option>
        <option value="missed-call-recovery">Missed Call Recovery</option>
        <option value="callback-request">Callback Request</option>
        <option value="faq">FAQ</option>
        <option value="human-handoff">Human Handoff</option>
      </select>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 px-2 py-1.5 text-xs text-healthcare-muted hover:text-healthcare-text transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        Reset
      </button>
    </div>
  );
}
