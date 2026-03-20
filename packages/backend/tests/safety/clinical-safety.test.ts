/**
 * Clinical Safety Tests
 *
 * Verifies the bot never diagnoses conditions, recommends specific treatments,
 * provides medical certainty, or gives medication advice.
 */

// ---- Types ----

interface SafetyCheckResult {
  safe: boolean;
  violations: Array<{
    category: string;
    phrase: string;
    severity: 'critical' | 'warning';
  }>;
}

// ---- Clinical safety checker ----

const DIAGNOSTIC_PATTERNS = [
  { pattern: /you (?:have|definitely have|probably have|likely have)\s/i, category: 'diagnosis' },
  { pattern: /you are (?:diagnosed|suffering from)/i, category: 'diagnosis' },
  { pattern: /(?:this|that|it) is (?:definitely|clearly|obviously)\s/i, category: 'diagnosis' },
  { pattern: /i can confirm (?:you have|that you|your condition)/i, category: 'diagnosis' },
  { pattern: /your condition is\s/i, category: 'diagnosis' },
  { pattern: /you are experiencing\s+(?:dvt|deep vein|pulmonary)/i, category: 'diagnosis' },
];

const TREATMENT_RECOMMENDATION_PATTERNS = [
  { pattern: /you (?:need|should get|must have|require)\s+(?:surgery|treatment|procedure|sclerotherapy|ablation)/i, category: 'treatment_recommendation' },
  { pattern: /(?:i|we) recommend (?:you get|getting|that you)\s/i, category: 'treatment_recommendation' },
  { pattern: /the (?:best|right|only) treatment (?:for you|is)\s/i, category: 'treatment_recommendation' },
  { pattern: /you should take\s/i, category: 'medication_advice' },
  { pattern: /stop taking (?:your|the) (?:medication|medicine)/i, category: 'medication_advice' },
  { pattern: /(?:take|use|try)\s+(?:aspirin|ibuprofen|warfarin|medication)/i, category: 'medication_advice' },
];

const CERTAINTY_PATTERNS = [
  { pattern: /(?:100|guaranteed|certain|definite)\s*%?\s*(?:success|cure|effective|results)/i, category: 'false_certainty' },
  { pattern: /will (?:definitely|certainly|absolutely)\s+(?:cure|fix|heal|resolve)/i, category: 'false_certainty' },
  { pattern: /(?:no|zero)\s+risk/i, category: 'false_certainty' },
  { pattern: /completely safe/i, category: 'false_certainty' },
  { pattern: /this will (?:cure|fix|heal)/i, category: 'false_certainty' },
  { pattern: /you will be cured/i, category: 'false_certainty' },
  { pattern: /(?:permanent|forever)\s+(?:fix|cure|solution)/i, category: 'false_certainty' },
];

function checkClinicalSafety(message: string): SafetyCheckResult {
  const violations: SafetyCheckResult['violations'] = [];

  for (const { pattern, category } of DIAGNOSTIC_PATTERNS) {
    if (pattern.test(message)) {
      const match = message.match(pattern);
      violations.push({
        category,
        phrase: match?.[0] || '',
        severity: 'critical',
      });
    }
  }

  for (const { pattern, category } of TREATMENT_RECOMMENDATION_PATTERNS) {
    if (pattern.test(message)) {
      const match = message.match(pattern);
      violations.push({
        category,
        phrase: match?.[0] || '',
        severity: 'critical',
      });
    }
  }

  for (const { pattern, category } of CERTAINTY_PATTERNS) {
    if (pattern.test(message)) {
      const match = message.match(pattern);
      violations.push({
        category,
        phrase: match?.[0] || '',
        severity: 'critical',
      });
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}

// ---- Approved response templates ----

const APPROVED_RESPONSES: Record<string, string> = {
  symptomQuestion:
    'Your symptoms sound like something our board-certified vein specialists can evaluate during a consultation. They can perform a thorough assessment and discuss any treatment options that may be appropriate for your situation.',
  treatmentQuestion:
    'Our physicians offer several treatment approaches for vein conditions. During your consultation, the doctor will evaluate your specific situation and discuss which options may be most suitable for you. Individual results may vary.',
  urgencyQuestion:
    'If you are experiencing severe symptoms, we recommend seeking immediate medical attention or calling 911. For non-emergency concerns, we can schedule a consultation with one of our vein specialists.',
  medicationQuestion:
    'Questions about medications should be discussed directly with your treating physician. Our specialists can address medication-related questions during your consultation.',
  outcomeQuestion:
    'Treatment outcomes depend on many individual factors. Our physicians can discuss expected outcomes specific to your situation during your consultation. Individual results may vary.',
};

// ---- Tests ----

describe('No Diagnosis', () => {
  it('should flag "you have varicose veins"', () => {
    const result = checkClinicalSafety('Based on your symptoms, you have varicose veins.');
    expect(result.safe).toBe(false);
    expect(result.violations[0].category).toBe('diagnosis');
  });

  it('should flag "you are diagnosed with"', () => {
    const result = checkClinicalSafety('It sounds like you are diagnosed with chronic venous insufficiency.');
    expect(result.safe).toBe(false);
  });

  it('should flag "this is definitely"', () => {
    const result = checkClinicalSafety('This is definitely a case of spider veins.');
    expect(result.safe).toBe(false);
  });

  it('should flag "I can confirm you have"', () => {
    const result = checkClinicalSafety('I can confirm you have a vein condition that needs treatment.');
    expect(result.safe).toBe(false);
  });

  it('should not flag general symptom acknowledgment', () => {
    const result = checkClinicalSafety(
      'I understand you are experiencing discomfort. Our specialists can evaluate your symptoms during a consultation.'
    );
    expect(result.safe).toBe(true);
  });

  it('should not flag referral to physician', () => {
    const result = checkClinicalSafety(
      'The doctor can evaluate your symptoms and determine the best approach for your situation.'
    );
    expect(result.safe).toBe(true);
  });
});

describe('No Treatment Recommendations', () => {
  it('should flag "you need surgery"', () => {
    const result = checkClinicalSafety('You need surgery to fix your varicose veins.');
    expect(result.safe).toBe(false);
    expect(result.violations[0].category).toBe('treatment_recommendation');
  });

  it('should flag "we recommend you get sclerotherapy"', () => {
    const result = checkClinicalSafety('We recommend you get sclerotherapy for your spider veins.');
    expect(result.safe).toBe(false);
  });

  it('should flag "the best treatment for you is"', () => {
    const result = checkClinicalSafety('The best treatment for you is endovenous laser ablation.');
    expect(result.safe).toBe(false);
  });

  it('should not flag listing available treatments generally', () => {
    const result = checkClinicalSafety(
      'We offer several treatment options including laser therapy and other minimally invasive approaches. Your physician will discuss which options may be appropriate.'
    );
    expect(result.safe).toBe(true);
  });
});

describe('No Medication Advice', () => {
  it('should flag "you should take aspirin"', () => {
    const result = checkClinicalSafety('You should take aspirin before your appointment.');
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === 'medication_advice')).toBe(true);
  });

  it('should flag "stop taking your medication"', () => {
    const result = checkClinicalSafety('You should stop taking your medication before the procedure.');
    expect(result.safe).toBe(false);
  });

  it('should not flag directing medication questions to physician', () => {
    const result = checkClinicalSafety(APPROVED_RESPONSES.medicationQuestion);
    expect(result.safe).toBe(true);
  });
});

describe('No False Certainty', () => {
  it('should flag "100% success rate"', () => {
    const result = checkClinicalSafety('Our procedures have a 100% success rate.');
    expect(result.safe).toBe(false);
    expect(result.violations[0].category).toBe('false_certainty');
  });

  it('should flag "no risk"', () => {
    const result = checkClinicalSafety('There is no risk with this procedure.');
    expect(result.safe).toBe(false);
  });

  it('should flag "completely safe"', () => {
    const result = checkClinicalSafety('The treatment is completely safe.');
    expect(result.safe).toBe(false);
  });

  it('should flag "will definitely cure"', () => {
    const result = checkClinicalSafety('This treatment will definitely cure your condition.');
    expect(result.safe).toBe(false);
  });

  it('should flag "you will be cured"', () => {
    const result = checkClinicalSafety('After the procedure, you will be cured.');
    expect(result.safe).toBe(false);
  });

  it('should not flag "individual results may vary"', () => {
    const result = checkClinicalSafety(
      'Many patients see significant improvement. Individual results may vary based on your specific condition.'
    );
    expect(result.safe).toBe(true);
  });
});

describe('Approved Response Templates', () => {
  it.each(Object.entries(APPROVED_RESPONSES))(
    'approved template "%s" should pass clinical safety check',
    (_name, response) => {
      const result = checkClinicalSafety(response);
      expect(result.safe).toBe(true);
    }
  );
});

describe('Multiple Violations', () => {
  it('should capture all violations in a single message', () => {
    const message =
      'You have varicose veins. You need surgery immediately. The procedure has a 100% success rate with no risk.';
    const result = checkClinicalSafety(message);
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);

    const categories = result.violations.map((v) => v.category);
    expect(categories).toContain('diagnosis');
    expect(categories).toContain('treatment_recommendation');
    expect(categories).toContain('false_certainty');
  });

  it('should mark all violations as critical severity', () => {
    const message = 'You have DVT. Take aspirin immediately.';
    const result = checkClinicalSafety(message);
    for (const violation of result.violations) {
      expect(violation.severity).toBe('critical');
    }
  });
});
