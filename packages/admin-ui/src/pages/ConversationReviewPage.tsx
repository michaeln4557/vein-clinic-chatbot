import { useState } from 'react';
import { Search, Filter, MessageCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import InsightPanel from '../components/conversations/InsightPanel';

/* ══════════════════════════════════════════════
   CONVERSATION REVIEW
   "Show me examples"
   Let managers see real conversation transcripts
   filtered by outcome, stage, and drop-off reason.
   ══════════════════════════════════════════════ */

type Outcome = 'all' | 'converted' | 'not_converted';
type DropoffStage = 'all' | 'early' | 'symptoms' | 'insurance' | 'scheduling';
type DropoffReason = 'all' | 'stopped_responding' | 'escalation' | 'declined' | 'friction';

interface ConversationMessage {
  sender: 'bot' | 'patient';
  text: string;
  time: string;
}

interface ConversationRecord {
  id: string;
  outcome: 'converted' | 'not_converted';
  stageReached: string;
  dropoffReason: string | null;
  source: string;
  duration: string;
  messages: ConversationMessage[];
  tags: string[];
}

/* ── Mock conversation data ─────────────────── */
const conversations: ConversationRecord[] = [
  {
    id: 'CONV-3001',
    outcome: 'converted',
    stageReached: 'Scheduling',
    dropoffReason: null,
    source: 'Web Chat',
    duration: '4m 22s',
    tags: ['bot-only', 'new-patient'],
    messages: [
      { sender: 'bot', text: 'Hi there! I\'m Maya, the virtual assistant for Vein Clinic. How can I help you today?', time: '2:14 PM' },
      { sender: 'patient', text: 'I have bulging veins on my legs and they hurt sometimes', time: '2:14 PM' },
      { sender: 'bot', text: 'I\'m sorry to hear that — leg vein discomfort is really common, and you\'re in the right place. Can you tell me a bit more about where exactly the veins are?', time: '2:15 PM' },
      { sender: 'patient', text: 'Mostly on my left calf, they\'re pretty visible', time: '2:15 PM' },
      { sender: 'bot', text: 'Got it. That sounds like it could benefit from a quick evaluation. We offer free vein screenings — would you like to schedule one?', time: '2:16 PM' },
      { sender: 'patient', text: 'Yes please', time: '2:16 PM' },
      { sender: 'bot', text: 'Great! I have availability at our West Islip location on Monday, December 23rd at 10:00 AM. Does that work for you?', time: '2:17 PM' },
      { sender: 'patient', text: 'That works', time: '2:17 PM' },
      { sender: 'bot', text: 'You\'re all set! We look forward to seeing you at our **West Islip** location on **Monday, December 23rd at 10:00 AM**.', time: '2:18 PM' },
    ],
  },
  {
    id: 'CONV-3002',
    outcome: 'not_converted',
    stageReached: 'Insurance',
    dropoffReason: 'friction',
    source: 'SMS Recovery',
    duration: '2m 45s',
    tags: ['missed-call-recovery', 'friction'],
    messages: [
      { sender: 'bot', text: 'Hi! We noticed you tried to reach Vein Clinic. I\'m Maya — can I help you schedule a consultation?', time: '10:30 AM' },
      { sender: 'patient', text: 'Yeah I was calling about my leg veins', time: '10:32 AM' },
      { sender: 'bot', text: 'I can help with that. We specialize in vein treatment. To check your coverage, could you share your insurance provider?', time: '10:32 AM' },
      { sender: 'patient', text: 'Do you take Blue Cross? How much does it cost without insurance?', time: '10:33 AM' },
      { sender: 'bot', text: 'We work with most major insurance providers including Blue Cross. Our team can verify your specific coverage when you come in. Would you like to schedule?', time: '10:34 AM' },
      { sender: 'patient', text: 'I\'m not sure, let me think about it', time: '10:35 AM' },
    ],
  },
  {
    id: 'CONV-3003',
    outcome: 'not_converted',
    stageReached: 'Early',
    dropoffReason: 'stopped_responding',
    source: 'Web Chat',
    duration: '0m 45s',
    tags: ['no-response'],
    messages: [
      { sender: 'bot', text: 'Hi there! I\'m Maya, the virtual assistant for Vein Clinic. How can I help you today?', time: '3:22 PM' },
      { sender: 'patient', text: 'hi', time: '3:22 PM' },
      { sender: 'bot', text: 'Welcome! Are you looking to schedule a consultation for vein treatment, or do you have a question about our services?', time: '3:23 PM' },
    ],
  },
  {
    id: 'CONV-3004',
    outcome: 'not_converted',
    stageReached: 'Insurance',
    dropoffReason: 'escalation',
    source: 'Web Chat',
    duration: '3m 10s',
    tags: ['escalation', 'callback-requested'],
    messages: [
      { sender: 'bot', text: 'Hi! I\'m Maya. How can I help you today?', time: '11:05 AM' },
      { sender: 'patient', text: 'I need to see someone about varicose veins', time: '11:05 AM' },
      { sender: 'bot', text: 'We can definitely help with that. Let me gather a few details to get you scheduled.', time: '11:06 AM' },
      { sender: 'patient', text: 'Can I just talk to a real person? I have complicated insurance', time: '11:07 AM' },
      { sender: 'bot', text: 'Of course! I can arrange for someone from our team to call you. Would you prefer a callback now or at a scheduled time?', time: '11:07 AM' },
      { sender: 'patient', text: 'Now please', time: '11:08 AM' },
    ],
  },
  {
    id: 'CONV-3005',
    outcome: 'converted',
    stageReached: 'Scheduling',
    dropoffReason: null,
    source: 'SMS Recovery',
    duration: '3m 55s',
    tags: ['missed-call-recovery', 'human-handoff'],
    messages: [
      { sender: 'bot', text: 'Hi! We saw you tried reaching Vein Clinic earlier. I\'m Maya — want help scheduling a visit?', time: '1:00 PM' },
      { sender: 'patient', text: 'Yes I want to come in for spider veins', time: '1:02 PM' },
      { sender: 'bot', text: 'We can help with spider veins! Our team at the Bay Shore location has openings this week. Would Thursday work?', time: '1:02 PM' },
      { sender: 'patient', text: 'Can someone call me to go over details?', time: '1:03 PM' },
      { sender: 'bot', text: 'Absolutely. A team member will call you shortly.', time: '1:04 PM' },
    ],
  },
  {
    id: 'CONV-3006',
    outcome: 'not_converted',
    stageReached: 'Insurance',
    dropoffReason: 'declined',
    source: 'Web Chat',
    duration: '2m 30s',
    tags: ['declined'],
    messages: [
      { sender: 'bot', text: 'Hi! I\'m Maya. How can I help you today?', time: '4:10 PM' },
      { sender: 'patient', text: 'Looking into vein treatment options', time: '4:10 PM' },
      { sender: 'bot', text: 'Great! We offer several treatment options. To help match you with the right approach, may I ask about your insurance?', time: '4:11 PM' },
      { sender: 'patient', text: 'I don\'t have insurance and I can\'t afford out of pocket right now', time: '4:12 PM' },
      { sender: 'bot', text: 'I understand. We do have financing options available. Would you like to learn more?', time: '4:12 PM' },
      { sender: 'patient', text: 'No thanks, maybe later', time: '4:13 PM' },
    ],
  },
];

/* ── Filter helpers ─────────────────────────── */
function matchesStage(conv: ConversationRecord, stage: DropoffStage): boolean {
  if (stage === 'all') return true;
  const stageMap: Record<string, DropoffStage> = {
    'Early': 'early', 'Symptoms': 'symptoms', 'Insurance': 'insurance', 'Scheduling': 'scheduling',
  };
  return stageMap[conv.stageReached] === stage;
}

function matchesReason(conv: ConversationRecord, reason: DropoffReason): boolean {
  if (reason === 'all') return true;
  return conv.dropoffReason === reason;
}

export default function ConversationReviewPage() {
  const [outcomeFilter, setOutcomeFilter] = useState<Outcome>('all');
  const [stageFilter, setStageFilter] = useState<DropoffStage>('all');
  const [reasonFilter, setReasonFilter] = useState<DropoffReason>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = conversations.filter((c) => {
    if (outcomeFilter === 'converted' && c.outcome !== 'converted') return false;
    if (outcomeFilter === 'not_converted' && c.outcome !== 'not_converted') return false;
    if (!matchesStage(c, stageFilter)) return false;
    if (!matchesReason(c, reasonFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.messages.some((m) => m.text.toLowerCase().includes(q)) || c.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Conversation Review</h1>
        <p className="text-sm text-healthcare-muted mt-1">
          Review real patient conversations — see what worked and where patients dropped off
        </p>
      </div>

      {/* Filters */}
      <div className="card card-body">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-healthcare-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-healthcare-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Outcome */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-healthcare-muted" />
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as Outcome)}
              className="text-xs border border-healthcare-line rounded-lg px-2 py-2 focus:outline-none"
            >
              <option value="all">All Outcomes</option>
              <option value="converted">Converted</option>
              <option value="not_converted">Not Converted</option>
            </select>
          </div>

          {/* Stage */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DropoffStage)}
            className="text-xs border border-healthcare-line rounded-lg px-2 py-2 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="early">Early</option>
            <option value="symptoms">Symptoms</option>
            <option value="insurance">Insurance</option>
            <option value="scheduling">Scheduling</option>
          </select>

          {/* Reason */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value as DropoffReason)}
            className="text-xs border border-healthcare-line rounded-lg px-2 py-2 focus:outline-none"
            disabled={outcomeFilter === 'converted'}
          >
            <option value="all">All Reasons</option>
            <option value="stopped_responding">Stopped Responding</option>
            <option value="escalation">Escalation</option>
            <option value="declined">Declined</option>
            <option value="friction">Friction</option>
          </select>

          <span className="text-[10px] text-healthcare-muted ml-auto">{filtered.length} conversations</span>
        </div>
      </div>

      {/* Insight Panel — pattern-based issue + examples + fixes */}
      <InsightPanel
        stageFilter={stageFilter}
        reasonFilter={reasonFilter}
        outcomeFilter={outcomeFilter}
        filteredCount={filtered.length}
      />

      {/* Conversation List */}
      <div className="space-y-3">
        {filtered.map((conv) => {
          const isExpanded = expandedId === conv.id;
          return (
            <div key={conv.id} className="card overflow-hidden">
              {/* Summary Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : conv.id)}
                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="shrink-0">
                  {conv.outcome === 'converted'
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <XCircle className="w-5 h-5 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold">{conv.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{conv.source}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      conv.outcome === 'converted' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {conv.outcome === 'converted' ? 'Converted' : 'Not Converted'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-healthcare-muted">
                    <span>Stage: <strong>{conv.stageReached}</strong></span>
                    {conv.dropoffReason && (
                      <span>Reason: <strong className="text-red-600">{conv.dropoffReason.replace(/_/g, ' ')}</strong></span>
                    )}
                    <span>{conv.duration}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-healthcare-muted" />
                  <span className="text-xs text-healthcare-muted">{conv.messages.length}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-healthcare-muted ml-1" /> : <ChevronDown className="w-4 h-4 text-healthcare-muted ml-1" />}
                </div>
              </button>

              {/* Transcript */}
              {isExpanded && (
                <div className="border-t border-healthcare-line px-4 py-4 bg-gray-50/50">
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {conv.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'patient'
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p>{msg.text}</p>
                          <p className={`text-[9px] mt-1 ${msg.sender === 'patient' ? 'text-white/60' : 'text-gray-400'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-200">
                    {conv.tags.map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-healthcare-muted">
            No conversations match your filters
          </div>
        )}
      </div>
    </div>
  );
}
