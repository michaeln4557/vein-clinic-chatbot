import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { recoveryPipeline, recoveryTrendData, recoveryByHour, recoveryByLocation, smsTemplatePerformance } from '../../data/mockAnalyticsData';

export default function MissedCallRecoveryTab() {
  return (
    <div className="space-y-6">
      {/* Pipeline KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {recoveryPipeline.map((stage, i) => (
          <div key={stage.stage} className="card card-body text-center">
            <p className="text-xs text-healthcare-muted">{stage.stage}</p>
            <p className="text-2xl font-bold mt-1">{stage.value.toLocaleString()}</p>
            {stage.rate !== null && (
              <p className="text-xs text-teal-600 font-medium mt-1">{stage.rate}% from prev</p>
            )}
          </div>
        ))}
      </div>

      {/* Overall rate highlight */}
      <div className="card card-body bg-teal-50 border-teal-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-800">Missed Call Recovery Rate</p>
            <p className="text-xs text-teal-600 mt-0.5">Percentage of missed calls that result in a confirmed booking</p>
          </div>
          <p className="text-4xl font-bold text-teal-700">18.4%</p>
        </div>
      </div>

      {/* Recovery Rate Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Recovery Rate Trend (30 Days)</h3>
        </div>
        <div className="card-body" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recoveryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis domain={[55, 85]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="rate" name="Recovery Rate" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recovery by Hour */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Recovery Rate by Time of Day</h3>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recoveryByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis domain={[40, 85]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="rate" name="Recovery Rate" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SMS Template Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">SMS Template Performance</h3>
          </div>
          <div className="card-body">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Template</th>
                  <th className="table-header text-right">Sent</th>
                  <th className="table-header text-right">Response</th>
                  <th className="table-header text-right">Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-healthcare-line">
                {smsTemplatePerformance.map((t) => (
                  <tr key={t.template}>
                    <td className="table-cell text-xs font-medium">{t.template}</td>
                    <td className="table-cell text-xs text-right text-healthcare-muted">{t.timesSent}</td>
                    <td className="table-cell text-xs text-right font-medium">{t.responseRate}%</td>
                    <td className="table-cell text-xs text-right font-semibold text-teal-600">{t.bookingRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recovery by Location */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Recovery by Location</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Location</th>
                <th className="table-header text-right">Missed Calls</th>
                <th className="table-header text-right">SMS Sent</th>
                <th className="table-header text-right">Response Rate</th>
                <th className="table-header text-right">Booking Rate</th>
                <th className="table-header text-right">Recovery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-line">
              {recoveryByLocation.map((loc) => (
                <tr key={loc.location}>
                  <td className="table-cell text-xs font-medium">{loc.location}</td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{loc.missedCalls}</td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{loc.smsSent}</td>
                  <td className="table-cell text-xs text-right font-medium">{loc.responseRate}%</td>
                  <td className="table-cell text-xs text-right font-medium">{loc.bookingRate}%</td>
                  <td className="table-cell text-xs text-right font-semibold text-teal-600">{loc.recoveryRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
