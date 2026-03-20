import { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  PenLine,
  AlertTriangle,
  ExternalLink,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

type FeedbackItemType = 'thumbs_down' | 'too_salesy' | 'off_brand' | 'inaccurate' | 'suggested_rewrite' | 'too_long';
type FeedbackStatus = 'pending' | 'applied' | 'dismissed';

interface FeedbackItem {
  id: string;
  type: FeedbackItemType;
  status: FeedbackStatus;
  conversationId: string;
  messageSnippet: string;
  botResponse: string;
  comment?: string;
  suggestedRewrite?: string;
  submittedBy: string;
  submittedAt: string;
  playbook: string;
}

const typeLabels: Record<FeedbackItemType, { label: string; icon: React.ElementType }> = {
  thumbs_down: { label: 'Thumbs Down', icon: ThumbsDown },
  too_salesy: { label: 'Too Salesy', icon: AlertTriangle },
  off_brand: { label: 'Off Brand', icon: AlertTriangle },
  inaccurate: { label: 'Inaccurate', icon: AlertTriangle },
  suggested_rewrite: { label: 'Rewrite Suggested', icon: PenLine },
  too_long: { label: 'Too Long', icon: AlertTriangle },
};

const mockItems: FeedbackItem[] = [
  {
    id: 'fb-1',
    type: 'too_salesy',
    status: 'pending',
    conversationId: 'conv-2847',
    messageSnippet: 'Patient asked about vein treatment options',
    botResponse: 'You NEED to get this treated ASAP! Our incredible doctors can fix this TODAY. Do not wait another moment - your veins are only going to get worse! Book NOW!',
    comment: 'Way too aggressive. Patients with vein concerns are already anxious.',
    submittedBy: 'Sarah M.',
    submittedAt: '2026-03-20 09:45',
    playbook: 'Inbound New Patient',
  },
  {
    id: 'fb-2',
    type: 'suggested_rewrite',
    status: 'pending',
    conversationId: 'conv-2851',
    messageSnippet: 'Patient asked about insurance coverage for sclerotherapy',
    botResponse: 'Sclerotherapy is typically covered by most insurance plans when medically necessary.',
    suggestedRewrite: 'Coverage for sclerotherapy varies by plan. I can help you check your specific benefits - could you share your insurance provider and member ID? Our team will verify coverage before your appointment.',
    comment: 'Need to be more careful with insurance claims. Should always verify individually.',
    submittedBy: 'Dr. Garcia',
    submittedAt: '2026-03-20 08:30',
    playbook: 'Insurance Pre-Auth',
  },
  {
    id: 'fb-3',
    type: 'inaccurate',
    status: 'pending',
    conversationId: 'conv-2843',
    messageSnippet: 'Patient asked about recovery time for VenaSeal',
    botResponse: 'VenaSeal has zero recovery time. You can resume all activities including heavy exercise immediately after the procedure.',
    comment: 'Not accurate. Patients should avoid strenuous activity for 1-2 weeks. This could set wrong expectations.',
    submittedBy: 'Dr. Martinez',
    submittedAt: '2026-03-19 16:20',
    playbook: 'Post-Procedure Follow-Up',
  },
  {
    id: 'fb-4',
    type: 'off_brand',
    status: 'pending',
    conversationId: 'conv-2839',
    messageSnippet: 'Patient asked about pricing',
    botResponse: 'LOL prices vary! But trust me its worth it!! Hit me up to book a consult :)',
    comment: 'Completely off brand. Too casual, uses slang and emojis.',
    submittedBy: 'Sarah M.',
    submittedAt: '2026-03-19 14:15',
    playbook: 'Web Chat Greeting',
  },
  {
    id: 'fb-5',
    type: 'thumbs_down',
    status: 'applied',
    conversationId: 'conv-2830',
    messageSnippet: 'Patient asked about parking at Downtown location',
    botResponse: 'We have free parking available in the medical park garage.',
    comment: 'Parking garage actually charges after 2 hours. Need to mention validation.',
    submittedBy: 'Mike R.',
    submittedAt: '2026-03-18 11:00',
    playbook: 'Appointment Scheduling',
  },
  {
    id: 'fb-6',
    type: 'too_long',
    status: 'dismissed',
    conversationId: 'conv-2825',
    messageSnippet: 'Patient asked a simple yes/no question about Saturday hours',
    botResponse: 'Thank you for your interest in our clinic hours. We understand how important scheduling flexibility is to our patients...',
    comment: 'Simple question deserves a simple answer. The bot wrote a paragraph for a yes/no.',
    submittedBy: 'Sarah M.',
    submittedAt: '2026-03-17 09:30',
    playbook: 'After-Hours Handler',
  },
];

export default function ReviewQueuePage() {
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FeedbackItemType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = mockItems.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch =
      search === '' ||
      item.botResponse.toLowerCase().includes(search.toLowerCase()) ||
      item.comment?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = mockItems.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Review Queue</h1>
          <p className="text-healthcare-muted mt-1">
            {pendingCount} items awaiting review
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="select w-36"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="applied">Applied</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="select w-44"
        >
          <option value="all">All Types</option>
          <option value="thumbs_down">Thumbs Down</option>
          <option value="too_salesy">Too Salesy</option>
          <option value="off_brand">Off Brand</option>
          <option value="inaccurate">Inaccurate</option>
          <option value="suggested_rewrite">Rewrite Suggested</option>
          <option value="too_long">Too Long</option>
        </select>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const typeInfo = typeLabels[item.type];
          const TypeIcon = typeInfo.icon;

          return (
            <div key={item.id} className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-red-50 text-red-600">
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{typeInfo.label}</span>
                  <StatusBadge
                    variant={item.status === 'pending' ? 'pending' : item.status === 'applied' ? 'success' : 'archived'}
                    label={item.status}
                  />
                  <span className="text-xs text-healthcare-muted">in {item.playbook}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-healthcare-muted">
                  <span>{item.submittedBy}</span>
                  <span>{item.submittedAt}</span>
                  <button className="btn-ghost text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Conversation
                  </button>
                </div>
              </div>

              <div className="card-body space-y-3">
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Bot Response</p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
                    {item.botResponse}
                  </div>
                </div>

                {item.comment && (
                  <div>
                    <p className="text-xs font-medium text-healthcare-muted mb-1">Reviewer Comment</p>
                    <p className="text-sm text-healthcare-text">{item.comment}</p>
                  </div>
                )}

                {item.suggestedRewrite && (
                  <div>
                    <p className="text-xs font-medium text-healthcare-muted mb-1">Suggested Rewrite</p>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                      {item.suggestedRewrite}
                    </div>
                  </div>
                )}

                {item.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-healthcare-border">
                    <button className="btn-primary text-xs">
                      <Check className="w-3.5 h-3.5" />
                      Apply Feedback
                    </button>
                    <button className="btn-secondary text-xs">
                      <X className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-healthcare-muted">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No feedback items match your criteria</p>
        </div>
      )}
    </div>
  );
}
