import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatusBadge from '../shared/StatusBadge';
import { locationComparison, locationTrendData } from '../../data/mockAnalyticsData';

function tierBadge(convRate: number): { variant: string; label: string } {
  if (convRate >= 25) return { variant: 'success', label: 'Top' };
  if (convRate >= 22) return { variant: 'active', label: 'Mid' };
  return { variant: 'warning', label: 'Low' };
}

export default function LocationPerformanceTab() {
  return (
    <div className="space-y-6">
      {/* Location Comparison Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Location Performance Comparison</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Location</th>
                <th className="table-header text-right">Conversations</th>
                <th className="table-header text-right">Bookings</th>
                <th className="table-header text-right">Conv Rate</th>
                <th className="table-header text-right">Avg Wait</th>
                <th className="table-header text-right">NCS</th>
                <th className="table-header text-right">Recovery</th>
                <th className="table-header text-right">CRM Sync</th>
                <th className="table-header text-center">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-line">
              {locationComparison.map((loc) => {
                const tier = tierBadge(loc.convRate);
                return (
                  <tr key={loc.location}>
                    <td className="table-cell text-xs font-medium">{loc.location}</td>
                    <td className="table-cell text-xs text-right text-healthcare-muted">{loc.conversations}</td>
                    <td className="table-cell text-xs text-right font-medium">{loc.bookings}</td>
                    <td className="table-cell text-xs text-right font-semibold text-teal-600">{loc.convRate}%</td>
                    <td className="table-cell text-xs text-right text-healthcare-muted">{loc.avgWait}</td>
                    <td className="table-cell text-xs text-right">
                      <span className={`font-semibold ${loc.ncsScore >= 80 ? 'text-emerald-600' : loc.ncsScore >= 70 ? 'text-teal-600' : 'text-amber-600'}`}>
                        {loc.ncsScore}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-right">{loc.recoveryRate}%</td>
                    <td className="table-cell text-xs text-right">{loc.crmSync}%</td>
                    <td className="table-cell text-center">
                      <StatusBadge variant={tier.variant as any} label={tier.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Booking Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Booking Rate Trends by Location</h3>
        </div>
        <div className="card-body" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={locationTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="midtown" name="Midtown" stroke="#1d6ef1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="brooklyn" name="Brooklyn" stroke="#0d9488" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fortWorth" name="Fort Worth" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="hoboken" name="Hoboken" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
