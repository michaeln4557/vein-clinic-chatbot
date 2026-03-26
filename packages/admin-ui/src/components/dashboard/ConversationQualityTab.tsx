import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { ncsBreakdown, tcsBreakdown, qualityTrendData, qualityHeatmapData, lowConfidenceSessions } from '../../data/mockAnalyticsData';

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 70) return 'bg-teal-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function heatmapBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-teal-100 text-teal-800';
  if (score >= 60) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

interface ScoreCardProps {
  title: string;
  overall: number;
  components: { name: string; score: number; weight: number }[];
  color: string;
}

function ScoreCard({ title, overall, components, color }: ScoreCardProps) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className={`text-3xl font-bold ${color}`}>{overall}</div>
      </div>
      <div className="card-body space-y-3">
        {components.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-healthcare-muted">{c.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{c.score}</span>
                <span className="text-[10px] text-healthcare-muted">({(c.weight * 100).toFixed(0)}% weight)</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className={`h-full rounded-full ${scoreColor(c.score)}`} style={{ width: `${c.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConversationQualityTab() {
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

  return (
    <div className="space-y-6">
      {/* Composite Score Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScoreCard title="Natural Conversation Score (NCS)" overall={ncsBreakdown.overall} components={ncsBreakdown.components} color="text-teal-600" />
        <ScoreCard title="Trust & Comfort Score (TCS)" overall={tcsBreakdown.overall} components={tcsBreakdown.components} color="text-brand-600" />
      </div>

      {/* Quality Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Quality Score Trends</h3>
        </div>
        <div className="card-body" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={qualityTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 90]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ncs" name="NCS" stroke="#0d9488" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tcs" name="TCS" stroke="#1d6ef1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quality Heatmap */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Quality Heatmap (NCS by Playbook & Hour)</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Playbook</th>
                {hours.map((h) => (
                  <th key={h} className="table-header text-center">{h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-line">
              {qualityHeatmapData.map((row) => (
                <tr key={row.playbook}>
                  <td className="table-cell text-xs font-medium">{row.playbook}</td>
                  {hours.map((h) => {
                    const score = row.hours[h as keyof typeof row.hours] ?? 0;
                    return (
                      <td key={h} className="table-cell text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${heatmapBg(score)}`}>
                          {score}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low-Confidence Sessions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Low-Confidence Sessions</h3>
        </div>
        <div className="card-body">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Conversation</th>
                <th className="table-header text-left">Playbook</th>
                <th className="table-header text-right">Min Confidence</th>
                <th className="table-header text-right">Fallbacks</th>
                <th className="table-header text-left">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-line">
              {lowConfidenceSessions.map((s) => (
                <tr key={s.id}>
                  <td className="table-cell text-xs font-mono">{s.id}</td>
                  <td className="table-cell text-xs">{s.playbook}</td>
                  <td className="table-cell text-xs text-right">
                    <span className={`font-semibold ${s.minConfidence < 0.4 ? 'text-red-600' : 'text-amber-600'}`}>
                      {s.minConfidence.toFixed(2)}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-right">{s.fallbacksUsed}</td>
                  <td className="table-cell text-xs">
                    <StatusBadge
                      variant={s.outcome === 'abandoned' ? 'error' : s.outcome === 'handoff' ? 'warning' : 'info'}
                      label={s.outcome}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
