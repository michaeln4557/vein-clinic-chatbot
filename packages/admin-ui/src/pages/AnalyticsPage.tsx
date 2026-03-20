import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  PhoneOff,
  UserCheck,
  Clock,
  AlertTriangle,
  Beaker,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type DateRange = '7d' | '14d' | '30d' | '90d';

const funnelData = [
  { name: 'Missed Calls', value: 1840, fill: '#0d9488' },
  { name: 'SMS Sent', value: 1520, fill: '#14b8a6' },
  { name: 'Patient Responded', value: 892, fill: '#2dd4bf' },
  { name: 'Lead Created', value: 674, fill: '#5eead4' },
  { name: 'Booking Started', value: 412, fill: '#99f6e4' },
  { name: 'Booking Confirmed', value: 338, fill: '#0f766e' },
];

const recoveryRateData = [
  { date: 'Mar 6', rate: 62 },
  { date: 'Mar 7', rate: 65 },
  { date: 'Mar 8', rate: 58 },
  { date: 'Mar 9', rate: 61 },
  { date: 'Mar 10', rate: 68 },
  { date: 'Mar 11', rate: 72 },
  { date: 'Mar 12', rate: 70 },
  { date: 'Mar 13', rate: 74 },
  { date: 'Mar 14', rate: 71 },
  { date: 'Mar 15', rate: 69 },
  { date: 'Mar 16', rate: 73 },
  { date: 'Mar 17', rate: 76 },
  { date: 'Mar 18', rate: 75 },
  { date: 'Mar 19', rate: 78 },
  { date: 'Mar 20', rate: 73 },
];

const bookingByLocation = [
  { location: 'Downtown', rate: 48, bookings: 164 },
  { location: 'Westlake', rate: 42, bookings: 98 },
  { location: 'Round Rock', rate: 36, bookings: 62 },
];

const dropoffData = [
  { step: 'Greeting', dropoff: 5 },
  { step: 'Symptom Capture', dropoff: 12 },
  { step: 'Insurance Inquiry', dropoff: 22 },
  { step: 'Location Select', dropoff: 5 },
  { step: 'Scheduling', dropoff: 14 },
  { step: 'Confirmation', dropoff: 3 },
];

const abTestResults = [
  {
    id: 'ab-1',
    name: 'Missed Call SMS Tone',
    status: 'completed' as const,
    startDate: '2026-03-01',
    endDate: '2026-03-14',
    controlLabel: 'Professional',
    controlRate: 18.4,
    controlN: 420,
    variantLabel: 'Empathetic',
    variantRate: 22.1,
    variantN: 430,
    winner: 'variant' as const,
    significance: 0.95,
  },
  {
    id: 'ab-2',
    name: 'Post-Procedure Check-In',
    status: 'completed' as const,
    startDate: '2026-03-05',
    endDate: '2026-03-18',
    controlLabel: 'Generic',
    controlRate: 34.2,
    controlN: 310,
    variantLabel: 'Provider-Specific',
    variantRate: 41.8,
    variantN: 305,
    winner: 'variant' as const,
    significance: 0.98,
  },
  {
    id: 'ab-3',
    name: 'Insurance Collection Timing',
    status: 'running' as const,
    startDate: '2026-03-15',
    endDate: null,
    controlLabel: 'Ask early',
    controlRate: 28.1,
    controlN: 142,
    variantLabel: 'Ask after symptoms',
    variantRate: 31.4,
    variantN: 138,
    winner: null,
    significance: 0.72,
  },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('14d');

  const metricCards = [
    {
      label: 'Insurance Abandonment Rate',
      value: '18.3%',
      change: '-2.1%',
      improving: true,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      description: 'Drop-off during insurance verification step',
    },
    {
      label: 'Human Handoff Rate',
      value: '12.7%',
      change: '-0.8%',
      improving: true,
      icon: UserCheck,
      color: 'bg-purple-50 text-purple-600',
      description: 'Conversations escalated to live staff',
    },
    {
      label: 'Time to Booking (Avg)',
      value: '4m 32s',
      change: '-18s',
      improving: true,
      icon: Clock,
      color: 'bg-teal-50 text-teal-600',
      description: 'First message to confirmed appointment',
    },
    {
      label: 'Missed Call Recovery',
      value: '73.2%',
      change: '+4.2%',
      improving: true,
      icon: PhoneOff,
      color: 'bg-brand-50 text-brand-600',
      description: 'Missed calls converted to engagement',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Analytics</h1>
          <p className="text-healthcare-muted mt-1">
            Conversion metrics, performance trends, and A/B test results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-healthcare-muted" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['7d', '14d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-white text-healthcare-text shadow-sm'
                    : 'text-healthcare-muted hover:text-healthcare-text'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <div key={m.label} className="card card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-healthcare-muted">{m.label}</p>
                <p className="text-2xl font-bold mt-1">{m.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${m.color}`}>
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-healthcare-muted mt-1">{m.description}</p>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {m.improving ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className="text-emerald-600 font-medium">{m.change}</span>
              <span className="text-healthcare-muted ml-1">vs prev. period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold">Conversion Funnel</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {funnelData.map((step, idx) => {
                const maxVal = funnelData[0].value;
                const pct = (step.value / maxVal) * 100;
                const convRate = idx > 0 ? Math.round((step.value / funnelData[idx - 1].value) * 100) : 100;
                return (
                  <div key={step.name} className="flex items-center gap-3">
                    <span className="text-xs text-healthcare-muted w-32 text-right shrink-0">{step.name}</span>
                    <div className="flex-1 relative">
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all"
                          style={{ width: `${pct}%`, backgroundColor: step.fill }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <span className="text-sm font-bold">{step.value.toLocaleString()}</span>
                      {idx > 0 && (
                        <span className="text-xs text-healthcare-muted ml-1">({convRate}%)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-healthcare-border text-center">
              <p className="text-xs text-healthcare-muted">
                Overall: <span className="font-bold text-brand-700">
                  {Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100)}%
                </span> missed calls to confirmed bookings
              </p>
            </div>
          </div>
        </div>

        {/* Missed Call Recovery Rate (Line Chart) */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold">Missed Call Recovery Rate</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={recoveryRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis domain={[50, 85]} tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`${value}%`, 'Recovery Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0d9488' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Booking Completion by Location (Bar Chart) */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold">Booking Completion by Location</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bookingByLocation} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="location" tick={{ fontSize: 12 }} stroke="#9ca3af" width={90} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value: number, _name: string, props: any) => [
                    `${value}% (${props.payload.bookings} bookings)`,
                    'Completion Rate',
                  ]}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {bookingByLocation.map((_entry, index) => (
                    <Cell key={index} fill={['#0d9488', '#14b8a6', '#2dd4bf'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drop-off by Workflow Step (Bar Chart) */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Drop-off by Workflow Step</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dropoffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="step" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-15} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`${value}%`, 'Drop-off Rate']}
                />
                <Bar dataKey="dropoff" radius={[4, 4, 0, 0]}>
                  {dropoffData.map((entry, index) => (
                    <Cell key={index} fill={entry.dropoff > 15 ? '#ef4444' : entry.dropoff > 10 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* A/B Test Results */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Beaker className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold">A/B Test Results</h3>
        </div>
        <div className="divide-y divide-healthcare-border">
          {abTestResults.map((test) => {
            const lift = ((test.variantRate - test.controlRate) / test.controlRate * 100).toFixed(1);
            const isSignificant = test.significance >= 0.95;
            return (
              <div key={test.id} className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold">{test.name}</h4>
                    {test.status === 'completed' ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Completed</span>
                    ) : (
                      <span className="badge bg-blue-50 text-blue-700">Running</span>
                    )}
                    {isSignificant && test.status === 'completed' && (
                      <span className="badge bg-purple-50 text-purple-700">Statistically Significant</span>
                    )}
                  </div>
                  <span className="text-xs text-healthcare-muted">
                    {test.startDate} &mdash; {test.endDate || 'ongoing'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-3 border ${test.winner === 'control' ? 'border-emerald-300 bg-emerald-50' : 'border-healthcare-border bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-healthcare-muted">Control: {test.controlLabel}</span>
                      {test.winner === 'control' && <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">Winner</span>}
                    </div>
                    <p className="text-xl font-bold">{test.controlRate}%</p>
                    <p className="text-xs text-healthcare-muted">n={test.controlN.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-3 border ${test.winner === 'variant' ? 'border-emerald-300 bg-emerald-50' : 'border-healthcare-border bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-healthcare-muted">Variant: {test.variantLabel}</span>
                      {test.winner === 'variant' && <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">Winner</span>}
                    </div>
                    <p className="text-xl font-bold">{test.variantRate}%</p>
                    <p className="text-xs text-healthcare-muted">n={test.variantN.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-healthcare-muted">
                  <span>
                    Lift: <span className={`font-medium ${Number(lift) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>+{lift}%</span>
                  </span>
                  <span>
                    Confidence: <span className={`font-medium ${isSignificant ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Math.round(test.significance * 100)}%
                    </span>
                  </span>
                  <span>
                    Total sample: {(test.controlN + test.variantN).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
