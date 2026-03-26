import { useState } from 'react';
import {
  Send,
  MessageSquare,
  Phone,
  Globe,
  Brain,
  Database,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  BookOpen,
  ArrowRight,
  Target,
  Shield,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import CrmReadyBadge from '../components/shared/CrmReadyBadge';

type MessageRole = 'patient' | 'bot' | 'agent';
type Channel = 'sms' | 'webchat';
type ExtractionStatus = 'captured' | 'inferred' | 'missing' | 'conflicting' | 'needs_confirmation' | 'verified';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

interface CrmField {
  name: string;
  value: string | null;
  status: ExtractionStatus;
  confidence: number;
  sourceSnippet: string | null;
  timestamp: string | null;
}

interface OrchestrationState {
  intent: string;
  complexity: 'simple' | 'moderate' | 'complex';
  riskLevel: 'low' | 'medium' | 'high';
  stage: string;
  activePlaybooks: string[];
  confidence: number;
  fallbackTriggered: boolean;
  escalationTriggered: boolean;
  duplicateDetected: boolean;
  bookingStatus: 'not_started' | 'pending' | 'confirmed' | 'failed';
  turnCount: number;
  sentiment: string;
}

const roleStyles: Record<MessageRole, { label: string; color: string }> = {
  patient: { label: 'Patient', color: 'bg-gray-100 text-gray-700' },
  bot: { label: 'Bot', color: 'bg-brand-50 text-brand-700' },
  agent: { label: 'Agent', color: 'bg-purple-50 text-purple-700' },
};

const extractionBadge: Record<ExtractionStatus, { variant: 'success' | 'info' | 'error' | 'review' | 'warning' | 'pending'; label: string }> = {
  captured: { variant: 'success', label: 'Captured' },
  inferred: { variant: 'info', label: 'Inferred' },
  missing: { variant: 'error', label: 'Missing' },
  conflicting: { variant: 'review', label: 'Conflicting' },
  needs_confirmation: { variant: 'warning', label: 'Needs Confirmation' },
  verified: { variant: 'success', label: 'Verified' },
};

const mockMessages: Message[] = [
  { id: 'm1', role: 'bot', content: 'Hi! Thank you for contacting Austin Vein Specialists. I see we missed your call earlier. How can I help you today?', timestamp: '10:23:01 AM' },
  { id: 'm2', role: 'patient', content: 'Hi, I called earlier about my leg veins but no one answered', timestamp: '10:23:18 AM' },
  { id: 'm3', role: 'bot', content: 'I apologize for missing your call. I would be happy to help you with your vein concerns. Could you tell me a bit about what symptoms you are experiencing?', timestamp: '10:23:20 AM' },
  { id: 'm4', role: 'patient', content: 'My left leg has been aching and I can see bulging veins behind my knee. It gets worse when I stand for a long time at work', timestamp: '10:24:02 AM' },
  { id: 'm5', role: 'bot', content: 'Thank you for sharing that. Aching and visible bulging veins, especially with prolonged standing, are common symptoms our doctors evaluate regularly. To help us prepare for your visit, may I ask which insurance provider you have?', timestamp: '10:24:05 AM' },
  { id: 'm6', role: 'patient', content: 'I have BlueCross through my employer. Member ID is BC-4412897.', timestamp: '10:25:10 AM' },
  { id: 'm7', role: 'bot', content: 'Great, BlueCross is accepted at all our locations. We have availability this week at our Downtown Vein Center and Westlake Clinic. Would either location be convenient for you?', timestamp: '10:25:13 AM' },
  { id: 'm8', role: 'patient', content: 'Downtown works. Do you have anything Thursday afternoon?', timestamp: '10:26:01 AM' },
  { id: 'm9', role: 'bot', content: 'We have a 2:30 PM opening on Thursday with Dr. Martinez at our Downtown location. Would you like me to book that for you?', timestamp: '10:26:04 AM' },
  { id: 'm10', role: 'patient', content: 'Yes please, that works perfectly.', timestamp: '10:26:22 AM' },
  { id: 'm11', role: 'bot', content: 'Wonderful! Your consultation is confirmed for Thursday, March 26 at 2:30 PM with Dr. Martinez at Downtown Vein Center (450 Medical Park Dr, Suite 200). Please bring your insurance card and photo ID. We will send you a confirmation text shortly.', timestamp: '10:26:25 AM' },
  { id: 'm12', role: 'agent', content: '[System note: Appointment confirmed in EHR. Insurance pre-auth initiated for BlueCross.]', timestamp: '10:27:00 AM' },
];

const mockOrchestration: OrchestrationState = {
  intent: 'schedule_consultation',
  complexity: 'moderate',
  riskLevel: 'low',
  stage: 'booking_confirmation',
  activePlaybooks: ['Missed Call Recovery', 'Appointment Scheduling'],
  confidence: 0.92,
  fallbackTriggered: false,
  escalationTriggered: false,
  duplicateDetected: false,
  bookingStatus: 'confirmed',
  turnCount: 12,
  sentiment: 'positive',
};

const mockCrmFields: CrmField[] = [
  { name: 'First Name', value: null, status: 'missing', confidence: 0, sourceSnippet: null, timestamp: null },
  { name: 'Last Name', value: null, status: 'missing', confidence: 0, sourceSnippet: null, timestamp: null },
  { name: 'Phone', value: '+1 (512) 555-0847', status: 'verified', confidence: 0.99, sourceSnippet: 'Caller ID / SMS sender', timestamp: '10:23:01 AM' },
  { name: 'Date of Birth', value: null, status: 'missing', confidence: 0, sourceSnippet: null, timestamp: null },
  { name: 'Primary Symptoms', value: 'Aching, visible bulging veins', status: 'captured', confidence: 0.92, sourceSnippet: 'aching and I can see bulging veins', timestamp: '10:24:02 AM' },
  { name: 'Affected Area', value: 'Left leg, behind knee', status: 'captured', confidence: 0.88, sourceSnippet: 'left leg...behind my knee', timestamp: '10:24:02 AM' },
  { name: 'Symptom Triggers', value: 'Prolonged standing', status: 'inferred', confidence: 0.78, sourceSnippet: 'gets worse when I stand for a long time', timestamp: '10:24:02 AM' },
  { name: 'Insurance Provider', value: 'BlueCross', status: 'captured', confidence: 0.95, sourceSnippet: 'I have BlueCross through my employer', timestamp: '10:25:10 AM' },
  { name: 'Insurance Member ID', value: 'BC-4412897', status: 'captured', confidence: 0.97, sourceSnippet: 'Member ID is BC-4412897', timestamp: '10:25:10 AM' },
  { name: 'Insurance Group', value: 'Employer plan', status: 'inferred', confidence: 0.65, sourceSnippet: 'through my employer', timestamp: '10:25:10 AM' },
  { name: 'Preferred Location', value: 'Downtown Vein Center', status: 'captured', confidence: 0.95, sourceSnippet: 'Downtown works', timestamp: '10:26:01 AM' },
  { name: 'Appointment Date', value: 'Thu Mar 26, 2:30 PM', status: 'verified', confidence: 0.99, sourceSnippet: 'Thursday...2:30 PM', timestamp: '10:26:25 AM' },
  { name: 'Provider', value: 'Dr. Martinez', status: 'captured', confidence: 0.99, sourceSnippet: 'with Dr. Martinez', timestamp: '10:26:04 AM' },
  { name: 'Referral Source', value: 'Missed call recovery', status: 'inferred', confidence: 0.90, sourceSnippet: 'Called earlier...no one answered', timestamp: '10:23:18 AM' },
  { name: 'Email', value: null, status: 'missing', confidence: 0, sourceSnippet: null, timestamp: null },
];

const mockCrmPayload = {
  contact: {
    phone: '+15125550847',
    source: 'sms_missed_call_recovery',
    insurance_provider: 'BlueCross',
    insurance_type: 'employer',
    member_id: 'BC-4412897',
  },
  case: {
    symptoms: ['aching', 'visible_bulging_veins'],
    affected_area: 'left_leg_posterior_knee',
    symptom_triggers: ['prolonged_standing'],
    severity_indicator: 'moderate',
  },
  appointment: {
    preferred_location: 'loc-1',
    preferred_date: '2026-03-26',
    preferred_time: '14:30',
    provider: 'dr-martinez',
    status: 'confirmed',
  },
};

const complexityColors: Record<string, string> = {
  simple: 'bg-emerald-50 text-emerald-700',
  moderate: 'bg-amber-50 text-amber-700',
  complex: 'bg-red-50 text-red-700',
};

const riskColors: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

const bookingColors: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
};

type CrmReadyState = 'not_ready' | 'partially_ready' | 'ready_for_lead_sync' | 'ready_for_scheduling_sync';

function getCrmReadyState(fields: CrmField[]): { state: CrmReadyState; badgeState: 'not_ready' | 'partial' | 'ready'; label: string } {
  const captured = fields.filter((f) => ['captured', 'verified', 'inferred'].includes(f.status)).length;
  const ratio = captured / fields.length;
  const hasAppointment = fields.some((f) => f.name === 'Appointment Date' && f.value);
  const hasInsurance = fields.some((f) => f.name === 'Insurance Provider' && f.value);

  if (hasAppointment && hasInsurance && ratio >= 0.7) {
    return { state: 'ready_for_scheduling_sync', badgeState: 'ready', label: 'Ready for Scheduling Sync' };
  }
  if (hasInsurance && ratio >= 0.5) {
    return { state: 'ready_for_lead_sync', badgeState: 'partial', label: 'Ready for Lead Sync' };
  }
  if (ratio >= 0.3) {
    return { state: 'partially_ready', badgeState: 'partial', label: 'Partially Ready' };
  }
  return { state: 'not_ready', badgeState: 'not_ready', label: 'Not Ready' };
}

export default function TestQAPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [messages, setMessages] = useState(mockMessages);
  const [showPayload, setShowPayload] = useState(false);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    const newMsg: Message = {
      id: `m${messages.length + 1}`,
      role: 'patient',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  const capturedFields = mockCrmFields.filter((f) => ['captured', 'verified', 'inferred'].includes(f.status));
  const missingFields = mockCrmFields.filter((f) => f.status === 'missing');
  const crmReady = getCrmReadyState(mockCrmFields);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1>Test / QA Console</h1>
          <p className="text-healthcare-muted mt-1">
            Live conversation testing with orchestration tracing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setChannel('sms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                channel === 'sms' ? 'bg-white shadow-sm text-healthcare-text' : 'text-healthcare-muted'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              SMS
            </button>
            <button
              onClick={() => setChannel('webchat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                channel === 'webchat' ? 'bg-white shadow-sm text-healthcare-text' : 'text-healthcare-muted'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Web Chat
            </button>
          </div>
          <button
            onClick={() => setMessages(mockMessages)}
            className="btn-secondary text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button className="btn-primary text-xs">New Conversation</button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Panel A: Transcript */}
        <div className="xl:col-span-2 card flex flex-col overflow-hidden">
          <div className="card-header flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold">Transcript</h3>
            <span className="text-xs text-healthcare-muted ml-auto">
              {messages.length} messages
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const style = roleStyles[msg.role];
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'patient' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] text-healthcare-muted">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'patient'
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : msg.role === 'bot'
                        ? 'bg-gray-100 text-healthcare-text rounded-bl-sm'
                        : 'bg-purple-50 text-purple-900 rounded-bl-sm border border-purple-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-healthcare-line shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a test message..."
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="btn-primary" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Orchestration + CRM */}
        <div className="xl:col-span-3 flex flex-col gap-4 overflow-hidden">
          {/* Panel B: Orchestration Trace */}
          <div className="card overflow-hidden shrink-0">
            <div className="card-header flex items-center gap-2 shrink-0">
              <Brain className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold">Orchestration Trace</h3>
            </div>

            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Detected Intent</p>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand-600" />
                    <span className="text-sm font-semibold text-brand-700">
                      {mockOrchestration.intent.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Complexity</p>
                  <span className={`badge ${complexityColors[mockOrchestration.complexity]}`}>
                    {mockOrchestration.complexity}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Risk Level</p>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span className={`badge ${riskColors[mockOrchestration.riskLevel]}`}>
                      {mockOrchestration.riskLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Workflow Stage</p>
                  <StatusBadge variant="info" label={mockOrchestration.stage.replace(/_/g, ' ')} />
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Active Playbooks</p>
                  <div className="flex flex-wrap gap-1">
                    {mockOrchestration.activePlaybooks.map((pb) => (
                      <span key={pb} className="badge bg-purple-50 text-purple-700">
                        <BookOpen className="w-3 h-3" />
                        {pb}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="min-w-[200px]">
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-32">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${mockOrchestration.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{Math.round(mockOrchestration.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 pt-3 border-t border-healthcare-line">
                <div className="flex items-center gap-1.5">
                  {mockOrchestration.fallbackTriggered ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs">Fallback: {mockOrchestration.fallbackTriggered ? 'Triggered' : 'None'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {mockOrchestration.escalationTriggered ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs">Escalation: {mockOrchestration.escalationTriggered ? 'Active' : 'None'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {mockOrchestration.duplicateDetected ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs">Duplicate: {mockOrchestration.duplicateDetected ? 'Detected' : 'None'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">Booking:</span>
                  <span className={`badge text-[10px] ${bookingColors[mockOrchestration.bookingStatus]}`}>
                    {mockOrchestration.bookingStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel C: CRM Mapping */}
          <div className="card flex flex-col flex-1 overflow-hidden">
            <div className="card-header flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold">CRM Field Extraction</h3>
              </div>
              <CrmReadyBadge
                state={crmReady.badgeState as any}
                fieldsComplete={capturedFields.length}
                fieldsTotal={mockCrmFields.length}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* CRM Fields Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-healthcare-line sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-healthcare-muted text-xs">Field</th>
                      <th className="text-left px-4 py-2 font-medium text-healthcare-muted text-xs">Value</th>
                      <th className="text-left px-4 py-2 font-medium text-healthcare-muted text-xs">Status</th>
                      <th className="text-left px-4 py-2 font-medium text-healthcare-muted text-xs">Conf.</th>
                      <th className="text-left px-4 py-2 font-medium text-healthcare-muted text-xs">Source</th>
                      <th className="text-left px-4 py-2 font-medium text-healthcare-muted text-xs">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-healthcare-line">
                    {mockCrmFields.map((field) => {
                      const badge = extractionBadge[field.status];
                      const confColor = field.confidence >= 0.8 ? 'text-emerald-600' : field.confidence >= 0.5 ? 'text-amber-600' : 'text-red-500';
                      return (
                        <tr key={field.name} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-xs">{field.name}</td>
                          <td className="px-4 py-2">
                            {field.value ? (
                              <span className="font-mono text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded text-xs">
                                {field.value}
                              </span>
                            ) : (
                              <span className="text-healthcare-muted italic text-xs">--</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge variant={badge.variant} label={badge.label} />
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-xs font-medium ${confColor}`}>
                              {field.confidence > 0 ? `${Math.round(field.confidence * 100)}%` : '--'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {field.sourceSnippet ? (
                              <span className="text-[11px] text-healthcare-muted truncate max-w-[140px] block italic">
                                &ldquo;{field.sourceSnippet}&rdquo;
                              </span>
                            ) : (
                              <span className="text-xs text-healthcare-muted">--</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-healthcare-muted whitespace-nowrap">
                            {field.timestamp ?? '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 space-y-3 border-t border-healthcare-line">
                {/* Missing Fields */}
                {missingFields.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-800 mb-1">
                      Missing Fields ({missingFields.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingFields.map((f) => (
                        <span key={f.name} className="badge bg-amber-100 text-amber-800">
                          <HelpCircle className="w-3 h-3" />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended next question */}
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-brand-800 mb-1">Recommended Next Question</p>
                  <p className="text-sm text-brand-700">
                    <ArrowRight className="w-3.5 h-3.5 inline mr-1" />
                    &ldquo;May I have your full name and date of birth so we can complete your registration?&rdquo;
                  </p>
                </div>

                {/* CRM Ready State */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-xs font-medium text-healthcare-muted">CRM Sync Readiness</p>
                    <p className="text-sm font-medium mt-0.5">{crmReady.label}</p>
                  </div>
                  <div className="text-xs text-healthcare-muted">
                    {capturedFields.length}/{mockCrmFields.length} fields populated
                  </div>
                </div>

                {/* CRM Payload Preview */}
                <div>
                  <button
                    onClick={() => setShowPayload(!showPayload)}
                    className="flex items-center gap-2 text-xs font-medium text-healthcare-muted hover:text-healthcare-text transition-colors w-full"
                  >
                    {showPayload ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    CRM Payload Preview
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(JSON.stringify(mockCrmPayload, null, 2));
                      }}
                      className="btn-ghost ml-auto"
                      title="Copy JSON"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </button>
                  {showPayload && (
                    <pre className="mt-2 bg-gray-900 text-emerald-400 rounded-lg p-3 text-xs overflow-x-auto font-mono max-h-[300px] overflow-y-auto">
                      {JSON.stringify(mockCrmPayload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
