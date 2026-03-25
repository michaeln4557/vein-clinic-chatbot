import { BookOpen } from 'lucide-react';
import { playbookHealthData, type PlaybookHealthRow } from '../../data/mockDashboardData';

const impactLabel = (score: number): { text: string; color: string } => {
  if (score >= 10) return { text: 'HIGH IMPACT', color: 'bg-red-100 text-red-700' };
  if (score >= 5) return { text: 'MEDIUM', color: 'bg-amber-100 text-amber-700' };
  return { text: 'LOW', color: 'bg-gray-100 text-gray-600' };
};

const feelsHumanColor = (ncs: number): string => {
  if (ncs >= 8) return 'text-emerald-600';
  if (ncs >= 6) return 'text-amber-600';
  return 'text-red-600';
};

/** Map playbook to its primary issue for manager context */
const primaryIssues: Record<string, string> = {
  'insurance-collection': 'Insurance hesitation causing early exits',
  'scheduling-unavailable': 'No available slots frustrating patients',
  'low-confidence-fallback': 'Bot uncertainty triggering handoffs',
};

interface PlaybookHealthPanelProps {
  onPlaybookClick?: (row: PlaybookHealthRow) => void;
}

export default function PlaybookHealthPanel({ onPlaybookClick }: PlaybookHealthPanelProps) {
  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold">Playbook Insights</h3>
        </div>
        <span className="badge bg-red-100 text-red-700">
          {playbookHealthData.filter((p) => p.impactScore >= 10).length} needs attention
        </span>
      </div>

      <div className="divide-y divide-healthcare-border">
        {playbookHealthData.map((pb, idx) => {
          const impact = impactLabel(pb.impactScore);
          const issue = primaryIssues[pb.playbookId];
          const isTopPriority = idx === 0;
          return (
            <div
              key={pb.playbookId}
              className={`px-4 py-3 ${isTopPriority ? 'bg-red-50/40' : ''} ${onPlaybookClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onPlaybookClick?.(pb)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {isTopPriority && (
                    <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">#1 Fix</span>
                  )}
                  <span className="text-xs font-medium">{pb.name}</span>
                </div>
                <span className={`badge text-[10px] font-bold ${impact.color}`}>{impact.text}</span>
              </div>
              {issue && (
                <p className="text-[10px] text-healthcare-muted mb-1.5 italic">{issue}</p>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-healthcare-muted">Feels Human</p>
                  <p className={`text-sm font-bold ${feelsHumanColor(pb.ncs)}`}>{pb.ncs}</p>
                </div>
                <div>
                  <p className="text-[10px] text-healthcare-muted">Drop-off</p>
                  <p className={`text-sm font-bold ${pb.dropOffRate > 2.5 ? 'text-red-600' : pb.dropOffRate > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {pb.dropOffRate}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-healthcare-muted">Volume</p>
                  <p className="text-sm font-bold">{pb.conversationVolume}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
