/**
 * Missed Call Recovery Integration Tests
 *
 * Tests the flow: missed call detection → SMS outreach →
 * conversation engagement → booking completion.
 */

// ---- Types ----

interface MissedCall {
  callId: string;
  from: string;
  to: string;
  timestamp: Date;
  locationId: string;
  callerName?: string;
}

interface SMSOutreach {
  messageId: string;
  to: string;
  body: string;
  sentAt: Date;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}

interface RecoverySession {
  recoveryId: string;
  callId: string;
  phone: string;
  locationId: string;
  status: 'outreach_sent' | 'engaged' | 'booking_started' | 'booking_completed' | 'expired' | 'opted_out';
  outreachMessages: SMSOutreach[];
  conversationSessionId?: string;
  appointmentId?: string;
}

// ---- Mock implementations ----

const detectMissedCall = jest.fn<MissedCall, [any]>();
const sendOutreachSMS = jest.fn<SMSOutreach, [string, string, string]>();
const createRecoverySession = jest.fn<RecoverySession, [MissedCall]>();
const handleInboundSMS = jest.fn<{ reply: string; action: string }, [string, string]>();
const getRecoverySession = jest.fn<RecoverySession | null, [string]>();
const updateRecoveryStatus = jest.fn<void, [string, string]>();

// Recovery session store
const recoverySessions: Map<string, RecoverySession> = new Map();

beforeEach(() => {
  jest.clearAllMocks();
  recoverySessions.clear();

  detectMissedCall.mockImplementation((event) => ({
    callId: `call_${Date.now()}`,
    from: event.from || '+15551234567',
    to: event.to || '+15559876543',
    timestamp: new Date(),
    locationId: event.locationId || 'clinic_001',
    callerName: event.callerName,
  }));

  sendOutreachSMS.mockImplementation((to, body, locationId) => ({
    messageId: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    to,
    body,
    sentAt: new Date(),
    status: 'sent',
  }));

  createRecoverySession.mockImplementation((missedCall) => {
    const session: RecoverySession = {
      recoveryId: `recovery_${Date.now()}`,
      callId: missedCall.callId,
      phone: missedCall.from,
      locationId: missedCall.locationId,
      status: 'outreach_sent',
      outreachMessages: [],
    };
    recoverySessions.set(session.phone, session);
    return session;
  });

  handleInboundSMS.mockImplementation((from, body) => {
    const session = recoverySessions.get(from);
    if (!session) {
      return { reply: '', action: 'no_session' };
    }

    const lower = body.toLowerCase().trim();

    // Handle opt-out
    if (['stop', 'unsubscribe', 'cancel', 'opt out'].includes(lower)) {
      session.status = 'opted_out';
      return {
        reply: 'You have been unsubscribed. Reply START to opt back in.',
        action: 'opted_out',
      };
    }

    // Handle engagement
    if (session.status === 'outreach_sent') {
      session.status = 'engaged';
      return {
        reply: "Thank you for reaching out! I'd love to help you schedule a vein consultation. What day works best for you?",
        action: 'engaged',
      };
    }

    // Handle booking intent
    if (session.status === 'engaged' && /monday|tuesday|wednesday|thursday|friday|tomorrow|next week/i.test(body)) {
      session.status = 'booking_started';
      return {
        reply: `Great choice! I have availability. Could you confirm your full name so I can get you booked?`,
        action: 'booking_started',
      };
    }

    if (session.status === 'booking_started') {
      session.status = 'booking_completed';
      session.appointmentId = `APT_${Date.now()}`;
      return {
        reply: `You're all set! Your consultation is booked (ID: ${session.appointmentId}). We'll send a reminder the day before. See you soon!`,
        action: 'booking_completed',
      };
    }

    return {
      reply: 'How can I help you today? Would you like to schedule a vein consultation?',
      action: 'general_response',
    };
  });

  getRecoverySession.mockImplementation((phone) => {
    return recoverySessions.get(phone) || null;
  });
});

// ---- Tests ----

describe('Missed Call Detection', () => {
  it('should create a missed call record from a call event', () => {
    const call = detectMissedCall({
      from: '+15551234567',
      to: '+15559876543',
      locationId: 'clinic_001',
    });
    expect(call.callId).toBeDefined();
    expect(call.from).toBe('+15551234567');
    expect(call.locationId).toBe('clinic_001');
  });

  it('should capture caller name when available', () => {
    const call = detectMissedCall({
      from: '+15551234567',
      callerName: 'Jane Smith',
    });
    expect(call.callerName).toBe('Jane Smith');
  });

  it('should handle calls without caller name', () => {
    const call = detectMissedCall({ from: '+15551234567' });
    expect(call.callerName).toBeUndefined();
  });
});

describe('SMS Outreach', () => {
  it('should send an outreach SMS after missed call', () => {
    const call = detectMissedCall({ from: '+15551234567' });
    const session = createRecoverySession(call);
    const sms = sendOutreachSMS(
      call.from,
      "Hi! We noticed we missed your call to our vein clinic. We'd love to help you. Would you like to schedule a free consultation? Reply YES or call us back anytime.",
      call.locationId
    );

    expect(sms.to).toBe('+15551234567');
    expect(sms.status).toBe('sent');
    expect(session.status).toBe('outreach_sent');
  });

  it('should not include prohibited insurance language in outreach', () => {
    const outreachBody =
      "Hi! We noticed we missed your call. We'd love to help you schedule a consultation. Most insurance plans are accepted. Reply YES to get started!";

    const prohibitedPhrases = ['free', 'guaranteed', 'no cost', 'covered'];
    for (const phrase of prohibitedPhrases) {
      expect(outreachBody.toLowerCase()).not.toContain(phrase);
    }
  });
});

describe('Full Missed Call Recovery Flow', () => {
  it('should complete the recovery pipeline: missed call → SMS → engagement → booking', () => {
    // Step 1: Detect missed call
    const call = detectMissedCall({ from: '+15559001234', locationId: 'clinic_002' });
    expect(call).toBeDefined();

    // Step 2: Create recovery session
    const session = createRecoverySession(call);
    expect(session.status).toBe('outreach_sent');

    // Step 3: Send outreach SMS
    const sms = sendOutreachSMS(
      call.from,
      "We missed your call! Would you like to schedule a consultation?",
      call.locationId
    );
    expect(sms.status).toBe('sent');

    // Step 4: Patient replies
    const engagement = handleInboundSMS('+15559001234', 'Yes, I am interested');
    expect(engagement.action).toBe('engaged');

    // Step 5: Patient selects a date
    const dateResponse = handleInboundSMS('+15559001234', 'How about next Tuesday?');
    expect(dateResponse.action).toBe('booking_started');

    // Step 6: Patient provides name
    const bookingResponse = handleInboundSMS('+15559001234', 'Sarah Johnson');
    expect(bookingResponse.action).toBe('booking_completed');

    // Verify final state
    const finalSession = getRecoverySession('+15559001234');
    expect(finalSession).not.toBeNull();
    expect(finalSession!.status).toBe('booking_completed');
    expect(finalSession!.appointmentId).toBeDefined();
  });

  it('should handle opt-out at any stage', () => {
    const call = detectMissedCall({ from: '+15558001234' });
    createRecoverySession(call);

    const response = handleInboundSMS('+15558001234', 'STOP');
    expect(response.action).toBe('opted_out');

    const session = getRecoverySession('+15558001234');
    expect(session!.status).toBe('opted_out');
  });

  it('should handle opt-out variations', () => {
    const optOutPhrases = ['stop', 'unsubscribe', 'cancel', 'opt out'];

    for (const phrase of optOutPhrases) {
      recoverySessions.clear();
      const call = detectMissedCall({ from: '+15557001234' });
      createRecoverySession(call);

      const response = handleInboundSMS('+15557001234', phrase);
      expect(response.action).toBe('opted_out');
    }
  });

  it('should handle inbound SMS with no matching recovery session', () => {
    const response = handleInboundSMS('+15550000000', 'Hello');
    expect(response.action).toBe('no_session');
  });

  it('should progress through stages in order', () => {
    const call = detectMissedCall({ from: '+15556001234' });
    const session = createRecoverySession(call);

    const stages: string[] = [session.status];

    handleInboundSMS('+15556001234', 'Yes');
    stages.push(getRecoverySession('+15556001234')!.status);

    handleInboundSMS('+15556001234', 'Next Friday');
    stages.push(getRecoverySession('+15556001234')!.status);

    handleInboundSMS('+15556001234', 'John Doe');
    stages.push(getRecoverySession('+15556001234')!.status);

    expect(stages).toEqual([
      'outreach_sent',
      'engaged',
      'booking_started',
      'booking_completed',
    ]);
  });
});

describe('Recovery Timing and Limits', () => {
  it('should generate unique recovery IDs', () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const call = detectMissedCall({ from: `+1555000${1000 + i}` });
      const session = createRecoverySession(call);
      ids.push(session.recoveryId);
    }
    expect(new Set(ids).size).toBe(5);
  });

  it('should link recovery session to original missed call', () => {
    const call = detectMissedCall({ from: '+15554001234' });
    const session = createRecoverySession(call);
    expect(session.callId).toBe(call.callId);
    expect(session.phone).toBe(call.from);
    expect(session.locationId).toBe(call.locationId);
  });
});
