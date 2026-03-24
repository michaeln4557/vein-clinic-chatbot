import { useState } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  RotateCcw,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Shield,
  Users,
  Settings,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

type PlaybookStatus = 'draft' | 'review' | 'published' | 'archived';

interface Playbook {
  id: string;
  name: string;
  description: string;
  status: PlaybookStatus;
  version: string;
  lastModified: string;
  modifiedBy: string;
  category: string;
  triggerIntents: string[];
  channels: ('sms' | 'chat' | 'voice')[];
  steps: number;
  requiredFields: string[];
  toneProfile: string;
  escalationEnabled: boolean;
  routesTo: string[];
  conversionRate?: number;
  avgResponseTime?: string;
}

const mockPlaybooks: Playbook[] = [
  {
    id: 'pb-1',
    name: 'Inbound New Patient',
    description: 'Handles first-time patient inquiries, gathers symptoms and insurance info',
    status: 'published',
    version: 'v3.2',
    lastModified: '2026-03-18',
    modifiedBy: 'Sarah M.',
    category: 'Inbound',
    triggerIntents: ['new_patient_inquiry', 'first_visit', 'general_question'],
    channels: ['sms', 'chat'],
    steps: 6,
    requiredFields: ['name', 'phone', 'insurance', 'symptoms'],
    toneProfile: 'Warm & Professional',
    escalationEnabled: true,
    routesTo: ['Booking Conversion', 'Insurance Collection'],
    conversionRate: 68,
    avgResponseTime: '< 2 min',
  },
  {
    id: 'pb-2',
    name: 'Missed Call Recovery',
    description: 'Automated SMS follow-up for unreturned calls within business hours',
    status: 'published',
    version: 'v2.8',
    lastModified: '2026-03-17',
    modifiedBy: 'Dr. Garcia',
    category: 'Recovery',
    triggerIntents: ['missed_call_detected'],
    channels: ['sms'],
    steps: 5,
    requiredFields: ['phone'],
    toneProfile: 'Warm & Concise',
    escalationEnabled: true,
    routesTo: ['Booking Conversion', 'Callback Request', 'FAQ'],
    conversionRate: 42,
    avgResponseTime: '< 2 min',
  },
  {
    id: 'pb-3',
    name: 'Insurance Pre-Authorization',
    description: 'Guides patients through insurance verification and pre-auth requirements',
    status: 'review',
    version: 'v1.4',
    lastModified: '2026-03-20',
    modifiedBy: 'Sarah M.',
    category: 'Insurance',
    triggerIntents: ['insurance_question', 'coverage_inquiry', 'pre_auth_needed'],
    channels: ['sms', 'chat'],
    steps: 7,
    requiredFields: ['name', 'insurance_provider', 'member_id', 'procedure_type'],
    toneProfile: 'Reassuring & Detailed',
    escalationEnabled: true,
    routesTo: ['Booking Conversion', 'Human Handoff'],
    conversionRate: 55,
    avgResponseTime: '< 3 min',
  },
  {
    id: 'pb-4',
    name: 'Appointment Scheduling',
    description: 'Books consultations with provider availability and location matching',
    status: 'published',
    version: 'v4.1',
    lastModified: '2026-03-15',
    modifiedBy: 'Mike R.',
    category: 'Scheduling',
    triggerIntents: ['wants_appointment', 'ready_to_book', 'schedule_request'],
    channels: ['sms', 'chat', 'voice'],
    steps: 7,
    requiredFields: ['name', 'phone', 'location', 'insurance', 'preferred_time'],
    toneProfile: 'Efficient & Warm',
    escalationEnabled: false,
    routesTo: ['Location Routing', 'Scheduling Unavailable'],
    conversionRate: 82,
    avgResponseTime: '< 4 min',
  },
  {
    id: 'pb-5',
    name: 'Post-Procedure Follow-Up',
    description: 'Automated check-ins after treatment, monitors recovery symptoms',
    status: 'published',
    version: 'v2.0',
    lastModified: '2026-03-14',
    modifiedBy: 'Dr. Garcia',
    category: 'Follow-Up',
    triggerIntents: ['post_procedure_trigger', 'recovery_check'],
    channels: ['sms'],
    steps: 4,
    requiredFields: ['patient_name', 'procedure_date', 'procedure_type'],
    toneProfile: 'Caring & Clinical',
    escalationEnabled: true,
    routesTo: ['Human Handoff', 'Callback Request'],
    conversionRate: undefined,
    avgResponseTime: 'Scheduled',
  },
  {
    id: 'pb-6',
    name: 'Vein Screening Qualification',
    description: 'Pre-screens patients for vein treatment eligibility based on symptoms',
    status: 'published',
    version: 'v3.0',
    lastModified: '2026-03-12',
    modifiedBy: 'Sarah M.',
    category: 'Screening',
    triggerIntents: ['symptom_inquiry', 'eligibility_check', 'do_i_need_treatment'],
    channels: ['chat', 'sms'],
    steps: 5,
    requiredFields: ['symptoms', 'duration', 'severity'],
    toneProfile: 'Empathetic & Informative',
    escalationEnabled: true,
    routesTo: ['Booking Conversion', 'FAQ'],
    conversionRate: 61,
    avgResponseTime: '< 3 min',
  },
  {
    id: 'pb-7',
    name: 'Web Chat Greeting',
    description: 'Initial engagement for website visitors with contextual responses',
    status: 'published',
    version: 'v2.5',
    lastModified: '2026-03-10',
    modifiedBy: 'Mike R.',
    category: 'Inbound',
    triggerIntents: ['chat_opened', 'website_visitor'],
    channels: ['chat'],
    steps: 3,
    requiredFields: [],
    toneProfile: 'Friendly & Brief',
    escalationEnabled: false,
    routesTo: ['Inbound New Patient', 'FAQ', 'Booking Conversion'],
    conversionRate: 38,
    avgResponseTime: 'Instant',
  },
  {
    id: 'pb-8',
    name: 'After-Hours Handler',
    description: 'Manages inquiries outside business hours with appropriate expectations',
    status: 'published',
    version: 'v1.8',
    lastModified: '2026-03-09',
    modifiedBy: 'Sarah M.',
    category: 'Inbound',
    triggerIntents: ['after_hours_message', 'off_hours_call'],
    channels: ['sms', 'chat'],
    steps: 3,
    requiredFields: [],
    toneProfile: 'Warm & Expectation-Setting',
    escalationEnabled: false,
    routesTo: ['Callback Request'],
    conversionRate: 29,
    avgResponseTime: 'Instant',
  },
  {
    id: 'pb-9',
    name: 'Appointment Reminder',
    description: 'Sends confirmation and reminder sequences before scheduled visits',
    status: 'published',
    version: 'v2.3',
    lastModified: '2026-03-08',
    modifiedBy: 'Mike R.',
    category: 'Scheduling',
    triggerIntents: ['reminder_trigger', 'appointment_approaching'],
    channels: ['sms'],
    steps: 4,
    requiredFields: ['patient_name', 'appointment_date', 'location'],
    toneProfile: 'Friendly & Direct',
    escalationEnabled: false,
    routesTo: ['Booking Conversion'],
    conversionRate: undefined,
    avgResponseTime: 'Scheduled',
  },
  {
    id: 'pb-10',
    name: 'Patient Reactivation',
    description: 'Re-engages patients who missed follow-ups or dropped off care plan',
    status: 'draft',
    version: 'v0.4',
    lastModified: '2026-03-20',
    modifiedBy: 'Dr. Garcia',
    category: 'Recovery',
    triggerIntents: ['patient_inactive_30d', 'missed_follow_up'],
    channels: ['sms'],
    steps: 4,
    requiredFields: ['patient_name', 'last_visit_date'],
    toneProfile: 'Gentle & Non-Pushy',
    escalationEnabled: false,
    routesTo: ['Booking Conversion'],
    conversionRate: undefined,
    avgResponseTime: 'Scheduled',
  },
  {
    id: 'pb-11',
    name: 'Referral Processing',
    description: 'Handles incoming physician referrals and patient onboarding',
    status: 'draft',
    version: 'v0.2',
    lastModified: '2026-03-19',
    modifiedBy: 'Sarah M.',
    category: 'Inbound',
    triggerIntents: ['physician_referral', 'referral_received'],
    channels: ['sms', 'chat'],
    steps: 6,
    requiredFields: ['patient_name', 'referring_physician', 'referral_reason', 'insurance'],
    toneProfile: 'Professional & Thorough',
    escalationEnabled: true,
    routesTo: ['Booking Conversion', 'Insurance Collection'],
    conversionRate: undefined,
    avgResponseTime: '< 5 min',
  },
  {
    id: 'pb-12',
    name: 'Complaint Escalation',
    description: 'Identifies dissatisfied patients and routes to management',
    status: 'published',
    version: 'v1.5',
    lastModified: '2026-03-06',
    modifiedBy: 'Dr. Garcia',
    category: 'Escalation',
    triggerIntents: ['negative_sentiment', 'complaint', 'frustrated_patient'],
    channels: ['sms', 'chat', 'voice'],
    steps: 4,
    requiredFields: ['patient_name', 'issue_description'],
    toneProfile: 'Empathetic & Urgent',
    escalationEnabled: true,
    routesTo: ['Human Handoff'],
    conversionRate: undefined,
    avgResponseTime: '< 1 min',
  },
  {
    id: 'pb-13',
    name: 'Multi-Location Routing',
    description: 'Directs patients to nearest/preferred location based on availability',
    status: 'archived',
    version: 'v1.0',
    lastModified: '2026-02-28',
    modifiedBy: 'Mike R.',
    category: 'Scheduling',
    triggerIntents: ['location_inquiry', 'nearest_location', 'zip_code_provided'],
    channels: ['sms', 'chat'],
    steps: 3,
    requiredFields: ['zip_code'],
    toneProfile: 'Helpful & Efficient',
    escalationEnabled: false,
    routesTo: ['Booking Conversion'],
    conversionRate: 74,
    avgResponseTime: 'Instant',
  },
];

const channelLabels: Record<string, string> = {
  sms: 'SMS',
  chat: 'Chat',
  voice: 'Voice',
};

export default function PlaybooksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlaybookStatus | 'all'>('all');

  const filtered = mockPlaybooks.filter((pb) => {
    const matchesSearch =
      pb.name.toLowerCase().includes(search.toLowerCase()) ||
      pb.description.toLowerCase().includes(search.toLowerCase()) ||
      pb.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Playbooks</h1>
          <p className="text-healthcare-muted mt-1">
            Manage conversation flows and bot behavior scripts ({mockPlaybooks.length} playbooks)
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          New Playbook
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input
            type="text"
            placeholder="Search playbooks by name, description, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
          {(['all', 'published', 'review', 'draft', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-white text-healthcare-text shadow-sm'
                  : 'text-healthcare-muted hover:text-healthcare-text'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Playbook Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((pb) => (
          <div key={pb.id} className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{pb.name}</h3>
                  <p className="text-xs text-healthcare-muted">
                    {pb.category} &middot; {pb.version}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant={pb.status} label={pb.status} />
                <button className="btn-ghost" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="btn-ghost text-red-500 hover:text-red-700" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="card-body space-y-3">
              <p className="text-sm text-healthcare-muted">{pb.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-healthcare-muted">
                  <Settings className="w-3.5 h-3.5" />
                  <span>{pb.steps} steps</span>
                </div>
                <div className="flex items-center gap-2 text-healthcare-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{pb.avgResponseTime}</span>
                </div>
              </div>

              {/* Trigger Intents */}
              <div>
                <p className="text-xs font-medium text-healthcare-muted mb-1">Triggers</p>
                <div className="flex flex-wrap gap-1">
                  {pb.triggerIntents.map((intent) => (
                    <span key={intent} className="badge bg-amber-50 text-amber-700">
                      {intent.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div>
                <p className="text-xs font-medium text-healthcare-muted mb-1">Channels</p>
                <div className="flex flex-wrap gap-1">
                  {pb.channels.map((ch) => (
                    <span key={ch} className="badge bg-blue-50 text-blue-700">
                      {channelLabels[ch]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Fields */}
              {pb.requiredFields.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Required Fields</p>
                  <div className="flex flex-wrap gap-1">
                    {pb.requiredFields.map((field) => (
                      <span key={field} className="badge bg-gray-100 text-gray-600">
                        {field.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Routes To */}
              {pb.routesTo.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Routes To</p>
                  <div className="flex flex-wrap gap-1">
                    {pb.routesTo.map((route) => (
                      <span key={route} className="badge bg-teal-50 text-teal-700">
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 pt-2 border-t border-healthcare-border text-xs text-healthcare-muted">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Tone: {pb.toneProfile}
                </span>
                {pb.escalationEnabled && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Escalation
                  </span>
                )}
                {pb.conversionRate !== undefined && (
                  <span className="text-emerald-600 font-medium">
                    {pb.conversionRate}% conversion
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-healthcare-muted">
                <span>Modified {pb.lastModified} by {pb.modifiedBy}</span>
                <div className="flex items-center gap-1">
                  {pb.status === 'review' && (
                    <button className="btn-primary text-xs" title="Publish">
                      <Send className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  )}
                  {pb.status === 'published' && (
                    <button className="btn-ghost" title="Rollback">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button className="btn-ghost" title="Preview">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-healthcare-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No playbooks match your criteria</p>
        </div>
      )}
    </div>
  );
}
