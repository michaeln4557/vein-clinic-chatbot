import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

type CrmReadyState = 'ready' | 'partial' | 'not_ready' | 'syncing' | 'synced' | 'error';

interface CrmReadyBadgeProps {
  state: CrmReadyState;
  fieldsComplete?: number;
  fieldsTotal?: number;
}

const config: Record<CrmReadyState, { icon: React.ElementType; label: string; className: string }> = {
  ready: {
    icon: CheckCircle2,
    label: 'CRM Ready',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  partial: {
    icon: AlertTriangle,
    label: 'Partially Ready',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  not_ready: {
    icon: XCircle,
    label: 'Not Ready',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  syncing: {
    icon: Loader2,
    label: 'Syncing...',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  synced: {
    icon: CheckCircle2,
    label: 'Synced',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  error: {
    icon: XCircle,
    label: 'Sync Error',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export default function CrmReadyBadge({ state, fieldsComplete, fieldsTotal }: CrmReadyBadgeProps) {
  const c = config[state];
  const Icon = c.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${c.className}`}
    >
      <Icon className={`w-4 h-4 ${state === 'syncing' ? 'animate-spin' : ''}`} />
      <span>{c.label}</span>
      {fieldsComplete !== undefined && fieldsTotal !== undefined && (
        <span className="text-xs opacity-75">
          ({fieldsComplete}/{fieldsTotal} fields)
        </span>
      )}
    </div>
  );
}
