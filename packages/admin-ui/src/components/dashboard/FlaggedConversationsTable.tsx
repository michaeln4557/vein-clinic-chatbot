import { AlertTriangle, ShieldAlert, MessageSquareWarning, Frown } from 'lucide-react';
import { flaggedConversations, type FlaggedItem } from '../../data/mockDashboardData';

const typeConfig: Record<FlaggedItem['type'], { icon: typeof AlertTriangle; color: string; label: string }> = {
  low_confidence: { icon: AlertTriangle, color: 'text-amber-500', label: 'Low Confidence' },
  policy_violation: { icon: ShieldAlert, color: 'text-red-500', label: 'Policy Violation' },
  operator_flag: { icon: MessageSquareWarning, color: 'text-blue-500', label: 'Operator Flag' },
  sentiment: { icon: Frown, color: 'text-purple-500', label: 'Negative Sentiment' },
};

export default function FlaggedConversationsTable() {
  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold">Flagged Conversations</h3>
        <span className="badge bg-red-100 text-red-700">{flaggedConversations.length}</span>
      </div>
      <div className="divide-y divide-healthcare-border">
        {flaggedConversations.map((f) => {
          const config = typeConfig[f.type];
          return (
            <div key={f.id} className="px-4 py-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <config.icon className={`w-3.5 h-3.5 ${config.color}`} />
                  <span className="text-xs font-medium">{config.label}</span>
                </div>
                <span className="text-[10px] text-healthcare-muted">{f.time}</span>
              </div>
              <p className="text-xs text-healthcare-muted line-clamp-1">{f.snippet}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
