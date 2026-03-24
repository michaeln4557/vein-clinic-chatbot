import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { crmSyncKpis, fieldCompleteness, syncErrors, extractionTrend } from '../../data/mockAnalyticsData';

function rateColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-600';
  if (rate >= 70) return 'text-teal-600';
  if (rate >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function rateBg(rate: number): string {
  if (rate >= 90) return 'bg-emerald-100 text-emerald-800';
  if (rate >= 70) return 'bg-teal-100 text-teal-800';
  if (rate >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

const statusVariants: Record<string, string> = {
  retrying: 'warning',
  failed: 'error',
  resolved: 'success',
};

export default function CrmHealthTab() {
  return (
    <div className="space-y-6">
      {/* Sync KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {crmSyncKpis.map((kpi) => (
          <div key={kpi.label} className="card card-body">
            <p className="text-xs text-healthcare-muted">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpi.change} vs last period
            </p>
          </div>
        ))}
      </div>

      {/* Field Completeness Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Field Extraction & Verification</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Field</th>
                <th className="table-header text-right">Extraction Rate</th>
                <th className="table-header text-right">Verification Rate</th>
                <th className="table-header text-right">Conflict Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-border">
              {fieldCompleteness.map((f) => (
                <tr key={f.field}>
                  <td className="table-cell text-xs font-medium">{f.field}</td>
                  <td className="table-cell text-xs text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${rateBg(f.extractionRate)}`}>
                      {f.extractionRate}%
                    </span>
                  </td>
                  <td className="table-cell text-xs text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${rateBg(f.verificationRate)}`}>
                      {f.verificationRate}%
                    </span>
                  </td>
                  <td className="table-cell text-xs text-right">
                    <span className={`font-semibold ${f.conflictRate > 5 ? 'text-red-600' : f.conflictRate > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {f.conflictRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sync Error Log */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Sync Errors</h3>
            <span className="badge bg-red-100 text-red-700">
              {syncErrors.filter((e) => e.status !== 'resolved').length} active
            </span>
          </div>
          <div className="card-body space-y-3">
            {syncErrors.map((err) => (
              <div key={err.id} className="border border-healthcare-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-healthcare-muted">{err.record}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-healthcare-muted">{err.timestamp}</span>
                    <StatusBadge variant={statusVariants[err.status] as any} label={err.status} />
                  </div>
                </div>
                <p className="text-xs text-healthcare-muted">
                  <span className="font-medium text-healthcare-text">{err.field}:</span> {err.error}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Extraction Accuracy Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Extraction Accuracy Trend</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={extractionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[85, 95]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#0d9488" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
