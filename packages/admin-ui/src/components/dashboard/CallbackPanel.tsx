import { useState } from 'react';
import { PhoneCall, Info } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import {
  callbackPanelSummary,
  callbackQueue,
  type CallbackItem,
} from '../../data/mockDashboardData';

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

const statusVariant: Record<string, 'pending' | 'active' | 'info' | 'warning' | 'error'> = {
  pending: 'pending',
  in_progress: 'active',
  scheduled: 'info',
  overdue: 'error',
};

/** SLA thresholds for avg response time */
function responseTimeColor(minutes: number): string {
  if (minutes <= 15) return 'text-emerald-600';
  if (minutes <= 30) return 'text-amber-600';
  return 'text-red-600';
}

function responseTimeBadge(minutes: number): { label: string; color: string } {
  if (minutes <= 15) return { label: 'Within SLA', color: 'bg-emerald-100 text-emerald-700' };
  if (minutes <= 30) return { label: 'At Risk', color: 'bg-amber-100 text-amber-700' };
  return { label: 'SLA Breached', color: 'bg-red-100 text-red-700' };
}

/** Callback conversion color */
function conversionColor(rate: number): string {
  if (rate >= 8) return 'text-emerald-600';
  if (rate >= 5) return 'text-amber-600';
  return 'text-red-600';
}

interface CallbackPanelProps {
  onItemClick?: (item: CallbackItem) => void;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="w-3 h-3 text-gray-400 cursor-help" />
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-2 py-1.5 text-[10px] text-white bg-gray-800 rounded-lg shadow-lg pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

export default function CallbackPanel({ onItemClick }: CallbackPanelProps) {
  const sla = responseTimeBadge(callbackPanelSummary.avgResponseMinutes);

  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Callbacks</h3>
        </div>
        <span className="badge bg-amber-100 text-amber-700">{callbackPanelSummary.pendingCount} pending</span>
      </div>

      {/* Summary Metrics */}
      <div className="px-4 py-3 border-b border-healthcare-border">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-healthcare-muted">Pending</p>
            <p className="text-lg font-bold">{callbackPanelSummary.pendingCount}</p>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-healthcare-muted">Avg Response</p>
              <Tooltip text="Target: under 15 min. Yellow at 15–30 min. Red over 30 min." />
            </div>
            <div className="flex items-center gap-1.5">
              <p className={`text-lg font-bold ${responseTimeColor(callbackPanelSummary.avgResponseMinutes)}`}>
                {callbackPanelSummary.avgResponseMinutes}m
              </p>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sla.color}`}>
                {sla.label}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-healthcare-muted">Callback Conversion</p>
              <Tooltip text="Percentage of callback requests that result in a confirmed booking" />
            </div>
            <p className={`text-lg font-bold ${conversionColor(callbackPanelSummary.callbackConversionRate)}`}>
              {callbackPanelSummary.callbackConversionRate}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-healthcare-muted">Missed</p>
            <p className={`text-lg font-bold ${callbackPanelSummary.missedCallbacks > 0 ? 'text-red-600' : ''}`}>
              {callbackPanelSummary.missedCallbacks}
            </p>
          </div>
        </div>
      </div>

      {/* At Risk Summary */}
      {(() => {
        const atRisk = callbackQueue.filter((cb) => cb.ageMinutes >= 15);
        if (atRisk.length === 0) return null;
        return (
          <div className="mx-4 mb-1 px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700">
              {atRisk.length} callback{atRisk.length > 1 ? 's' : ''} at risk (&gt;15 min)
            </span>
            <span className="text-[10px] text-amber-600">Assign now →</span>
          </div>
        );
      })()}

      {/* Queue List */}
      <div className="divide-y divide-healthcare-border">
        {callbackQueue.map((cb) => (
          <div
            key={cb.id}
            className={`px-4 py-2.5 ${cb.status === 'overdue' ? 'border-l-2 border-l-red-500 bg-red-50/50' : ''} ${onItemClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={() => onItemClick?.(cb)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`badge text-[10px] ${priorityColors[cb.priority]}`}>
                  {cb.priority}
                </span>
                <span className="text-xs font-medium">{cb.source}</span>
              </div>
              <span className={`text-xs ${cb.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-healthcare-muted'}`}>
                {cb.waitTime}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-healthcare-muted">
              <span>{cb.assignedTo}</span>
              <StatusBadge
                variant={statusVariant[cb.status] || 'pending'}
                label={cb.status.replace('_', ' ')}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
