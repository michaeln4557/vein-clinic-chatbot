import StatusBadge from '../shared/StatusBadge';
import { callbackQueue } from '../../data/mockDashboardData';

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function CallbackQueueTable() {
  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold">Callback Queue</h3>
        <span className="badge bg-amber-100 text-amber-700">{callbackQueue.length} pending</span>
      </div>
      <div className="divide-y divide-healthcare-line">
        {callbackQueue.map((cb) => (
          <div key={cb.id} className="px-4 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`badge text-[10px] ${priorityColors[cb.priority]}`}>
                  {cb.priority}
                </span>
                <span className="text-xs font-medium">{cb.source}</span>
              </div>
              <span className="text-xs text-healthcare-muted">{cb.waitTime}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-healthcare-muted">
              <span>{cb.assignedTo}</span>
              <StatusBadge
                variant={cb.status === 'pending' ? 'pending' : cb.status === 'in_progress' ? 'active' : 'info'}
                label={cb.status.replace('_', ' ')}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
