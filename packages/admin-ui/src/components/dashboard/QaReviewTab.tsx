import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { qaKpis, flaggedConversationsFull, editRateTrend, policyViolations } from '../../data/mockAnalyticsData';

const flagTypeLabels: Record<string, string> = {
  low_confidence: 'Low Confidence',
  policy_violation: 'Policy Violation',
  operator_flag: 'Operator Flag',
  sentiment: 'Sentiment',
};

const severityVariants: Record<string, string> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'draft',
};

const statusVariants: Record<string, string> = {
  open: 'pending',
  reviewing: 'active',
  resolved: 'success',
};

export default function QaReviewTab() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {qaKpis.map((kpi) => (
          <div key={kpi.label} className="card card-body">
            <p className="text-xs text-healthcare-muted">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpi.change} vs last period
            </p>
          </div>
        ))}
      </div>

      {/* Flagged Conversations Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-semibold">Flagged Conversations</h3>
          <span className="badge bg-red-100 text-red-700">
            {flaggedConversationsFull.filter((f) => f.status === 'open').length} open
          </span>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Conversation</th>
                <th className="table-header text-left">Flag Type</th>
                <th className="table-header text-left">Playbook</th>
                <th className="table-header text-left">Flagged By</th>
                <th className="table-header text-left">Time</th>
                <th className="table-header text-left">Severity</th>
                <th className="table-header text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-line">
              {flaggedConversationsFull.map((f) => (
                <tr key={f.id}>
                  <td className="table-cell text-xs font-mono">{f.id}</td>
                  <td className="table-cell text-xs">
                    <span className="badge bg-gray-100 text-gray-600">{flagTypeLabels[f.flagType]}</span>
                  </td>
                  <td className="table-cell text-xs">{f.playbook}</td>
                  <td className="table-cell text-xs text-healthcare-muted">{f.flaggedBy}</td>
                  <td className="table-cell text-xs text-healthcare-muted">{f.flaggedAt}</td>
                  <td className="table-cell text-xs">
                    <StatusBadge variant={severityVariants[f.severity] as any} label={f.severity} />
                  </td>
                  <td className="table-cell text-xs">
                    <StatusBadge variant={statusVariants[f.status] as any} label={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Edit Rate Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Operator Edit Rate Trend</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={editRateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="editRate" name="Edit Rate" stroke="#1d6ef1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Policy Violations */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Top Policy Violations</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={policyViolations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="rule" type="category" tick={{ fontSize: 10 }} width={180} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
