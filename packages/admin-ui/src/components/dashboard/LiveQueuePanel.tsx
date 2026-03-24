import { Radio } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import { liveQueueData } from '../../data/mockDashboardData';

export default function LiveQueuePanel() {
  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Live Operations</h3>
        </div>
        <span className="text-2xl font-bold">{liveQueueData.activeCount}</span>
      </div>
      <div className="card-body space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-healthcare-muted">Avg wait:</span>
          <span className="text-xs font-medium">{liveQueueData.avgWaitSeconds}s</span>
        </div>

        <div className="flex gap-2">
          {liveQueueData.byStatus.map((s) => (
            <div key={s.status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-xs text-healthcare-muted">{s.status}</span>
              <span className="text-xs font-semibold">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-healthcare-muted">Recent Sessions</p>
          {liveQueueData.recentSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-healthcare-muted">{s.id}</span>
                <span className="truncate">{s.playbook}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-healthcare-muted">{s.duration}</span>
                <StatusBadge variant={s.status === 'warning' ? 'warning' : 'active'} label={s.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
