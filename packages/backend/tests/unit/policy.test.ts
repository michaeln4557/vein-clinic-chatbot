/**
 * Policy Enforcement Tests
 *
 * Tests insurance policy enforcement (blocked phrases),
 * clinical safety rules, and phrase checking.
 */

// ---- Blocked phrase lists ----

const INSURANCE_BLOCKED_PHRASES = [
  'free',
  'complimentary',
  'no cost',
  'guaranteed coverage',
  'covered by insurance',
  'your insurance will cover',
  'we accept all insurance',
  'no out of pocket',
  'zero cost',
  'at no charge',
  'fully covered',
  'insurance pays for everything',
  'guaranteed approval',
  'pre-approved',
];

const CLINICAL_BLOCKED_PHRASES = [
  'you have',
  'you are diagnosed with',
  'this is definitely',
  'you need surgery',
  'your condition is',
  'i can confirm you have',
  'the treatment will cure',
  'guaranteed results',
  'you will be cured',
  '100% effective',
  '100% success rate',
  'this will fix',
  'no risk',
  'completely safe',
  'you should take',
  'stop taking your medication',
];

const APPROVED_INSURANCE_PHRASES = [
  'many insurance plans may cover',
  'we work with most major insurance providers',
  'we can verify your coverage',
  'our team can check your benefits',
  'coverage depends on your specific plan',
  'we recommend contacting your insurance provider',
  'individual coverage may vary',
];

const APPROVED_CLINICAL_PHRASES = [
  'the doctor can evaluate',
  'during your consultation the specialist will assess',
  'our physicians can discuss treatment options',
  'individual results may vary',
  'the doctor will determine the best approach',
  'a medical evaluation is needed to assess',
];

// ---- Policy checker implementation ----

function containsBlockedPhrase(
  message: string,
  blockedList: string[]
): { blocked: boolean; matchedPhrase?: string } {
  const lower = message.toLowerCase();
  for (const phrase of blockedList) {
    if (lower.includes(phrase.toLowerCase())) {
      return { blocked: true, matchedPhrase: phrase };
    }
  }
  return { blocked: false };
}

function enforceInsurancePolicy(message: string): {
  compliant: boolean;
  violation?: string;
  matchedPhrase?: string;
} {
  const check = containsBlockedPhrase(message, INSURANCE_BLOCKED_PHRASES);
  if (check.blocked) {
    return {
      compliant: false,
      violation: 'insurance_prohibited_language',
      matchedPhrase: check.matchedPhrase,
    };
  }
  return { compliant: true };
}

function enforceClinicalPolicy(message: string): {
  compliant: boolean;
  violation?: string;
  matchedPhrase?: string;
} {
  const check = containsBlockedPhrase(message, CLINICAL_BLOCKED_PHRASES);
  if (check.blocked) {
    return {
      compliant: false,
      violation: 'clinical_prohibited_language',
      matchedPhrase: check.matchedPhrase,
    };
  }
  return { compliant: true };
}

function validateBotResponse(message: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const insuranceCheck = enforceInsurancePolicy(message);
  if (!insuranceCheck.compliant) {
    violations.push(`Insurance: "${insuranceCheck.matchedPhrase}"`);
  }
  const clinicalCheck = enforceClinicalPolicy(message);
  if (!clinicalCheck.compliant) {
    violations.push(`Clinical: "${clinicalCheck.matchedPhrase}"`);
  }
  return { valid: violations.length === 0, violations };
}

// ---- Tests ----

describe('Insurance Policy Enforcement', () => {
  describe('Blocked phrases', () => {
    it.each(INSURANCE_BLOCKED_PHRASES)(
      'should block the phrase: "%s"',
      (phrase) => {
        const message = `Good news, this treatment is ${phrase} for you.`;
        const result = enforceInsurancePolicy(message);
        expect(result.compliant).toBe(false);
        expect(result.violation).toBe('insurance_prohibited_language');
      }
    );

    it('should block phrases regardless of case', () => {
      const result = enforceInsurancePolicy('This is FREE for all patients');
      expect(result.compliant).toBe(false);
    });

    it('should block phrases embedded in longer sentences', () => {
      const result = enforceInsurancePolicy(
        'I can tell you that your insurance will cover the entire procedure without any issues.'
      );
      expect(result.compliant).toBe(false);
      expect(result.matchedPhrase).toBe('your insurance will cover');
    });

    it('should detect multiple violations (reports first found)', () => {
      const result = enforceInsurancePolicy(
        'This procedure is free and guaranteed coverage applies.'
      );
      expect(result.compliant).toBe(false);
    });
  });

  describe('Approved phrases', () => {
    it.each(APPROVED_INSURANCE_PHRASES)(
      'should allow the approved phrase: "%s"',
      (phrase) => {
        const result = enforceInsurancePolicy(phrase);
        expect(result.compliant).toBe(true);
      }
    );

    it('should allow factual insurance information', () => {
      const result = enforceInsurancePolicy(
        'We work with most major insurance providers and our team can verify your specific benefits.'
      );
      expect(result.compliant).toBe(true);
    });
  });
});

describe('Clinical Safety Policy', () => {
  describe('Blocked phrases', () => {
    it.each(CLINICAL_BLOCKED_PHRASES)(
      'should block the clinical phrase: "%s"',
      (phrase) => {
        const message = `Based on your symptoms, ${phrase}.`;
        const result = enforceClinicalPolicy(message);
        expect(result.compliant).toBe(false);
        expect(result.violation).toBe('clinical_prohibited_language');
      }
    );

    it('should block diagnostic language', () => {
      const result = enforceClinicalPolicy(
        'Based on what you described, you have varicose veins that need immediate treatment.'
      );
      expect(result.compliant).toBe(false);
    });

    it('should block treatment guarantees', () => {
      const result = enforceClinicalPolicy(
        'Our laser treatment has a 100% success rate.'
      );
      expect(result.compliant).toBe(false);
    });

    it('should block medication advice', () => {
      const result = enforceClinicalPolicy(
        'You should take aspirin before your appointment.'
      );
      expect(result.compliant).toBe(false);
    });
  });

  describe('Approved phrases', () => {
    it.each(APPROVED_CLINICAL_PHRASES)(
      'should allow the approved clinical phrase: "%s"',
      (phrase) => {
        const result = enforceClinicalPolicy(phrase);
        expect(result.compliant).toBe(true);
      }
    );

    it('should allow directing patients to physicians', () => {
      const result = enforceClinicalPolicy(
        'Our board-certified physicians can discuss your symptoms and treatment options during your consultation.'
      );
      expect(result.compliant).toBe(true);
    });
  });
});

describe('Combined Bot Response Validation', () => {
  it('should pass a fully compliant response', () => {
    const response =
      'We work with most major insurance providers. During your consultation, the doctor can evaluate your condition and discuss treatment options. Individual results may vary.';
    const result = validateBotResponse(response);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should catch insurance violation in otherwise good response', () => {
    const response =
      'Great news! This procedure is free for you. The doctor will evaluate your legs during the visit.';
    const result = validateBotResponse(response);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
    expect(result.violations.some((v) => v.includes('Insurance'))).toBe(true);
  });

  it('should catch clinical violation in otherwise good response', () => {
    const response =
      'We accept most insurance plans. Based on your description, you have deep vein issues.';
    const result = validateBotResponse(response);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('Clinical'))).toBe(true);
  });

  it('should catch both insurance and clinical violations', () => {
    const response =
      'This treatment is completely free and guaranteed results for your varicose veins.';
    const result = validateBotResponse(response);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBe(2);
  });

  it('should handle empty string', () => {
    const result = validateBotResponse('');
    expect(result.valid).toBe(true);
  });
});
