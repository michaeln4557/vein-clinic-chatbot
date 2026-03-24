import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { DecisionBarData } from '../../data/mockDashboardData';

const severityConfig = {
  healthy: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', btnBg: 'bg-emerald-600 hover:bg-emerald-700' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', btnBg: 'bg-amber-600 hover:bg-amber-700' },
  critical: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', btnBg: 'bg-red-600 hover:bg-red-700' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', btnBg: 'bg-blue-600 hover:bg-blue-700' },
};

interface DecisionBarProps {
  data: DecisionBarData;
}

export default function DecisionBar({ data }: DecisionBarProps) {
  const config = severityConfig[data.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border px-4 py-3 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-5 h-5 shrink-0 ${config.text}`} />
          <div className="min-w-0">
            <span className={`text-sm font-semibold ${config.text}`}>{data.title}</span>
            <span className={`text-sm ${config.text} opacity-75 ml-2`}>{data.reason}</span>
          </div>
        </div>
        <button
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${config.btnBg} transition-colors`}
        >
          {data.ctaLabel}
        </button>
      </div>
    </div>
  );
}
