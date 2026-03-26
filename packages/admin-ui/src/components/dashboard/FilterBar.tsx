interface FilterBarProps {
  dateRange: string;
  onDateRangeChange: (r: string) => void;
  showLocation?: boolean;
  locationValue?: string;
  onLocationChange?: (v: string) => void;
  showChannel?: boolean;
  channelValue?: string;
  onChannelChange?: (v: string) => void;
  showSource?: boolean;
  sourceValue?: string;
  onSourceChange?: (v: string) => void;
}

const dateRanges = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '14d', value: '14d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

export default function FilterBar({
  dateRange, onDateRangeChange,
  showLocation, locationValue, onLocationChange,
  showChannel, channelValue, onChannelChange,
  showSource, sourceValue, onSourceChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-lg border border-healthcare-line overflow-hidden">
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

      {showLocation && (
        <select className="select text-xs" value={locationValue} onChange={(e) => onLocationChange?.(e.target.value)}>
          <option value="all">All Locations</option>
          <option value="loc-troy-mi">Troy, MI</option>
          <option value="loc-downtown-detroit-mi">Downtown Detroit, MI</option>
          <option value="loc-schaumburg-il">Schaumburg, IL</option>
          <option value="loc-houston-tx">Houston - Galleria, TX</option>
          <option value="loc-scottsdale-az">Scottsdale, AZ</option>
        </select>
      )}

      {showChannel && (
        <select className="select text-xs" value={channelValue} onChange={(e) => onChannelChange?.(e.target.value)}>
          <option value="all">All Channels</option>
          <option value="web-chat">Web Chat</option>
          <option value="sms-recovery">SMS (Missed Call)</option>
          <option value="sms-inbound">SMS (Inbound)</option>
          <option value="phone">Phone Transfer</option>
        </select>
      )}

      {showSource && (
        <select className="select text-xs" value={sourceValue} onChange={(e) => onSourceChange?.(e.target.value)}>
          <option value="all">All Sources</option>
          <option value="google">Google Ads</option>
          <option value="facebook">Facebook</option>
          <option value="organic">Organic</option>
          <option value="referral">Referral</option>
          <option value="bing">Bing Ads</option>
        </select>
      )}
    </div>
  );
}
