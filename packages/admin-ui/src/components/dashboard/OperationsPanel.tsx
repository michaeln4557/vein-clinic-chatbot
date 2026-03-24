import { Radio, AlertTriangle, ShieldAlert, Brain, MessageSquareWarning } from 'lucide-react';
import { operationsPanelData } from '../../data/mockDashboardData';

const issueIcons: Record<string, typeof AlertTriangle> = {
  'Insurance confusion': ShieldAlert,
  'Tone issues': MessageSquareWarning,
  'Low confidence': Brain,
  'Policy flags': AlertTriangle,
};

const severityColors: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-gray-600 bg-gray-50',
};

export default function OperationsPanel() {
  const { activeCount, waitingCount, handoffCount, avgWaitSeconds, longestWaitSeconds, topIssues } = operationsPanelData;
  const longestMin = Math.floor(longestWaitSeconds / 60);
  const longestSec = longestWaitSeconds % 60;

  // Determine dominant issue
  const mainIssue = topIssues.length > 0 ? topIssues.reduce((a, b) => (a.count > b.count ? a : b)) : null;
  const mainIssueDominant = mainIssue && topIssues.length > 1 && mainIssue.count > topIssues[1].count;

  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Operations</h3>
        </div>
        <span className="text-xl font-bold">{activeCount}</span>
      </div>

      <div className="card-body space-y-4">
        {/* Live Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-healthcare-muted">Active</p>
            <p className="text-sm font-bold text-emerald-600">{activeCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-healthcare-muted">Waiting</p>
            <p className="text-sm font-bold text-amber-600">{waitingCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-healthcare-muted">Handoff</p>
            <p className="text-sm font-bold text-red-600">{handoffCount}</p>
          </div>
        </div>

        {/* Wait Times */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-healthcare-muted">Avg wait: </span>
            <span className="font-medium">{avgWaitSeconds}s</span>
          </div>
          <div>
            <span className="text-healthcare-muted">Longest: </span>
            <span className={`font-medium ${longestWaitSeconds > 300 ? 'text-red-600' : 'text-amber-600'}`}>
              {longestMin}m {String(longestSec).padStart(2, '0')}s
            </span>
          </div>
        </div>

        {/* Needs action now */}
        {mainIssue && mainIssueDominant && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-red-700">Needs action now</p>
                <p className="text-xs font-semibold text-red-800">{mainIssue.label}</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-red-600 hover:text-red-800 cursor-pointer whitespace-nowrap">
              Review playbook →
            </span>
          </div>
        )}

        {/* Top Issues */}
        <div>
          <p className="text-xs font-medium text-healthcare-muted mb-2">Top Issues Today</p>
          <div className="space-y-1.5">
            {topIssues.map((issue) => {
              const Icon = issueIcons[issue.label] || AlertTriangle;
              const colors = severityColors[issue.severity];
              return (
                <div key={issue.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${colors}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-xs">{issue.label}</span>
                  </div>
                  <span className="text-xs font-semibold">{issue.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
