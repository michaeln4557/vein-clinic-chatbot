/**
 * Orchestration Engine
 *
 * Central orchestration layer that processes incoming messages through:
 * 1. Intent classification
 * 2. Complexity/risk assessment
 * 3. Workflow stage determination
 * 4. Playbook selection
 * 5. Policy guard evaluation
 * 6. Response composition
 * 7. Field extraction
 * 8. Action execution (scheduling, handoff, etc.)
 *
 * Each step is modular and independently testable.
 */

import { EventEmitter } from 'events';

// ─── Types ───────────────────────────────────────────────────────────

export type Intent =
  | 'booking_request'
  | 'insurance_question'
  | 'location_inquiry'
  | 'callback_request'
  | 'reschedule'
  | 'cancel'
  | 'faq'
  | 'greeting'
  | 'frustration'
  | 'human_request'
  | 'insurance_card_upload'
  | 'confirmation_question'
  | 'general_question'
  | 'unknown';

export type Complexity = 'simple' | 'moderate' | 'complex';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type WorkflowStage =
  | 'initial_contact'
  | 'lead_qualification'
  | 'location_selection'
  | 'insurance_collection'
  | 'scheduling'
  | 'confirmation_pending'
  | 'confirmed'
  | 'callback_queued'
  | 'escalated'
  | 'completed'
  | 'lost';

export interface OrchestrationContext {
  conversationId: string;
  channel: 'sms' | 'web_chat';
  messageHistory: MessageEntry[];
  extractedFields: Record<string, ExtractedFieldEntry>;
  currentStage: WorkflowStage;
  leadId?: string;
  locationId?: string;
  sliderSettings: SliderValues;
}

export interface MessageEntry {
  id: string;
  role: 'patient' | 'bot' | 'agent';
  content: string;
  timestamp: Date;
}

export interface ExtractedFieldEntry {
  raw_value: string;
  normalized_value?: string;
  confidence: number;
  source_message_id: string;
}

export interface SliderValues {
  conversation_style: number;
  workflow_strictness: number;
  booking_timing: number;
  reassurance_level: number;
  response_length: number;
  followup_cadence: number;
  human_handoff_sensitivity: number;
  faq_flexibility: number;
}

export interface OrchestrationResult {
  response: string;
  trace: OrchestrationTrace;
  actions: OrchestrationAction[];
  extractedFields: Record<string, ExtractedFieldEntry>;
  nextStage: WorkflowStage;
}

export interface OrchestrationTrace {
  detected_intent: Intent;
  complexity: Complexity;
  risk_level: RiskLevel;
  workflow_stage: WorkflowStage;
  active_playbooks: string[];
  confidence_score: number;
  fallback_used: boolean;
  escalation_triggered: boolean;
  duplicate_detected: boolean;
  booking_offered: boolean;
  policy_violations: string[];
  slider_values: SliderValues;
  processing_time_ms: number;
}

export type OrchestrationAction =
  | { type: 'create_lead'; data: Record<string, unknown> }
  | { type: 'update_lead'; leadId: string; data: Record<string, unknown> }
  | { type: 'create_provisional_booking'; data: Record<string, unknown> }
  | { type: 'request_callback'; preferredTime?: string }
  | { type: 'escalate_to_human'; reason: string }
  | { type: 'send_follow_up'; delay_minutes: number }
  | { type: 'check_duplicate'; phone: string }
  | { type: 'trigger_insurance_verification'; leadId: string }
  | { type: 'sync_to_crm'; leadId: string };

// ─── Intent Classifier ──────────────────────────────────────────────

export class IntentClassifier {
  private readonly intentPatterns: Record<Intent, RegExp[]> = {
    booking_request: [
      /\b(book|schedule|appointment|set up|make an appointment|come in|visit|see a doctor|get seen)\b/i,
    ],
    insurance_question: [
      /\b(insurance|coverage|covered|accept|in.?network|out.?of.?network|copay|deductible|PPO|HMO|plan)\b/i,
    ],
    location_inquiry: [
      /\b(location|office|near|closest|where|address|directions|branch)\b/i,
    ],
    callback_request: [
      /\b(call me|call back|callback|phone call|prefer.?call|speak.?to.?someone|talk.?to)\b/i,
    ],
    reschedule: [
      /\b(reschedule|change.?appointment|different.?time|move.?appointment)\b/i,
    ],
    cancel: [
      /\b(cancel|don't want|nevermind|never mind|not interested)\b/i,
    ],
    faq: [
      /\b(what is|how does|tell me about|varicose|spider vein|procedure|treatment|recovery|pain)\b/i,
    ],
    greeting: [
      /^(hi|hello|hey|good morning|good afternoon|good evening|yes|yeah|sure)\b/i,
    ],
    frustration: [
      /\b(frustrated|angry|upset|ridiculous|terrible|horrible|worst|waste|stupid)\b/i,
    ],
    human_request: [
      /\b(human|real person|agent|representative|someone real|live person|operator)\b/i,
    ],
    insurance_card_upload: [
      /\b(upload|send|photo|picture|image|card|front|back)\b/i,
    ],
    confirmation_question: [
      /\b(confirm|confirmed|status|when is my|my appointment)\b/i,
    ],
    general_question: [
      /\b(how|what|why|when|where|can you|do you|is there)\b/i,
    ],
    unknown: [],
  };

  classify(message: string, context: OrchestrationContext): {
    intent: Intent;
    confidence: number;
    secondary_intents: Intent[];
  } {
    const scores: { intent: Intent; score: number }[] = [];

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          score += 1;
        }
      }
      // Boost score based on workflow stage context
      score += this.getContextBoost(intent as Intent, context);
      if (score > 0) {
        scores.push({ intent: intent as Intent, score });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
      return { intent: 'unknown', confidence: 0.3, secondary_intents: [] };
    }

    const maxScore = scores[0].score;
    const confidence = Math.min(0.95, 0.5 + maxScore * 0.15);

    return {
      intent: scores[0].intent,
      confidence,
      secondary_intents: scores.slice(1, 3).map((s) => s.intent),
    };
  }

  private getContextBoost(intent: Intent, context: OrchestrationContext): number {
    const stage = context.currentStage;
    // Boost intents that are contextually expected
    if (stage === 'initial_contact' && intent === 'greeting') return 0.5;
    if (stage === 'scheduling' && intent === 'booking_request') return 0.5;
    if (stage === 'insurance_collection' && intent === 'insurance_question') return 0.5;
    if (stage === 'location_selection' && intent === 'location_inquiry') return 0.5;
    return 0;
  }
}

// ─── Complexity Assessor ────────────────────────────────────────────

export class ComplexityAssessor {
  assess(
    intent: Intent,
    message: string,
    context: OrchestrationContext
  ): { complexity: Complexity; risk_level: RiskLevel } {
    let complexityScore = 0;
    let riskScore = 0;

    // Intent-based complexity
    const complexIntents: Intent[] = ['insurance_question', 'reschedule', 'frustration'];
    const highRiskIntents: Intent[] = ['insurance_question', 'frustration', 'human_request'];

    if (complexIntents.includes(intent)) complexityScore += 2;
    if (highRiskIntents.includes(intent)) riskScore += 2;

    // Message length/complexity
    if (message.length > 200) complexityScore += 1;
    if (message.split('?').length > 2) complexityScore += 1; // Multiple questions

    // Context-based
    if (context.messageHistory.length > 10) complexityScore += 1; // Long conversation
    if (context.currentStage === 'escalated') riskScore += 2;

    const complexity: Complexity =
      complexityScore >= 3 ? 'complex' : complexityScore >= 1 ? 'moderate' : 'simple';

    const risk_level: RiskLevel =
      riskScore >= 4
        ? 'critical'
        : riskScore >= 3
          ? 'high'
          : riskScore >= 1
            ? 'medium'
            : 'low';

    return { complexity, risk_level };
  }
}

// ─── Workflow Controller ────────────────────────────────────────────

export class WorkflowController {
  determineStage(context: OrchestrationContext, intent: Intent): WorkflowStage {
    const fields = context.extractedFields;
    const hasName = !!fields['full_name'];
    const hasPhone = !!fields['phone_number'];
    const hasLocation = !!fields['requested_location'];
    const hasInsurance = !!fields['insurance_provider'];
    const hasDate = !!fields['requested_date_normalized'];

    if (intent === 'callback_request') return 'callback_queued';
    if (intent === 'human_request' || intent === 'frustration') return 'escalated';

    // Progressive stage determination
    if (!hasName && !hasPhone) return 'initial_contact';
    if (hasName || hasPhone) {
      if (!hasLocation) return 'lead_qualification';
      if (!hasInsurance) return 'insurance_collection';
      if (!hasDate) return 'scheduling';
      return 'confirmation_pending';
    }

    return context.currentStage;
  }

  shouldOfferBooking(
    context: OrchestrationContext,
    intent: Intent,
    sliders: SliderValues
  ): boolean {
    const bookingTimingThreshold = sliders.booking_timing;
    const stage = context.currentStage;

    // Always offer if explicitly requested
    if (intent === 'booking_request') return true;

    // Stage-based with slider influence
    const stageReadiness: Record<WorkflowStage, number> = {
      initial_contact: 30,
      lead_qualification: 50,
      location_selection: 60,
      insurance_collection: 70,
      scheduling: 90,
      confirmation_pending: 95,
      confirmed: 0,
      callback_queued: 0,
      escalated: 0,
      completed: 0,
      lost: 0,
    };

    return (stageReadiness[stage] || 0) >= bookingTimingThreshold;
  }
}

// ─── Playbook Router ────────────────────────────────────────────────

export interface PlaybookConfig {
  name: string;
  trigger_conditions: Record<string, unknown>;
  response_goals: string[];
  steps: PlaybookStep[];
  allowed_language: string[];
  prohibited_language: string[];
  tone_settings: Record<string, number>;
  escalation_rules: Record<string, unknown>;
}

export interface PlaybookStep {
  id: string;
  action: string;
  template?: string;
  conditions?: Record<string, unknown>;
}

export class PlaybookRouter {
  private playbooks: Map<string, PlaybookConfig> = new Map();

  loadPlaybooks(configs: PlaybookConfig[]): void {
    for (const config of configs) {
      this.playbooks.set(config.name, config);
    }
  }

  selectPlaybooks(intent: Intent, context: OrchestrationContext): string[] {
    const active: string[] = [];

    const intentToPlaybook: Record<string, string[]> = {
      booking_request: ['BOOKING_CONVERSION'],
      insurance_question: ['INSURANCE_REASSURANCE'],
      location_inquiry: ['LOCATION_ROUTING'],
      callback_request: ['CALLBACK_REQUEST'],
      frustration: ['PATIENT_HESITATION', 'HUMAN_HANDOFF'],
      human_request: ['HUMAN_HANDOFF'],
      faq: ['FAQ'],
      greeting: ['MISSED_CALL_RECOVERY'],
      unknown: ['LOW_CONFIDENCE'],
      insurance_card_upload: ['INSURANCE_COLLECTION'],
      confirmation_question: ['CONFIRMATION_PENDING_VERIFICATION'],
    };

    const mapped = intentToPlaybook[intent] || ['LOW_CONFIDENCE'];
    active.push(...mapped);

    // Add contextual playbooks
    if (context.currentStage === 'initial_contact' && !active.includes('MISSED_CALL_RECOVERY')) {
      active.push('MISSED_CALL_RECOVERY');
    }

    return active.filter((name) => this.playbooks.has(name));
  }

  getPlaybook(name: string): PlaybookConfig | undefined {
    return this.playbooks.get(name);
  }
}

// ─── Policy Guard ───────────────────────────────────────────────────

export interface PolicyViolation {
  policy_id: string;
  category: string;
  rule: string;
  severity: 'block' | 'warn' | 'log';
  matched_text: string;
}

export class PolicyGuard {
  private prohibitedPhrases: { phrase: string; category: string; severity: 'block' | 'warn' | 'log' }[] = [
    // Insurance prohibited phrases
    { phrase: 'free', category: 'insurance', severity: 'block' },
    { phrase: 'complimentary', category: 'insurance', severity: 'block' },
    { phrase: 'guaranteed', category: 'insurance', severity: 'block' },
    { phrase: 'covered', category: 'insurance', severity: 'block' },
    { phrase: 'no cost', category: 'insurance', severity: 'block' },
    { phrase: 'no charge', category: 'insurance', severity: 'block' },
    { phrase: 'fully covered', category: 'insurance', severity: 'block' },
    { phrase: 'definitely covered', category: 'insurance', severity: 'block' },
    { phrase: 'your plan covers', category: 'insurance', severity: 'block' },
    { phrase: 'your insurance covers', category: 'insurance', severity: 'block' },
    { phrase: 'don\'t worry about cost', category: 'insurance', severity: 'block' },
    { phrase: 'won\'t cost you', category: 'insurance', severity: 'block' },

    // Clinical safety prohibited phrases
    { phrase: 'you have', category: 'clinical', severity: 'block' },
    { phrase: 'you likely have', category: 'clinical', severity: 'block' },
    { phrase: 'sounds like you have', category: 'clinical', severity: 'block' },
    { phrase: 'i think you have', category: 'clinical', severity: 'block' },
    { phrase: 'that means you', category: 'clinical', severity: 'block' },
    { phrase: 'you should take', category: 'clinical', severity: 'block' },
    { phrase: 'i recommend', category: 'clinical', severity: 'block' },
    { phrase: 'you need treatment', category: 'clinical', severity: 'block' },
    { phrase: 'diagnosis', category: 'clinical', severity: 'warn' },

    // Tone violations
    { phrase: 'act now', category: 'tone', severity: 'block' },
    { phrase: 'limited time', category: 'tone', severity: 'block' },
    { phrase: 'don\'t miss out', category: 'tone', severity: 'block' },
    { phrase: 'hurry', category: 'tone', severity: 'block' },
    { phrase: 'last chance', category: 'tone', severity: 'block' },
    { phrase: 'special offer', category: 'tone', severity: 'block' },
    { phrase: 'discount', category: 'tone', severity: 'warn' },
  ];

  evaluate(responseText: string): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const lowerText = responseText.toLowerCase();

    for (const prohibited of this.prohibitedPhrases) {
      if (lowerText.includes(prohibited.phrase.toLowerCase())) {
        violations.push({
          policy_id: `${prohibited.category}_${prohibited.phrase.replace(/\s+/g, '_')}`,
          category: prohibited.category,
          rule: `Response must not contain "${prohibited.phrase}"`,
          severity: prohibited.severity,
          matched_text: prohibited.phrase,
        });
      }
    }

    return violations;
  }

  hasBlockingViolation(violations: PolicyViolation[]): boolean {
    return violations.some((v) => v.severity === 'block');
  }

  sanitize(responseText: string): string {
    let sanitized = responseText;
    for (const prohibited of this.prohibitedPhrases) {
      if (prohibited.severity === 'block') {
        const regex = new RegExp(prohibited.phrase, 'gi');
        sanitized = sanitized.replace(regex, '[REDACTED]');
      }
    }
    return sanitized;
  }
}

// ─── Response Composer ──────────────────────────────────────────────

export class ResponseComposer {
  compose(
    playbooks: string[],
    context: OrchestrationContext,
    sliders: SliderValues,
    _playbookConfigs: Map<string, PlaybookConfig>
  ): string {
    // In production, this would call the LLM with:
    // - System prompt
    // - Active playbook instructions
    // - Conversation context
    // - Slider-influenced parameters
    // - Extracted fields
    //
    // For now, return a template-based response based on workflow stage

    const stage = context.currentStage;
    const reassurance = sliders.reassurance_level;
    const length = sliders.response_length;

    let response = '';

    switch (stage) {
      case 'initial_contact':
        response = this.buildInitialResponse(context, reassurance);
        break;
      case 'lead_qualification':
        response = this.buildQualificationResponse(context);
        break;
      case 'location_selection':
        response = this.buildLocationResponse(context);
        break;
      case 'insurance_collection':
        response = this.buildInsuranceResponse(reassurance);
        break;
      case 'scheduling':
        response = this.buildSchedulingResponse(context);
        break;
      case 'confirmation_pending':
        response = this.buildConfirmationResponse(reassurance);
        break;
      default:
        response = "I'm here to help. What can I assist you with?";
    }

    // Apply length constraints based on slider
    if (length < 40) {
      // Trim to shorter response
      const sentences = response.split('. ');
      response = sentences.slice(0, Math.max(2, Math.ceil(sentences.length * 0.6))).join('. ');
      if (!response.endsWith('.')) response += '.';
    }

    return response;
  }

  private buildInitialResponse(_context: OrchestrationContext, reassurance: number): string {
    if (reassurance > 70) {
      return "Hi there! Thank you for reaching out to us. We're glad you contacted us and we'd love to help you get the care you need. Could I start with your name so I can assist you personally?";
    }
    return "Hi! Thanks for reaching out. I'd be happy to help you get scheduled. Could I start with your name?";
  }

  private buildQualificationResponse(context: OrchestrationContext): string {
    const name = context.extractedFields['full_name']?.normalized_value || '';
    if (!context.extractedFields['requested_location']) {
      return `Thanks, ${name}! To find the best location for you, could you share your ZIP code or let me know which area works best for you?`;
    }
    return `Great, ${name}! Let me help you get scheduled. What works best for you?`;
  }

  private buildLocationResponse(_context: OrchestrationContext): string {
    return "I'd be happy to help you find a convenient location. Could you share your ZIP code? I'll find the closest office for you, though you're always welcome to choose any location you prefer.";
  }

  private buildInsuranceResponse(reassurance: number): string {
    if (reassurance > 70) {
      return "That's a very common question, and I completely understand wanting to know about your insurance. We'll verify your insurance and confirm everything with you before the appointment is finalized, so you'll have all the information you need ahead of time. Would you like to share your insurance provider so we can get that started?";
    }
    return "We'll verify your insurance before your appointment is finalized, so you'll know what to expect. Could you share your insurance provider?";
  }

  private buildSchedulingResponse(_context: OrchestrationContext): string {
    return "Let's find a time that works for you. Do you have any preferred days or times? I can check what's available at your selected location.";
  }

  private buildConfirmationResponse(reassurance: number): string {
    if (reassurance > 70) {
      return "Your appointment has been provisionally scheduled. Our team will verify your insurance and confirm everything with you shortly. You'll receive a confirmation with all the details before your visit. Is there anything else I can help you with?";
    }
    return "Your appointment is provisionally scheduled. We'll confirm after insurance verification. You'll hear from us soon with the final details.";
  }
}

// ─── Field Extractor ────────────────────────────────────────────────

export class FieldExtractor {
  extract(message: string, _existingFields: Record<string, ExtractedFieldEntry>): Record<string, ExtractedFieldEntry> {
    const extracted: Record<string, ExtractedFieldEntry> = {};

    // Name extraction
    const nameMatch = message.match(
      /(?:(?:my name is|i'm|i am|this is|name's)\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i
    );
    if (nameMatch) {
      extracted['full_name'] = {
        raw_value: nameMatch[1],
        normalized_value: this.normalizeName(nameMatch[1]),
        confidence: 0.85,
        source_message_id: '',
      };
    }

    // Phone extraction
    const phoneMatch = message.match(
      /(?:\+?1?\s*)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/
    );
    if (phoneMatch) {
      extracted['phone_number'] = {
        raw_value: phoneMatch[0],
        normalized_value: this.normalizePhone(phoneMatch[0]),
        confidence: 0.95,
        source_message_id: '',
      };
    }

    // Email extraction
    const emailMatch = message.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    if (emailMatch) {
      extracted['email'] = {
        raw_value: emailMatch[0],
        normalized_value: emailMatch[0].toLowerCase(),
        confidence: 0.95,
        source_message_id: '',
      };
    }

    // DOB extraction
    const dobMatch = message.match(
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
    );
    if (dobMatch) {
      extracted['date_of_birth'] = {
        raw_value: dobMatch[0],
        normalized_value: this.normalizeDOB(dobMatch[0]),
        confidence: 0.8,
        source_message_id: '',
      };
    }

    // ZIP code extraction
    const zipMatch = message.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) {
      extracted['zip_code'] = {
        raw_value: zipMatch[0],
        normalized_value: zipMatch[1],
        confidence: 0.9,
        source_message_id: '',
      };
    }

    // Insurance provider extraction
    const insuranceProviders = [
      'aetna', 'blue cross', 'blue shield', 'bcbs', 'cigna', 'humana',
      'united', 'unitedhealthcare', 'uhc', 'kaiser', 'anthem', 'medicaid',
      'medicare', 'tricare', 'molina', 'centene', 'wellcare', 'ambetter',
    ];
    const lowerMessage = message.toLowerCase();
    for (const provider of insuranceProviders) {
      if (lowerMessage.includes(provider)) {
        extracted['insurance_provider'] = {
          raw_value: provider,
          normalized_value: this.normalizeInsuranceProvider(provider),
          confidence: 0.85,
          source_message_id: '',
        };
        break;
      }
    }

    // Date preference extraction
    const datePatterns = [
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(next week|this week|tomorrow|today)\b/i,
      /\b(\d{1,2}\/\d{1,2})\b/,
    ];
    for (const pattern of datePatterns) {
      const dateMatch2 = message.match(pattern);
      if (dateMatch2) {
        extracted['requested_date_raw'] = {
          raw_value: dateMatch2[0],
          confidence: 0.7,
          source_message_id: '',
        };
        break;
      }
    }

    // Time preference extraction
    const timeMatch = message.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i
    );
    if (timeMatch) {
      extracted['requested_time_raw'] = {
        raw_value: timeMatch[0],
        confidence: 0.85,
        source_message_id: '',
      };
    }

    // Callback preference
    if (/\b(call me|call back|prefer.?call|can you call)\b/i.test(message)) {
      extracted['callback_preference'] = {
        raw_value: 'callback_requested',
        normalized_value: 'callback_requested',
        confidence: 0.9,
        source_message_id: '',
      };
    }

    return extracted;
  }

  private normalizeName(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1${digits.slice(1)}`;
    }
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return phone;
  }

  private normalizeDOB(dob: string): string {
    const parts = dob.split(/[\/\-]/);
    if (parts.length === 3) {
      let year = parts[2];
      if (year.length === 2) {
        const num = parseInt(year);
        year = num > 30 ? `19${year}` : `20${year}`;
      }
      return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return dob;
  }

  private normalizeInsuranceProvider(provider: string): string {
    const mapping: Record<string, string> = {
      'bcbs': 'Blue Cross Blue Shield',
      'blue cross': 'Blue Cross Blue Shield',
      'blue shield': 'Blue Cross Blue Shield',
      'uhc': 'UnitedHealthcare',
      'united': 'UnitedHealthcare',
      'unitedhealthcare': 'UnitedHealthcare',
    };
    return mapping[provider.toLowerCase()] || provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

// ─── Escalation Evaluator ───────────────────────────────────────────

export class EscalationEvaluator {
  evaluate(
    intent: Intent,
    confidence: number,
    context: OrchestrationContext,
    sliders: SliderValues
  ): { shouldEscalate: boolean; reason?: string; type?: string } {
    const sensitivity = sliders.human_handoff_sensitivity;

    // Direct escalation triggers
    if (intent === 'human_request') {
      return { shouldEscalate: true, reason: 'patient_requested_human', type: 'live' };
    }

    if (intent === 'frustration') {
      return { shouldEscalate: true, reason: 'frustration_detected', type: 'live' };
    }

    // Confidence-based escalation (adjusted by slider)
    const confidenceThreshold = 0.3 + (sensitivity / 100) * 0.3; // 0.3 to 0.6
    if (confidence < confidenceThreshold) {
      return { shouldEscalate: true, reason: 'low_confidence', type: 'unresolved' };
    }

    // Long conversation without progress
    if (context.messageHistory.length > 15) {
      const recentMessages = context.messageHistory.slice(-6);
      const botMessages = recentMessages.filter((m) => m.role === 'bot');
      if (botMessages.length >= 3) {
        return { shouldEscalate: true, reason: 'stalled_conversation', type: 'unresolved' };
      }
    }

    // Callback request
    if (intent === 'callback_request') {
      return { shouldEscalate: true, reason: 'callback_requested', type: 'callback' };
    }

    return { shouldEscalate: false };
  }
}

// ─── Duplicate Checker ──────────────────────────────────────────────

export class DuplicateChecker {
  // In production, this queries the database
  async check(
    phone?: string,
    _name?: string,
    _dob?: string,
    _email?: string
  ): Promise<{ isDuplicate: boolean; matchedLeadId?: string; matchType?: string; confidence: number }> {
    if (!phone) {
      return { isDuplicate: false, confidence: 0 };
    }
    // TODO: Implement actual database lookup
    // Primary match on phone number, secondary on name+DOB, tertiary on email
    return { isDuplicate: false, confidence: 0 };
  }
}

// ─── Main Orchestration Engine ──────────────────────────────────────

export class OrchestrationEngine extends EventEmitter {
  private intentClassifier: IntentClassifier;
  private complexityAssessor: ComplexityAssessor;
  private workflowController: WorkflowController;
  private playbookRouter: PlaybookRouter;
  private policyGuard: PolicyGuard;
  private responseComposer: ResponseComposer;
  private fieldExtractor: FieldExtractor;
  private escalationEvaluator: EscalationEvaluator;
  private duplicateChecker: DuplicateChecker;

  constructor() {
    super();
    this.intentClassifier = new IntentClassifier();
    this.complexityAssessor = new ComplexityAssessor();
    this.workflowController = new WorkflowController();
    this.playbookRouter = new PlaybookRouter();
    this.policyGuard = new PolicyGuard();
    this.responseComposer = new ResponseComposer();
    this.fieldExtractor = new FieldExtractor();
    this.escalationEvaluator = new EscalationEvaluator();
    this.duplicateChecker = new DuplicateChecker();
  }

  loadPlaybooks(configs: PlaybookConfig[]): void {
    this.playbookRouter.loadPlaybooks(configs);
  }

  async processMessage(
    message: string,
    context: OrchestrationContext
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const actions: OrchestrationAction[] = [];

    // Step 1: Classify intent
    const { intent, confidence, secondary_intents: _secondaryIntents } =
      this.intentClassifier.classify(message, context);

    // Step 2: Assess complexity and risk
    const { complexity, risk_level } =
      this.complexityAssessor.assess(intent, message, context);

    // Step 3: Extract fields
    const newFields = this.fieldExtractor.extract(message, context.extractedFields);
    const allFields = { ...context.extractedFields, ...newFields };

    // Step 4: Check for duplicates if we have a phone number
    let duplicateDetected = false;
    if (newFields['phone_number']) {
      const dupCheck = await this.duplicateChecker.check(
        newFields['phone_number'].normalized_value
      );
      duplicateDetected = dupCheck.isDuplicate;
      if (dupCheck.isDuplicate && dupCheck.matchedLeadId) {
        actions.push({
          type: 'check_duplicate',
          phone: newFields['phone_number'].normalized_value!,
        });
      }
    }

    // Step 5: Determine workflow stage
    const updatedContext = { ...context, extractedFields: allFields };
    const nextStage = this.workflowController.determineStage(updatedContext, intent);

    // Step 6: Evaluate escalation
    const escalation = this.escalationEvaluator.evaluate(
      intent, confidence, updatedContext, context.sliderSettings
    );
    if (escalation.shouldEscalate) {
      actions.push({
        type: 'escalate_to_human',
        reason: escalation.reason!,
      });
    }

    // Step 7: Select playbooks
    const activePlaybooks = this.playbookRouter.selectPlaybooks(intent, updatedContext);

    // Step 8: Check if booking should be offered
    const bookingOffered = this.workflowController.shouldOfferBooking(
      updatedContext, intent, context.sliderSettings
    );

    // Step 9: Compose response
    let response = this.responseComposer.compose(
      activePlaybooks,
      updatedContext,
      context.sliderSettings,
      new Map() // TODO: pass actual playbook configs
    );

    // Step 10: Policy guard - check response
    const violations = this.policyGuard.evaluate(response);
    if (this.policyGuard.hasBlockingViolation(violations)) {
      response = this.policyGuard.sanitize(response);
      this.emit('policy_violation', { violations, original_response: response });
    }

    // Step 11: Determine actions
    if (Object.keys(newFields).length > 0 && !context.leadId) {
      actions.push({ type: 'create_lead', data: allFields });
    } else if (Object.keys(newFields).length > 0 && context.leadId) {
      actions.push({ type: 'update_lead', leadId: context.leadId, data: newFields });
    }

    if (escalation.shouldEscalate && escalation.type === 'callback') {
      actions.push({
        type: 'request_callback',
        preferredTime: allFields['callback_preference']?.raw_value,
      });
    }

    const processingTime = Date.now() - startTime;

    // Build trace
    const trace: OrchestrationTrace = {
      detected_intent: intent,
      complexity,
      risk_level,
      workflow_stage: nextStage,
      active_playbooks: activePlaybooks,
      confidence_score: confidence,
      fallback_used: intent === 'unknown',
      escalation_triggered: escalation.shouldEscalate,
      duplicate_detected: duplicateDetected,
      booking_offered: bookingOffered,
      policy_violations: violations.map((v) => v.rule),
      slider_values: context.sliderSettings,
      processing_time_ms: processingTime,
    };

    // Emit analytics event
    this.emit('message_processed', { trace, actions });

    return {
      response,
      trace,
      actions,
      extractedFields: allFields,
      nextStage,
    };
  }
}

export default OrchestrationEngine;
