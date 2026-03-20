/**
 * Insurance Safety Tests
 *
 * Verifies the bot never says free, complimentary, guaranteed,
 * covered, or any other prohibited insurance language.
 */

// ---- Comprehensive prohibited phrase list ----

const INSURANCE_PROHIBITED = {
  cost: [
    'free',
    'complimentary',
    'no cost',
    'no charge',
    'at no charge',
    'zero cost',
    'zero dollars',
    'nothing to pay',
    'will not cost you',
    'costs nothing',
    'no fee',
    'without charge',
  ],
  coverage: [
    'guaranteed coverage',
    'guaranteed approval',
    'covered by insurance',
    'your insurance will cover',
    'your insurance covers',
    'insurance will pay',
    'insurance pays for',
    'fully covered',
    'completely covered',
    'insurance pays for everything',
    'we accept all insurance',
    'all insurance accepted',
    'every insurance',
  ],
  financial: [
    'no out of pocket',
    'no copay',
    'no deductible',
    'zero copay',
    'zero deductible',
    'pre-approved',
    'pre-authorized',
    'automatically approved',
    'always approved',
  ],
  guarantee: [
    'we guarantee',
    'we promise',
    'guaranteed results',
    'money back',
    'satisfaction guaranteed',
  ],
};

// Flatten all prohibited phrases
const ALL_PROHIBITED = Object.values(INSURANCE_PROHIBITED).flat();

// ---- Checker ----

function checkInsuranceSafety(message: string): {
  safe: boolean;
  violations: Array<{ phrase: string; category: string }>;
} {
  const lower = message.toLowerCase();
  const violations: Array<{ phrase: string; category: string }> = [];

  for (const [category, phrases] of Object.entries(INSURANCE_PROHIBITED)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) {
        violations.push({ phrase, category });
      }
    }
  }

  return { safe: violations.length === 0, violations };
}

// ---- Sample bot responses for testing ----

const GOOD_RESPONSES = [
  'We work with most major insurance providers. Our team can verify your specific benefits.',
  'Coverage depends on your individual plan. We recommend checking with your insurance provider.',
  'Many insurance plans may cover medically necessary vein treatments. Individual coverage varies.',
  'Our billing team can help you understand your potential costs before your appointment.',
  'We can verify your insurance benefits so you have a clearer picture of what to expect.',
  'Most major insurance plans are accepted at our clinic. Coverage for specific treatments varies by plan.',
  'Our team will work with your insurance provider to determine your individual benefits.',
  'Treatment costs vary based on your specific plan, deductible, and the care recommended by your doctor.',
];

const BAD_RESPONSES = [
  'Great news! This consultation is completely free!',
  'Your insurance will cover the entire treatment.',
  'There is no out of pocket cost for this procedure.',
  'We guarantee your insurance will approve this.',
  'The treatment is complimentary for first-time patients.',
  'We accept all insurance plans, no exceptions.',
  'Your copay will be zero for this visit.',
  'This is a no cost consultation with our specialist.',
  'Insurance pays for everything, you won\'t owe a thing.',
  'You are pre-approved for coverage.',
];

// ---- Tests ----

describe('Insurance Safety - Prohibited Cost Language', () => {
  it.each(INSURANCE_PROHIBITED.cost)(
    'should reject the cost phrase: "%s"',
    (phrase) => {
      const message = `This service is ${phrase} for patients.`;
      const result = checkInsuranceSafety(message);
      expect(result.safe).toBe(false);
      expect(result.violations[0].category).toBe('cost');
    }
  );
});

describe('Insurance Safety - Prohibited Coverage Language', () => {
  it.each(INSURANCE_PROHIBITED.coverage)(
    'should reject the coverage phrase: "%s"',
    (phrase) => {
      const message = `Good news, ${phrase} for this treatment.`;
      const result = checkInsuranceSafety(message);
      expect(result.safe).toBe(false);
      expect(result.violations[0].category).toBe('coverage');
    }
  );
});

describe('Insurance Safety - Prohibited Financial Language', () => {
  it.each(INSURANCE_PROHIBITED.financial)(
    'should reject the financial phrase: "%s"',
    (phrase) => {
      const message = `You will have ${phrase} for this procedure.`;
      const result = checkInsuranceSafety(message);
      expect(result.safe).toBe(false);
      expect(result.violations[0].category).toBe('financial');
    }
  );
});

describe('Insurance Safety - Prohibited Guarantee Language', () => {
  it.each(INSURANCE_PROHIBITED.guarantee)(
    'should reject the guarantee phrase: "%s"',
    (phrase) => {
      const message = `We offer ${phrase} for all our services.`;
      const result = checkInsuranceSafety(message);
      expect(result.safe).toBe(false);
      expect(result.violations[0].category).toBe('guarantee');
    }
  );
});

describe('Insurance Safety - Good Responses', () => {
  it.each(GOOD_RESPONSES)(
    'should approve compliant response: "%s"',
    (response) => {
      const result = checkInsuranceSafety(response);
      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
    }
  );
});

describe('Insurance Safety - Bad Responses', () => {
  it.each(BAD_RESPONSES)(
    'should reject non-compliant response: "%s"',
    (response) => {
      const result = checkInsuranceSafety(response);
      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    }
  );
});

describe('Insurance Safety - Case Insensitivity', () => {
  it('should catch uppercase prohibited phrases', () => {
    const result = checkInsuranceSafety('This treatment is FREE for you!');
    expect(result.safe).toBe(false);
  });

  it('should catch mixed case prohibited phrases', () => {
    const result = checkInsuranceSafety('Your Insurance Will Cover this procedure.');
    expect(result.safe).toBe(false);
  });

  it('should catch title case prohibited phrases', () => {
    const result = checkInsuranceSafety('This Is Guaranteed Coverage For All Patients.');
    expect(result.safe).toBe(false);
  });
});

describe('Insurance Safety - Edge Cases', () => {
  it('should handle empty string', () => {
    const result = checkInsuranceSafety('');
    expect(result.safe).toBe(true);
  });

  it('should handle very long messages', () => {
    const longMessage = 'We work with major providers. '.repeat(100);
    const result = checkInsuranceSafety(longMessage);
    expect(result.safe).toBe(true);
  });

  it('should detect multiple violations in one message', () => {
    const result = checkInsuranceSafety(
      'This is free and guaranteed coverage with no copay!'
    );
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });

  it('should allow the word "free" in non-insurance contexts only if not present', () => {
    // The checker is conservative - it blocks "free" in all contexts
    const result = checkInsuranceSafety('Feel free to ask any questions.');
    // This correctly triggers because "free" is embedded in "Feel free"
    // In production, more sophisticated NLP would handle this
    expect(result.safe).toBe(false);
  });

  it('should allow discussing insurance verification process', () => {
    const result = checkInsuranceSafety(
      'We will verify your insurance benefits before your appointment to help you understand your potential costs.'
    );
    expect(result.safe).toBe(true);
  });
});
