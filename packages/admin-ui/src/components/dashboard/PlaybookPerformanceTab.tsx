import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { playbookPerformance, radarComparisonData } from '../../data/mockAnalyticsData';

function ncsColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 70) return 'text-teal-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function dropOffColor(rate: number): string {
  if (rate <= 10) return 'text-emerald-600';
  if (rate <= 20) return 'text-amber-600';
  return 'text-red-600';
}

export default function PlaybookPerformanceTab() {
  const activeCount = playbookPerformance.filter((p) => p.status === 'published').length;
  const avgNcs = Math.round(playbookPerformance.reduce((sum, p) => sum + p.ncsScore, 0) / playbookPerformance.length);
  const topPlaybook = [...playbookPerformance].sort((a, b) => b.convRate - a.convRate)[0];
  const bottomPerformers = [...playbookPerformance].sort((a, b) => a.ncsScore - b.ncsScore).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Active Playbooks</p>
          <p className="text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Avg NCS Score</p>
          <p className={`text-2xl font-bold mt-1 ${ncsColor(avgNcs)}`}>{avgNcs}</p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Highest Converting</p>
          <p className="text-lg font-bold mt-1">{topPlaybook?.name}</p>
          <p className="text-xs text-teal-600">{topPlaybook?.convRate}%</p>
        </div>
      </div>

      {/* Full Playbook Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">All Playbooks</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Playbook</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-right">Conversations</th>
                <th className="table-header text-right">Conv Rate</th>
                <th className="table-header text-right">NCS</th>
                <th className="table-header text-right">Drop-off</th>
                <th className="table-header text-right">Avg Msgs</th>
                <th className="table-header text-right">Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-border">
              {playbookPerformance.map((pb) => (
                <tr key={pb.id}>
                  <td className="table-cell text-xs font-medium">{pb.name}</td>
                  <td className="table-cell text-xs">
                    <StatusBadge variant={pb.status === 'published' ? 'published' : 'draft'} label={pb.status} />
                  </td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{pb.conversations}</td>
                  <td className="table-cell text-xs text-right font-semibold text-teal-600">{pb.convRate}%</td>
                  <td className="table-cell text-xs text-right">
                    <span className={`font-semibold ${ncsColor(pb.ncsScore)}`}>{pb.ncsScore}</span>
                  </td>
                  <td className="table-cell text-xs text-right">
                    <span className={`font-semibold ${dropOffColor(pb.dropOff)}`}>{pb.dropOff}%</span>
                  </td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{pb.avgMessages}</td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{pb.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Top 3 Playbook Comparison</h3>
          </div>
          <div className="card-body" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarComparisonData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Radar name="Booking Conversion" dataKey="Booking Conversion" stroke="#0d9488" fill="#0d9488" fillOpacity={0.15} />
                <Radar name="Callback Request" dataKey="Callback Request" stroke="#1d6ef1" fill="#1d6ef1" fillOpacity={0.15} />
                <Radar name="New Patient Intake" dataKey="New Patient Intake" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Playbooks Needing Improvement</h3>
          </div>
          <div className="card-body space-y-4">
            {bottomPerformers.map((pb) => (
              <div key={pb.id} className="border border-healthcare-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">{pb.name}</h4>
                  <span className={`text-lg font-bold ${ncsColor(pb.ncsScore)}`}>{pb.ncsScore}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-healthcare-muted">
                  <div>Conv Rate: <span className="font-medium text-healthcare-text">{pb.convRate}%</span></div>
                  <div>Drop-off: <span className={`font-medium ${dropOffColor(pb.dropOff)}`}>{pb.dropOff}%</span></div>
                  <div>Avg Msgs: <span className="font-medium text-healthcare-text">{pb.avgMessages}</span></div>
                </div>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Recommendation: Review response tone and reduce question repetition
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
