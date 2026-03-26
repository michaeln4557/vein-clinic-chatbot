import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { callbackKpis, callbackQueueFull, handoffReasons, responseTimeDistribution } from '../../data/mockAnalyticsData';

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function CallbackOperationsTab() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {callbackKpis.map((kpi) => (
          <div key={kpi.label} className="card card-body">
            <p className="text-xs text-healthcare-muted">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpi.change} vs last period
            </p>
          </div>
        ))}
      </div>

      {/* Callback Queue Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-semibold">Callback Queue</h3>
          <span className="badge bg-amber-100 text-amber-700">{callbackQueueFull.length} items</span>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">ID</th>
                <th className="table-header text-left">Patient</th>
                <th className="table-header text-left">Source</th>
                <th className="table-header text-left">Priority</th>
                <th className="table-header text-left">Requested</th>
                <th className="table-header text-left">Assigned</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Wait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-line">
              {callbackQueueFull.map((cb) => (
                <tr key={cb.id}>
                  <td className="table-cell text-xs font-mono">{cb.id}</td>
                  <td className="table-cell text-xs">{cb.patient}</td>
                  <td className="table-cell text-xs">{cb.source}</td>
                  <td className="table-cell text-xs">
                    <span className={`badge text-[10px] ${priorityColors[cb.priority]}`}>{cb.priority}</span>
                  </td>
                  <td className="table-cell text-xs text-healthcare-muted">{cb.requestedAt}</td>
                  <td className="table-cell text-xs">{cb.assignedTo}</td>
                  <td className="table-cell text-xs">
                    <StatusBadge
                      variant={cb.status === 'pending' ? 'pending' : cb.status === 'in_progress' ? 'active' : 'info'}
                      label={cb.status.replace('_', ' ')}
                    />
                  </td>
                  <td className="table-cell text-xs text-right font-medium">{cb.waitTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Handoff Reasons */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Top Handoff Reasons</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={handoffReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="reason" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Callback Response Time Distribution</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d6ef1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
