import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { funnelKpis, fullFunnelData, dropOffData, abTestResults } from '../../data/mockAnalyticsData';

export default function ConversionFunnelTab() {
  const maxVal = fullFunnelData[0]?.value || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {funnelKpis.map((kpi) => (
          <div key={kpi.label} className="card card-body">
            <p className="text-xs text-healthcare-muted">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            {kpi.change && (
              <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {kpi.change} vs last period
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Full Funnel */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Conversion Funnel</h3>
        </div>
        <div className="card-body space-y-3">
          {fullFunnelData.map((stage, i) => {
            const widthPct = (stage.value / maxVal) * 100;
            const prev = i > 0 ? fullFunnelData[i - 1].value : null;
            const stepRate = prev ? ((stage.value / prev) * 100).toFixed(1) : null;
            return (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{stage.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{stage.value.toLocaleString()}</span>
                    {stepRate && <span className="text-xs text-healthcare-muted">({stepRate}%)</span>}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="h-full rounded-full transition-all" style={{ width: `${widthPct}%`, backgroundColor: stage.fill }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Drop-off by Workflow Step</h3>
        </div>
        <div className="card-body" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dropOffData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="step" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar dataKey="dropOff" name="Drop-off %" fill="#0d9488" radius={[4, 4, 0, 0]}>
                {dropOffData.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* A/B Test Results */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">A/B Test Results</h3>
        </div>
        <div className="card-body space-y-4">
          {abTestResults.map((test) => (
            <div key={test.id} className="border border-healthcare-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">{test.name}</h4>
                <StatusBadge variant={test.status === 'completed' ? 'success' : 'active'} label={test.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-lg p-3 border ${(test.winner as string) === 'control' ? 'border-emerald-300 bg-emerald-50' : 'border-healthcare-line bg-gray-50'}`}>
                  <p className="text-xs text-healthcare-muted mb-1">Control: {test.control.name}</p>
                  <p className="text-lg font-bold">{test.control.rate}%</p>
                  <p className="text-xs text-healthcare-muted">{test.control.conversions}/{test.control.conversations} conversions</p>
                </div>
                <div className={`rounded-lg p-3 border ${test.winner === 'variant' ? 'border-emerald-300 bg-emerald-50' : 'border-healthcare-line bg-gray-50'}`}>
                  <p className="text-xs text-healthcare-muted mb-1">Variant: {test.variant.name}</p>
                  <p className="text-lg font-bold">{test.variant.rate}%</p>
                  <p className="text-xs text-healthcare-muted">{test.variant.conversions}/{test.variant.conversations} conversions</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-healthcare-muted">
                <span>Lift: <span className="font-semibold text-emerald-600">+{test.lift}%</span></span>
                <span>Confidence: <span className="font-semibold">{test.confidence}%</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
