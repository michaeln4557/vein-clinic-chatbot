import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, TrendingUp } from 'lucide-react';
import { dashboardAlerts, type AlertItem } from '../../data/mockDashboardData';

const severityConfig: Record<AlertItem['severity'], { icon: typeof AlertCircle; bg: string; text: string; border: string }> = {
  critical: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const confidenceColors: Record<string, string> = {
  High: 'text-emerald-700 bg-emerald-50',
  Medium: 'text-amber-700 bg-amber-50',
  Low: 'text-gray-600 bg-gray-50',
};

interface AlertsPanelProps {
  onAlertClick?: (alert: AlertItem) => void;
}

export default function AlertsPanel({ onAlertClick }: AlertsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleAlerts = showAll ? dashboardAlerts : dashboardAlerts.slice(0, 4);
  const hasMore = dashboardAlerts.length > 4;

  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold">Alerts</h3>
        <span className="badge bg-red-100 text-red-700">
          {dashboardAlerts.filter((a) => a.severity === 'critical').length} critical
        </span>
      </div>
      <div className="card-body space-y-2">
        {visibleAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${config.bg} ${config.border} ${onAlertClick ? 'cursor-pointer hover:opacity-90' : ''}`}
              onClick={() => onAlertClick?.(alert)}
            >
              <div className="flex items-start gap-2">
                <config.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${config.text}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${config.text}`}>{alert.title}</p>
                  <p className="text-[10px] text-healthcare-muted mt-0.5">{alert.description}</p>

                  {/* Confidence + Expected Impact */}
                  {(alert.confidence || alert.expectedImpact) && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {alert.confidence && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${confidenceColors[alert.confidence]}`}>
                          Confidence: {alert.confidence}
                        </span>
                      )}
                      {alert.expectedImpact && (
                        <span className="flex items-center gap-0.5 text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                          <TrendingUp className="w-2.5 h-2.5" />
                          {alert.expectedImpact}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-[10px] text-healthcare-muted">
                      <span>{alert.ageLabel} ago</span>
                      {alert.owner && (
                        <>
                          <span>·</span>
                          <span>{alert.owner}</span>
                        </>
                      )}
                    </div>
                    <button
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${config.text} hover:opacity-80`}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      {alert.actionLabel}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-healthcare-muted hover:text-healthcare-text transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
            View all ({dashboardAlerts.length})
          </button>
        )}
      </div>
    </div>
  );
}
