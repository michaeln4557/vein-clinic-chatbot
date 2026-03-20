import {
  PhoneOff,
  CalendarCheck,
  MessageSquare,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

const metrics = [
  {
    label: 'Missed Call Recovery Rate',
    value: '73%',
    change: '+4.2%',
    trend: 'up' as const,
    icon: PhoneOff,
    color: 'bg-teal-50 text-teal-600',
  },
  {
    label: 'Booking Rate',
    value: '42%',
    change: '+2.1%',
    trend: 'up' as const,
    icon: CalendarCheck,
    color: 'bg-brand-50 text-brand-600',
  },
  {
    label: 'Active Conversations',
    value: '28',
    change: '-3',
    trend: 'down' as const,
    icon: MessageSquare,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    label: 'Pending Handoffs',
    value: '5',
    change: '+1',
    trend: 'up' as const,
    icon: UserCheck,
    color: 'bg-amber-50 text-amber-600',
  },
];

const recentActivity = [
  {
    id: '1',
    action: 'Playbook updated',
    detail: '"Insurance Pre-Auth" published by Sarah M.',
    time: '12 min ago',
    type: 'info' as const,
  },
  {
    id: '2',
    action: 'Missed call recovered',
    detail: 'Patient J. Thompson rebooked via SMS follow-up',
    time: '28 min ago',
    type: 'success' as const,
  },
  {
    id: '3',
    action: 'Escalation triggered',
    detail: 'Complex insurance case handed off to front desk',
    time: '45 min ago',
    type: 'warning' as const,
  },
  {
    id: '4',
    action: 'Slider adjusted',
    detail: 'Empathy dial increased from 6 to 8 for SMS channel',
    time: '1 hr ago',
    type: 'info' as const,
  },
  {
    id: '5',
    action: 'New feedback submitted',
    detail: 'Operator flagged response as "too salesy" in recovery flow',
    time: '1.5 hrs ago',
    type: 'review' as const,
  },
  {
    id: '6',
    action: 'A/B test completed',
    detail: 'Variant B ("We missed you") outperformed control by 12%',
    time: '2 hrs ago',
    type: 'success' as const,
  },
];

const quickActions = [
  { label: 'Review pending handoffs', href: '/review-queue', icon: UserCheck },
  { label: 'Run test conversation', href: '/test-qa', icon: MessageSquare },
  { label: 'View conversion funnel', href: '/analytics', icon: TrendingUp },
  { label: 'Check audit log', href: '/audit-log', icon: Clock },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Dashboard</h1>
        <p className="text-healthcare-muted mt-1">
          Overview of chatbot performance and recent activity
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="card card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-healthcare-muted">{m.label}</p>
                <p className="text-3xl font-bold mt-1">{m.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${m.color}`}>
                <m.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm">
              {m.trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span
                className={
                  m.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                }
              >
                {m.change}
              </span>
              <span className="text-healthcare-muted ml-1">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base">Recent Activity</h2>
            <button className="btn-ghost text-xs">View all</button>
          </div>
          <div className="divide-y divide-healthcare-border">
            {recentActivity.map((item) => (
              <div key={item.id} className="px-6 py-3 flex items-start gap-3">
                <div className="mt-0.5">
                  <StatusBadge variant={item.type} label={item.action} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-healthcare-text">{item.detail}</p>
                </div>
                <span className="text-xs text-healthcare-muted whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-base">Quick Actions</h2>
          </div>
          <div className="card-body space-y-2">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowUpRight className="w-4 h-4 text-healthcare-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
