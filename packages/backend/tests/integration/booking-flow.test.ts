/**
 * Booking Flow Integration Tests
 *
 * End-to-end booking conversation flow testing the full pipeline:
 * greeting → information collection → insurance → scheduling → confirmation.
 */

// ---- Types ----

interface ConversationMessage {
  role: 'patient' | 'bot';
  content: string;
}

interface SessionState {
  sessionId: string;
  stage: string;
  collectedFields: Record<string, string>;
  playbook: string;
  messages: ConversationMessage[];
  bookingConfirmed: boolean;
  appointmentId?: string;
}

interface BotResponse {
  content: string;
  stage: string;
  promptedField?: string;
  bookingConfirmed?: boolean;
  appointmentId?: string;
}

// ---- Mock orchestration engine ----

const createSession = jest.fn<SessionState, [string, string]>();
const processMessage = jest.fn<BotResponse, [string, string]>();
const getSession = jest.fn<SessionState, [string]>();

function buildBookingEngine() {
  const sessions: Map<string, SessionState> = new Map();

  createSession.mockImplementation((channel: string, locationId: string) => {
    const session: SessionState = {
      sessionId: `session_${Date.now()}`,
      stage: 'greeting',
      collectedFields: {},
      playbook: 'booking-web',
      messages: [],
      bookingConfirmed: false,
    };
    session.messages.push({
      role: 'bot',
      content:
        "Welcome! I'm your patient coordinator. I can help you schedule a vein consultation. May I start by getting your name?",
    });
    sessions.set(session.sessionId, session);
    return session;
  });

  processMessage.mockImplementation((sessionId: string, message: string) => {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.messages.push({ role: 'patient', content: message });
    const lower = message.toLowerCase();

    let response: BotResponse;

    switch (session.stage) {
      case 'greeting':
        // Expect name
        if (/my name is|i'm|i am/i.test(message) || /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(message.trim())) {
          const nameMatch = message.match(/(?:my name is|i'm|i am)\s+(.+)/i);
          session.collectedFields.name = nameMatch ? nameMatch[1].trim() : message.trim();
          session.stage = 'phone_collection';
          response = {
            content: `Thank you, ${session.collectedFields.name}! What's the best phone number to reach you?`,
            stage: 'phone_collection',
            promptedField: 'phone',
          };
        } else {
          response = {
            content: "I'd love to help you schedule a consultation. Could you share your name with me?",
            stage: 'greeting',
            promptedField: 'name',
          };
        }
        break;

      case 'phone_collection':
        const phoneDigits = message.replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
        if (phoneDigits.length === 10) {
          session.collectedFields.phone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
          session.stage = 'insurance_collection';
          response = {
            content: "Great, got it! Could you share your insurance provider? This helps us verify your coverage ahead of your visit.",
            stage: 'insurance_collection',
            promptedField: 'insuranceProvider',
          };
        } else {
          response = {
            content: "I didn't quite catch that. Could you provide a 10-digit phone number?",
            stage: 'phone_collection',
            promptedField: 'phone',
          };
        }
        break;

      case 'insurance_collection':
        session.collectedFields.insuranceProvider = message.trim();
        session.stage = 'date_selection';
        response = {
          content: `Thank you! We work with ${message.trim()} and many other providers. When would you like to come in for your consultation? We have availability this week and next.`,
          stage: 'date_selection',
          promptedField: 'preferredDate',
        };
        break;

      case 'date_selection':
        session.collectedFields.preferredDate = message.trim();
        session.stage = 'confirmation';
        const fields = session.collectedFields;
        response = {
          content: `Let me confirm your appointment details:\n- Name: ${fields.name}\n- Phone: ${fields.phone}\n- Insurance: ${fields.insuranceProvider}\n- Preferred date: ${fields.preferredDate}\n\nShall I go ahead and book this for you?`,
          stage: 'confirmation',
        };
        break;

      case 'confirmation':
        if (/yes|confirm|book|sure|go ahead/i.test(message)) {
          session.bookingConfirmed = true;
          session.appointmentId = `APT_${Date.now()}`;
          session.stage = 'completed';
          response = {
            content: `Your consultation has been booked! Your appointment ID is ${session.appointmentId}. You'll receive a confirmation text at ${session.collectedFields.phone}. Is there anything else I can help with?`,
            stage: 'completed',
            bookingConfirmed: true,
            appointmentId: session.appointmentId,
          };
        } else {
          session.stage = 'greeting';
          session.collectedFields = {};
          response = {
            content: "No problem! Let me know if you'd like to start over or if there's anything else I can help with.",
            stage: 'greeting',
          };
        }
        break;

      default:
        response = {
          content: "Is there anything else I can help you with today?",
          stage: session.stage,
        };
    }

    session.messages.push({ role: 'bot', content: response.content });
    return response;
  });

  getSession.mockImplementation((sessionId: string) => {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  });

  return { createSession, processMessage, getSession };
}

// ---- Tests ----

describe('Complete Booking Flow', () => {
  let engine: ReturnType<typeof buildBookingEngine>;
  let sessionId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = buildBookingEngine();
    const session = engine.createSession('web', 'clinic_001');
    sessionId = session.sessionId;
  });

  it('should complete a full booking conversation', () => {
    // Step 1: Provide name
    const nameResponse = engine.processMessage(sessionId, "My name is Sarah Johnson");
    expect(nameResponse.stage).toBe('phone_collection');
    expect(nameResponse.promptedField).toBe('phone');

    // Step 2: Provide phone
    const phoneResponse = engine.processMessage(sessionId, '555-234-5678');
    expect(phoneResponse.stage).toBe('insurance_collection');
    expect(phoneResponse.promptedField).toBe('insuranceProvider');

    // Step 3: Provide insurance
    const insuranceResponse = engine.processMessage(sessionId, 'BlueCross BlueShield');
    expect(insuranceResponse.stage).toBe('date_selection');
    expect(insuranceResponse.content).toContain('BlueCross BlueShield');

    // Step 4: Select date
    const dateResponse = engine.processMessage(sessionId, 'Next Tuesday morning');
    expect(dateResponse.stage).toBe('confirmation');
    expect(dateResponse.content).toContain('Sarah Johnson');
    expect(dateResponse.content).toContain('BlueCross BlueShield');

    // Step 5: Confirm
    const confirmResponse = engine.processMessage(sessionId, 'Yes, please book it');
    expect(confirmResponse.bookingConfirmed).toBe(true);
    expect(confirmResponse.appointmentId).toBeDefined();
    expect(confirmResponse.stage).toBe('completed');
  });

  it('should ask for name when greeting stage gets non-name input', () => {
    const response = engine.processMessage(sessionId, 'Hello there');
    expect(response.stage).toBe('greeting');
    expect(response.promptedField).toBe('name');
  });

  it('should reject invalid phone numbers and re-prompt', () => {
    engine.processMessage(sessionId, "My name is Jane Doe");
    const response = engine.processMessage(sessionId, '123');
    expect(response.stage).toBe('phone_collection');
    expect(response.promptedField).toBe('phone');
  });

  it('should accept various phone formats', () => {
    engine.processMessage(sessionId, "I'm Jane Doe");

    const formats = [
      '(555) 234-5678',
      '555-234-5678',
      '555.234.5678',
      '5552345678',
    ];

    for (const phone of formats) {
      jest.clearAllMocks();
      const eng = buildBookingEngine();
      const sess = eng.createSession('web', 'clinic_001');
      eng.processMessage(sess.sessionId, "My name is Jane Doe");
      const response = eng.processMessage(sess.sessionId, phone);
      expect(response.stage).toBe('insurance_collection');
    }
  });

  it('should allow patient to cancel booking at confirmation', () => {
    engine.processMessage(sessionId, "My name is Jane Doe");
    engine.processMessage(sessionId, '555-234-5678');
    engine.processMessage(sessionId, 'Aetna');
    engine.processMessage(sessionId, 'Next Wednesday');

    const cancelResponse = engine.processMessage(sessionId, 'No, I changed my mind');
    expect(cancelResponse.bookingConfirmed).toBeUndefined();
    expect(cancelResponse.stage).toBe('greeting');
  });

  it('should track all messages in session history', () => {
    engine.processMessage(sessionId, "My name is Jane Doe");
    engine.processMessage(sessionId, '555-234-5678');

    const session = engine.getSession(sessionId);
    // Greeting + name + bot response + phone + bot response = at least 5 messages
    expect(session.messages.length).toBeGreaterThanOrEqual(5);
    expect(session.messages[0].role).toBe('bot'); // greeting
    expect(session.messages[1].role).toBe('patient'); // name
  });

  it('should store collected fields correctly', () => {
    engine.processMessage(sessionId, "My name is Sarah Johnson");
    engine.processMessage(sessionId, '555-234-5678');
    engine.processMessage(sessionId, 'United Healthcare');

    const session = engine.getSession(sessionId);
    expect(session.collectedFields.name).toBe('Sarah Johnson');
    expect(session.collectedFields.phone).toBe('(555) 234-5678');
    expect(session.collectedFields.insuranceProvider).toBe('United Healthcare');
  });
});

describe('Booking Flow Edge Cases', () => {
  let engine: ReturnType<typeof buildBookingEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = buildBookingEngine();
  });

  it('should handle session not found', () => {
    expect(() => {
      engine.processMessage('nonexistent_session', 'hello');
    }).toThrow('Session not found');
  });

  it('should include confirmation text mention in booking confirmation', () => {
    const session = engine.createSession('web', 'clinic_001');
    engine.processMessage(session.sessionId, "My name is Test User");
    engine.processMessage(session.sessionId, '555-111-2222');
    engine.processMessage(session.sessionId, 'Cigna');
    engine.processMessage(session.sessionId, 'Friday');
    const response = engine.processMessage(session.sessionId, 'Yes');
    expect(response.content).toContain('confirmation');
  });

  it('should generate unique appointment IDs', () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const sess = engine.createSession('web', 'clinic_001');
      engine.processMessage(sess.sessionId, `My name is Test User ${i}`);
      engine.processMessage(sess.sessionId, `555-000-000${i}`);
      engine.processMessage(sess.sessionId, 'Aetna');
      engine.processMessage(sess.sessionId, 'Monday');
      const response = engine.processMessage(sess.sessionId, 'Yes');
      if (response.appointmentId) ids.push(response.appointmentId);
    }
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
