import { useState } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  RotateCcw,
  Send,
  Eye,
  ChevronRight,
  Filter,
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
}

const mockPlaybooks: Playbook[] = [
  { id: 'pb-1', name: 'Inbound New Patient', description: 'Handles first-time patient inquiries, gathers symptoms and insurance info', status: 'published', version: 'v3.2', lastModified: '2026-03-18', modifiedBy: 'Sarah M.', category: 'Inbound' },
  { id: 'pb-2', name: 'Missed Call Recovery', description: 'Automated SMS follow-up for unreturned calls within business hours', status: 'published', version: 'v2.8', lastModified: '2026-03-17', modifiedBy: 'Dr. Garcia', category: 'Recovery' },
  { id: 'pb-3', name: 'Insurance Pre-Authorization', description: 'Guides patients through insurance verification and pre-auth requirements', status: 'review', version: 'v1.4', lastModified: '2026-03-20', modifiedBy: 'Sarah M.', category: 'Insurance' },
  { id: 'pb-4', name: 'Appointment Scheduling', description: 'Books consultations with provider availability and location matching', status: 'published', version: 'v4.1', lastModified: '2026-03-15', modifiedBy: 'Mike R.', category: 'Scheduling' },
  { id: 'pb-5', name: 'Post-Procedure Follow-Up', description: 'Automated check-ins after treatment, monitors recovery symptoms', status: 'published', version: 'v2.0', lastModified: '2026-03-14', modifiedBy: 'Dr. Garcia', category: 'Follow-Up' },
  { id: 'pb-6', name: 'Vein Screening Qualification', description: 'Pre-screens patients for vein treatment eligibility based on symptoms', status: 'published', version: 'v3.0', lastModified: '2026-03-12', modifiedBy: 'Sarah M.', category: 'Screening' },
  { id: 'pb-7', name: 'Web Chat Greeting', description: 'Initial engagement for website visitors with contextual responses', status: 'published', version: 'v2.5', lastModified: '2026-03-10', modifiedBy: 'Mike R.', category: 'Inbound' },
  { id: 'pb-8', name: 'After-Hours Handler', description: 'Manages inquiries outside business hours with appropriate expectations', status: 'published', version: 'v1.8', lastModified: '2026-03-09', modifiedBy: 'Sarah M.', category: 'Inbound' },
  { id: 'pb-9', name: 'Appointment Reminder', description: 'Sends confirmation and reminder sequences before scheduled visits', status: 'published', version: 'v2.3', lastModified: '2026-03-08', modifiedBy: 'Mike R.', category: 'Scheduling' },
  { id: 'pb-10', name: 'Patient Reactivation', description: 'Re-engages patients who missed follow-ups or dropped off care plan', status: 'draft', version: 'v0.4', lastModified: '2026-03-20', modifiedBy: 'Dr. Garcia', category: 'Recovery' },
  { id: 'pb-11', name: 'Referral Processing', description: 'Handles incoming physician referrals and patient onboarding', status: 'draft', version: 'v0.2', lastModified: '2026-03-19', modifiedBy: 'Sarah M.', category: 'Inbound' },
  { id: 'pb-12', name: 'Complaint Escalation', description: 'Identifies dissatisfied patients and routes to management', status: 'published', version: 'v1.5', lastModified: '2026-03-06', modifiedBy: 'Dr. Garcia', category: 'Escalation' },
  { id: 'pb-13', name: 'Multi-Location Routing', description: 'Directs patients to nearest/preferred location based on availability', status: 'archived', version: 'v1.0', lastModified: '2026-02-28', modifiedBy: 'Mike R.', category: 'Scheduling' },
];

export default function PlaybooksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlaybookStatus | 'all'>('all');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const filtered = mockPlaybooks.filter((pb) => {
    const matchesSearch =
      pb.name.toLowerCase().includes(search.toLowerCase()) ||
      pb.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Playbooks</h1>
          <p className="text-healthcare-muted mt-1">
            Manage conversation flows and bot behavior scripts
          </p>
        </div>
        <button className="btn-primary">
          <BookOpen className="w-4 h-4" />
          New Playbook
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input
            type="text"
            placeholder="Search playbooks..."
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

      {/* Playbook List */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((pb) => (
          <div
            key={pb.id}
            onClick={() => setSelectedPlaybook(pb)}
            className="card px-6 py-4 flex items-center gap-4 cursor-pointer hover:border-brand-300 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
              <BookOpen className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">{pb.name}</h3>
                <StatusBadge variant={pb.status} label={pb.status} />
                <span className="text-xs text-healthcare-muted font-mono">{pb.version}</span>
              </div>
              <p className="text-sm text-healthcare-muted mt-0.5 truncate">
                {pb.description}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-healthcare-muted">{pb.lastModified}</p>
              <p className="text-xs text-healthcare-muted">by {pb.modifiedBy}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="btn-ghost" title="Preview">
                <Eye className="w-4 h-4" />
              </button>
              <button className="btn-ghost" title="Version History">
                <Clock className="w-4 h-4" />
              </button>
              {pb.status === 'review' && (
                <button className="btn-primary text-xs" title="Publish">
                  <Send className="w-3.5 h-3.5" />
                  Publish
                </button>
              )}
              {pb.status === 'published' && (
                <button className="btn-ghost" title="Rollback">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-healthcare-muted" />
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
