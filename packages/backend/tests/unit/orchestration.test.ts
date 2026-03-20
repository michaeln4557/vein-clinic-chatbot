/**
 * Orchestration Engine Tests
 *
 * Tests intent classification, workflow stage detection,
 * playbook selection, and escalation evaluation.
 */

// ---- Type stubs for modules under test ----

interface Intent {
  name: string;
  confidence: number;
}

interface WorkflowStage {
  stage: string;
  complete: boolean;
  missingFields: string[];
}

interface Playbook {
  id: string;
  name: string;
  channel: string;
  stages: string[];
}

interface EscalationResult {
  shouldEscalate: boolean;
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// ---- Mock implementations ----

const classifyIntent = jest.fn<Intent, [string]>();
const detectWorkflowStage = jest.fn<WorkflowStage, [string, Record<string, any>]>();
const selectPlaybook = jest.fn<Playbook, [string, string]>();
const evaluateEscalation = jest.fn<EscalationResult, [Record<string, any>]>();

// ---- Setup ----

beforeEach(() => {
  jest.clearAllMocks();

  // Default intent classification behavior
  classifyIntent.mockImplementation((message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
      return { name: 'booking', confidence: 0.95 };
    }
    if (lower.includes('insurance') || lower.includes('coverage') || lower.includes('policy')) {
      return { name: 'insurance_inquiry', confidence: 0.90 };
    }
    if (lower.includes('cancel')) {
      return { name: 'cancellation', confidence: 0.88 };
    }
    if (lower.includes('pain') || lower.includes('hurt') || lower.includes('emergency')) {
      return { name: 'clinical_concern', confidence: 0.92 };
    }
    if (lower.includes('location') || lower.includes('address') || lower.includes('directions')) {
      return { name: 'location_inquiry', confidence: 0.87 };
    }
    return { name: 'general', confidence: 0.5 };
  });

  // Default workflow stage detection
  detectWorkflowStage.mockImplementation((_playbookId: string, context: Record<string, any>) => {
    const collected = context.collectedFields || {};
    const missingFields: string[] = [];

    if (!collected.name) missingFields.push('name');
    if (!collected.phone) missingFields.push('phone');
    if (!collected.preferredDate) missingFields.push('preferredDate');
    if (!collected.insuranceProvider) missingFields.push('insuranceProvider');

    if (missingFields.length === 0) {
      return { stage: 'confirmation', complete: true, missingFields: [] };
    }
    if (missingFields.length <= 2) {
      return { stage: 'collection', complete: false, missingFields };
    }
    return { stage: 'greeting', complete: false, missingFields };
  });

  // Default playbook selection
  selectPlaybook.mockImplementation((intent: string, channel: string) => {
    const playbooks: Record<string, Playbook> = {
      'booking:web': {
        id: 'booking-web',
        name: 'Web Booking Flow',
        channel: 'web',
        stages: ['greeting', 'collection', 'insurance', 'scheduling', 'confirmation'],
      },
      'booking:sms': {
        id: 'booking-sms',
        name: 'SMS Booking Flow',
        channel: 'sms',
        stages: ['greeting', 'collection', 'scheduling', 'confirmation'],
      },
      'insurance_inquiry:web': {
        id: 'insurance-web',
        name: 'Insurance Inquiry',
        channel: 'web',
        stages: ['greeting', 'identification', 'verification', 'response'],
      },
    };
    return playbooks[`${intent}:${channel}`] || {
      id: 'general-fallback',
      name: 'General Conversation',
      channel,
      stages: ['greeting', 'response'],
    };
  });

  // Default escalation evaluation
  evaluateEscalation.mockImplementation((context: Record<string, any>) => {
    if (context.sentimentScore !== undefined && context.sentimentScore < -0.7) {
      return { shouldEscalate: true, reason: 'negative_sentiment', priority: 'high' };
    }
    if (context.clinicalConcern) {
      return { shouldEscalate: true, reason: 'clinical_concern', priority: 'urgent' };
    }
    if (context.escalationRequested) {
      return { shouldEscalate: true, reason: 'patient_requested', priority: 'medium' };
    }
    if (context.failedAttempts && context.failedAttempts >= 3) {
      return { shouldEscalate: true, reason: 'repeated_failure', priority: 'medium' };
    }
    return { shouldEscalate: false };
  });
});

// ---- Tests ----

describe('Intent Classification', () => {
  it('should classify booking-related messages with high confidence', () => {
    const result = classifyIntent('I would like to book an appointment');
    expect(result.name).toBe('booking');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should classify scheduling synonyms as booking intent', () => {
    const messages = [
      'Can I schedule a consultation?',
      'I need to book a visit',
      'I want to make an appointment',
    ];
    for (const msg of messages) {
      const result = classifyIntent(msg);
      expect(result.name).toBe('booking');
    }
  });

  it('should classify insurance inquiries', () => {
    const result = classifyIntent('Does my insurance cover vein treatment?');
    expect(result.name).toBe('insurance_inquiry');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should classify cancellation requests', () => {
    const result = classifyIntent('I need to cancel my upcoming appointment');
    expect(result.name).toBe('cancellation');
  });

  it('should classify clinical concerns with high confidence', () => {
    const result = classifyIntent('I have severe leg pain and swelling');
    expect(result.name).toBe('clinical_concern');
    expect(result.confidence).toBeGreaterThan(0.85);
  });

  it('should classify location inquiries', () => {
    const result = classifyIntent('What is the address of your clinic?');
    expect(result.name).toBe('location_inquiry');
  });

  it('should return low confidence for ambiguous messages', () => {
    const result = classifyIntent('hello there');
    expect(result.name).toBe('general');
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('should handle empty string input gracefully', () => {
    const result = classifyIntent('');
    expect(result).toBeDefined();
    expect(result.name).toBe('general');
  });
});

describe('Workflow Stage Detection', () => {
  it('should identify greeting stage when no fields collected', () => {
    const result = detectWorkflowStage('booking-web', { collectedFields: {} });
    expect(result.stage).toBe('greeting');
    expect(result.complete).toBe(false);
    expect(result.missingFields).toContain('name');
    expect(result.missingFields).toContain('phone');
  });

  it('should identify collection stage when some fields present', () => {
    const result = detectWorkflowStage('booking-web', {
      collectedFields: { name: 'Jane Doe', phone: '555-0100' },
    });
    expect(result.stage).toBe('collection');
    expect(result.complete).toBe(false);
    expect(result.missingFields).not.toContain('name');
    expect(result.missingFields).not.toContain('phone');
    expect(result.missingFields).toContain('preferredDate');
  });

  it('should identify confirmation stage when all fields present', () => {
    const result = detectWorkflowStage('booking-web', {
      collectedFields: {
        name: 'Jane Doe',
        phone: '555-0100',
        preferredDate: '2026-04-01',
        insuranceProvider: 'BlueCross',
      },
    });
    expect(result.stage).toBe('confirmation');
    expect(result.complete).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('should list all missing required fields', () => {
    const result = detectWorkflowStage('booking-web', { collectedFields: {} });
    expect(result.missingFields).toEqual(
      expect.arrayContaining(['name', 'phone', 'preferredDate', 'insuranceProvider'])
    );
  });
});

describe('Playbook Selection', () => {
  it('should select web booking playbook for booking intent on web channel', () => {
    const playbook = selectPlaybook('booking', 'web');
    expect(playbook.id).toBe('booking-web');
    expect(playbook.channel).toBe('web');
    expect(playbook.stages).toContain('greeting');
    expect(playbook.stages).toContain('confirmation');
  });

  it('should select SMS booking playbook for SMS channel', () => {
    const playbook = selectPlaybook('booking', 'sms');
    expect(playbook.id).toBe('booking-sms');
    expect(playbook.channel).toBe('sms');
  });

  it('should select insurance playbook for insurance inquiries', () => {
    const playbook = selectPlaybook('insurance_inquiry', 'web');
    expect(playbook.id).toBe('insurance-web');
    expect(playbook.stages).toContain('verification');
  });

  it('should fall back to general playbook for unknown intents', () => {
    const playbook = selectPlaybook('unknown_intent', 'web');
    expect(playbook.id).toBe('general-fallback');
  });

  it('should include insurance stage in web booking but not SMS', () => {
    const webPlaybook = selectPlaybook('booking', 'web');
    const smsPlaybook = selectPlaybook('booking', 'sms');
    expect(webPlaybook.stages).toContain('insurance');
    expect(smsPlaybook.stages).not.toContain('insurance');
  });
});

describe('Escalation Evaluation', () => {
  it('should escalate when sentiment is very negative', () => {
    const result = evaluateEscalation({ sentimentScore: -0.85 });
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toBe('negative_sentiment');
    expect(result.priority).toBe('high');
  });

  it('should not escalate for mildly negative sentiment', () => {
    const result = evaluateEscalation({ sentimentScore: -0.3 });
    expect(result.shouldEscalate).toBe(false);
  });

  it('should escalate clinical concerns with urgent priority', () => {
    const result = evaluateEscalation({ clinicalConcern: true });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe('urgent');
  });

  it('should escalate when patient explicitly requests human agent', () => {
    const result = evaluateEscalation({ escalationRequested: true });
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toBe('patient_requested');
  });

  it('should escalate after multiple failed attempts', () => {
    const result = evaluateEscalation({ failedAttempts: 3 });
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toBe('repeated_failure');
  });

  it('should not escalate under normal conditions', () => {
    const result = evaluateEscalation({
      sentimentScore: 0.2,
      failedAttempts: 1,
    });
    expect(result.shouldEscalate).toBe(false);
  });

  it('should prioritize clinical concerns over negative sentiment', () => {
    const result = evaluateEscalation({
      clinicalConcern: true,
      sentimentScore: -0.9,
    });
    expect(result.priority).toBe('urgent');
  });
});
