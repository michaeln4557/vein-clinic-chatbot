import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { channelComparison, channelTrendData, campaignPerformance } from '../../data/mockAnalyticsData';

export default function ChannelPerformanceTab() {
  return (
    <div className="space-y-6">
      {/* Channel Comparison Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Channel Comparison</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Channel</th>
                <th className="table-header text-right">Conversations</th>
                <th className="table-header text-right">Bookings</th>
                <th className="table-header text-right">Conv Rate</th>
                <th className="table-header text-right">Avg Time</th>
                <th className="table-header text-right">NCS</th>
                <th className="table-header text-right">Cost/Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-border">
              {channelComparison.map((ch) => (
                <tr key={ch.channel}>
                  <td className="table-cell text-xs font-medium">{ch.channel}</td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{ch.conversations.toLocaleString()}</td>
                  <td className="table-cell text-xs text-right font-medium">{ch.bookings}</td>
                  <td className="table-cell text-xs text-right font-semibold text-teal-600">{ch.convRate}%</td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{ch.avgTimeToBook}</td>
                  <td className="table-cell text-xs text-right">
                    <span className={`font-semibold ${ch.ncsScore >= 80 ? 'text-emerald-600' : ch.ncsScore >= 70 ? 'text-teal-600' : 'text-amber-600'}`}>
                      {ch.ncsScore}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{ch.costPerBooking}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Booking Rate Trends */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Booking Rate Trends by Channel</h3>
        </div>
        <div className="card-body" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={channelTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="webChat" name="Web Chat" stroke="#1d6ef1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="smsRecovery" name="SMS Recovery" stroke="#0d9488" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="smsInbound" name="SMS Inbound" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="phone" name="Phone" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Campaign Performance</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Campaign</th>
                <th className="table-header text-left">Source</th>
                <th className="table-header text-right">Convos</th>
                <th className="table-header text-right">Bookings</th>
                <th className="table-header text-right">Rate</th>
                <th className="table-header text-right">Spend</th>
                <th className="table-header text-right">Cost/Booking</th>
                <th className="table-header text-right">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-border">
              {campaignPerformance.map((c) => (
                <tr key={c.campaign}>
                  <td className="table-cell text-xs font-medium">{c.campaign}</td>
                  <td className="table-cell text-xs">
                    <span className="badge bg-gray-100 text-gray-600">{c.source}</span>
                  </td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{c.conversations}</td>
                  <td className="table-cell text-xs text-right font-medium">{c.bookings}</td>
                  <td className="table-cell text-xs text-right font-semibold text-teal-600">{c.rate}%</td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{c.spend}</td>
                  <td className="table-cell text-xs text-right">{c.costPerBooking}</td>
                  <td className="table-cell text-xs text-right font-semibold">{c.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
