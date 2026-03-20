/**
 * Insurance Reassurance Workflow Tests
 *
 * Verifies that insurance question handling never uses prohibited language,
 * always uses approved phrasing, and correctly redirects patients.
 */

// ---- Types ----

interface InsuranceResponse {
  content: string;
  suggestedAction?: 'verify_coverage' | 'contact_provider' | 'schedule_consultation';
  metadata?: Record<string, any>;
}

// ---- Prohibited and required phrases ----

const PROHIBITED_PHRASES = [
  'free',
  'complimentary',
  'no cost',
  'at no charge',
  'zero cost',
  'guaranteed coverage',
  'guaranteed approval',
  'covered by insurance',
  'your insurance will cover',
  'your insurance covers',
  'we accept all insurance',
  'fully covered',
  'insurance pays for everything',
  'pre-approved',
  'no out of pocket',
  'no copay',
  'no deductible',
  'will not cost you anything',
  'we guarantee',
];

const REQUIRED_DISCLAIMERS = [
  // At least one of these should appear in responses about coverage
  'coverage may vary',
  'depends on your specific plan',
  'individual benefits',
  'verify your coverage',
  'check your benefits',
  'contact your insurance',
  'speak with your insurance',
  'results may vary',
  'specific plan details',
];

// ---- Mock response generator ----

function generateInsuranceResponse(question: string): InsuranceResponse {
  const lower = question.toLowerCase();

  if (lower.includes('do you accept') || lower.includes('do you take')) {
    return {
      content:
        'We work with most major insurance providers. Coverage may vary depending on your specific plan and benefits. Our team can help verify your coverage before your appointment so you know what to expect.',
      suggestedAction: 'verify_coverage',
    };
  }

  if (lower.includes('how much') || lower.includes('cost') || lower.includes('price')) {
    return {
      content:
        'The cost of treatment depends on your specific plan details and the treatment recommended by your physician. We can verify your insurance benefits before your visit so there are no surprises. Would you like us to check your coverage?',
      suggestedAction: 'verify_coverage',
    };
  }

  if (lower.includes('covered') || lower.includes('coverage')) {
    return {
      content:
        'Many insurance plans include coverage for medically necessary vein treatments, but individual benefits can vary. We recommend that our team verify your specific coverage before your consultation. Would you like us to look into that for you?',
      suggestedAction: 'verify_coverage',
    };
  }

  if (lower.includes('out of pocket') || lower.includes('deductible') || lower.includes('copay')) {
    return {
      content:
        'Out-of-pocket costs depend on your specific plan, deductible status, and the treatment your physician recommends. Our billing team can review your benefits and provide a clearer picture. Would you like to schedule a time for us to verify your coverage?',
      suggestedAction: 'verify_coverage',
    };
  }

  if (lower.includes('medicaid') || lower.includes('medicare')) {
    return {
      content:
        'We work with Medicare and many Medicaid plans. Coverage for vein treatments depends on your specific plan details and medical necessity as determined by your physician. Our team can help verify your specific benefits.',
      suggestedAction: 'verify_coverage',
    };
  }

  if (lower.includes('no insurance') || lower.includes('uninsured') || lower.includes("don't have insurance")) {
    return {
      content:
        'We understand, and we want to make sure you can still get the care you need. We offer consultation appointments where the physician can evaluate your condition and discuss all available options with you. Would you like to schedule a consultation?',
      suggestedAction: 'schedule_consultation',
    };
  }

  return {
    content:
      'I want to make sure you get accurate information about your coverage. Our team specializes in verifying insurance benefits and can check your specific plan details. Would you like us to look into this for you?',
    suggestedAction: 'verify_coverage',
  };
}

// ---- Helper ----

function containsProhibitedPhrase(text: string): { found: boolean; phrase?: string } {
  const lower = text.toLowerCase();
  for (const phrase of PROHIBITED_PHRASES) {
    if (lower.includes(phrase)) {
      return { found: true, phrase };
    }
  }
  return { found: false };
}

function containsRequiredDisclaimer(text: string): boolean {
  const lower = text.toLowerCase();
  return REQUIRED_DISCLAIMERS.some((d) => lower.includes(d));
}

// ---- Tests ----

describe('Insurance Response - Prohibited Language', () => {
  const insuranceQuestions = [
    'Do you accept BlueCross BlueShield?',
    'How much does vein treatment cost?',
    'Is varicose vein treatment covered by insurance?',
    'What will my out of pocket cost be?',
    'Do you accept Medicare?',
    'Do you take Medicaid?',
    'I don\'t have insurance, can I still be seen?',
    'Will my copay be expensive?',
    'What about my deductible?',
    'Is the consultation free?',
  ];

  it.each(insuranceQuestions)(
    'should not use prohibited phrases when answering: "%s"',
    (question) => {
      const response = generateInsuranceResponse(question);
      const check = containsProhibitedPhrase(response.content);
      expect(check.found).toBe(false);
    }
  );

  it('should never say "free" in any insurance context', () => {
    const freeQuestions = [
      'Is the consultation free?',
      'Are there any free treatments?',
      'Do you offer free screenings?',
    ];
    for (const q of freeQuestions) {
      const response = generateInsuranceResponse(q);
      expect(response.content.toLowerCase()).not.toContain('free');
    }
  });

  it('should never guarantee coverage', () => {
    const coverageQuestions = [
      'Will my insurance cover everything?',
      'Is it guaranteed to be covered?',
      'Do all plans cover this?',
    ];
    for (const q of coverageQuestions) {
      const response = generateInsuranceResponse(q);
      expect(response.content.toLowerCase()).not.toContain('guaranteed');
      expect(response.content.toLowerCase()).not.toContain('fully covered');
    }
  });
});

describe('Insurance Response - Required Disclaimers', () => {
  it('should include a coverage disclaimer for general coverage questions', () => {
    const response = generateInsuranceResponse('Is vein treatment covered?');
    expect(containsRequiredDisclaimer(response.content)).toBe(true);
  });

  it('should include a disclaimer for cost questions', () => {
    const response = generateInsuranceResponse('How much will it cost?');
    expect(containsRequiredDisclaimer(response.content)).toBe(true);
  });

  it('should include a disclaimer for provider acceptance questions', () => {
    const response = generateInsuranceResponse('Do you take Aetna?');
    expect(containsRequiredDisclaimer(response.content)).toBe(true);
  });
});

describe('Insurance Response - Suggested Actions', () => {
  it('should suggest coverage verification for coverage questions', () => {
    const response = generateInsuranceResponse('Is this covered by my insurance?');
    expect(response.suggestedAction).toBe('verify_coverage');
  });

  it('should suggest consultation for uninsured patients', () => {
    const response = generateInsuranceResponse("I don't have insurance");
    expect(response.suggestedAction).toBe('schedule_consultation');
  });

  it('should suggest coverage verification for cost questions', () => {
    const response = generateInsuranceResponse('How much will my copay be?');
    expect(response.suggestedAction).toBe('verify_coverage');
  });
});

describe('Insurance Response - Tone and Empathy', () => {
  it('should be empathetic for uninsured patients', () => {
    const response = generateInsuranceResponse("I don't have insurance");
    expect(response.content.toLowerCase()).toContain('understand');
    expect(response.content.toLowerCase()).not.toContain('unfortunately');
  });

  it('should offer help proactively', () => {
    const response = generateInsuranceResponse('What about my coverage?');
    const helpPhrases = ['would you like', 'our team can', 'we can help', 'help verify'];
    const containsHelp = helpPhrases.some((p) =>
      response.content.toLowerCase().includes(p)
    );
    expect(containsHelp).toBe(true);
  });

  it('should not use alarming or negative language', () => {
    const alarmingPhrases = ['unfortunately', 'sorry to say', 'bad news', 'denied', 'rejected'];
    const questions = [
      'Will my insurance pay for this?',
      'I have a high deductible plan',
      "I'm worried about the cost",
    ];
    for (const q of questions) {
      const response = generateInsuranceResponse(q);
      for (const phrase of alarmingPhrases) {
        expect(response.content.toLowerCase()).not.toContain(phrase);
      }
    }
  });
});
