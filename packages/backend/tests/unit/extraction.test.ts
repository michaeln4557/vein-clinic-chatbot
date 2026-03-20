/**
 * Field Extraction Tests
 *
 * Tests extraction of patient information from messages,
 * normalization (dates, phone numbers, names), and confidence scoring.
 */

// ---- Types ----

interface ExtractionResult {
  field: string;
  value: string;
  rawValue: string;
  confidence: number;
}

interface NormalizationResult {
  normalized: string;
  valid: boolean;
}

// ---- Extraction implementations ----

function extractPhoneNumber(text: string): ExtractionResult | null {
  // Match various US phone formats
  const patterns = [
    /\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})/,
    /(\d{3})[-.\s](\d{3})[-.\s](\d{4})/,
    /(\d{10})/,
    /\+1\s*(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const digits = match[0].replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
      if (digits.length === 10) {
        const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        return {
          field: 'phone',
          value: formatted,
          rawValue: match[0],
          confidence: 0.95,
        };
      }
    }
  }
  return null;
}

function extractName(text: string): ExtractionResult | null {
  // Common patterns: "my name is X", "I'm X", "this is X"
  const patterns = [
    /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Normalize: capitalize each word
      const normalized = name
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return {
        field: 'name',
        value: normalized,
        rawValue: match[1],
        confidence: pattern === patterns[0] ? 0.9 : 0.7,
      };
    }
  }
  return null;
}

function extractDate(text: string): ExtractionResult | null {
  const patterns: Array<{ regex: RegExp; parse: (m: RegExpMatchArray) => string | null }> = [
    {
      // MM/DD/YYYY or MM-DD-YYYY
      regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      parse: (m) => {
        const month = m[1].padStart(2, '0');
        const day = m[2].padStart(2, '0');
        return `${m[3]}-${month}-${day}`;
      },
    },
    {
      // "March 15, 2026" or "March 15 2026"
      regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})/i,
      parse: (m) => {
        const months: Record<string, string> = {
          january: '01', february: '02', march: '03', april: '04',
          may: '05', june: '06', july: '07', august: '08',
          september: '09', october: '10', november: '11', december: '12',
        };
        const month = months[m[1].toLowerCase()];
        const day = m[2].padStart(2, '0');
        return month ? `${m[3]}-${month}-${day}` : null;
      },
    },
    {
      // "next Monday", "next week" — simplified
      regex: /next\s+(monday|tuesday|wednesday|thursday|friday)/i,
      parse: () => {
        // Returns placeholder — real implementation would compute actual date
        return '2026-03-23';
      },
    },
  ];

  for (const { regex, parse } of patterns) {
    const match = text.match(regex);
    if (match) {
      const dateStr = parse(match);
      if (dateStr) {
        return {
          field: 'preferredDate',
          value: dateStr,
          rawValue: match[0],
          confidence: 0.85,
        };
      }
    }
  }
  return null;
}

function extractEmail(text: string): ExtractionResult | null {
  const match = text.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  if (match) {
    return {
      field: 'email',
      value: match[1].toLowerCase(),
      rawValue: match[1],
      confidence: 0.95,
    };
  }
  return null;
}

function extractDateOfBirth(text: string): ExtractionResult | null {
  const patterns = [
    /(?:born|birthday|dob|date of birth)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /(?:born|birthday|dob|date of birth)[:\s]*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Simplified — delegate to extractDate for parsing
      const dateResult = extractDate(match[0]);
      if (dateResult) {
        return { ...dateResult, field: 'dateOfBirth', confidence: 0.9 };
      }
    }
  }
  return null;
}

function normalizePhone(raw: string): NormalizationResult {
  const digits = raw.replace(/\D/g, '');
  const cleaned = digits.replace(/^1(\d{10})$/, '$1');
  if (cleaned.length !== 10) {
    return { normalized: raw, valid: false };
  }
  return {
    normalized: `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`,
    valid: true,
  };
}

function normalizeName(raw: string): NormalizationResult {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 2) {
    return { normalized: raw, valid: false };
  }
  const normalized = trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return { normalized, valid: true };
}

// ---- Tests ----

describe('Phone Number Extraction', () => {
  it('should extract (XXX) XXX-XXXX format', () => {
    const result = extractPhoneNumber('My number is (555) 123-4567');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('(555) 123-4567');
    expect(result!.confidence).toBeGreaterThan(0.9);
  });

  it('should extract XXX-XXX-XXXX format', () => {
    const result = extractPhoneNumber('Call me at 555-123-4567');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('(555) 123-4567');
  });

  it('should extract XXX.XXX.XXXX format', () => {
    const result = extractPhoneNumber('555.123.4567');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('(555) 123-4567');
  });

  it('should extract 10-digit continuous format', () => {
    const result = extractPhoneNumber('my phone is 5551234567');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('(555) 123-4567');
  });

  it('should extract +1 format', () => {
    const result = extractPhoneNumber('You can reach me at +1 555-123-4567');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('(555) 123-4567');
  });

  it('should return null for invalid phone numbers', () => {
    expect(extractPhoneNumber('My number is 123')).toBeNull();
    expect(extractPhoneNumber('No phone here')).toBeNull();
  });

  it('should return null for too few digits', () => {
    expect(extractPhoneNumber('Call 555-1234')).toBeNull();
  });
});

describe('Name Extraction', () => {
  it('should extract name from "my name is" pattern', () => {
    const result = extractName('My name is Jane Smith');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('Jane Smith');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('should extract name from "I\'m" pattern', () => {
    const result = extractName("Hi, I'm John Doe");
    expect(result).not.toBeNull();
    expect(result!.value).toBe('John Doe');
  });

  it('should normalize case', () => {
    const result = extractName('my name is JANE SMITH');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('Jane Smith');
  });

  it('should handle three-part names', () => {
    const result = extractName('My name is Mary Jane Watson');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('Mary Jane Watson');
  });

  it('should return null when no name pattern found', () => {
    expect(extractName('I want to book an appointment')).toBeNull();
  });
});

describe('Date Extraction', () => {
  it('should extract MM/DD/YYYY format', () => {
    const result = extractDate('How about 03/15/2026?');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('2026-03-15');
  });

  it('should extract MM-DD-YYYY format', () => {
    const result = extractDate('Prefer 04-01-2026');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('2026-04-01');
  });

  it('should extract month name format', () => {
    const result = extractDate('I prefer March 15, 2026');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('2026-03-15');
  });

  it('should extract month name without comma', () => {
    const result = extractDate('April 1 2026 works');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('2026-04-01');
  });

  it('should handle relative dates like "next Monday"', () => {
    const result = extractDate('Can I come in next Monday?');
    expect(result).not.toBeNull();
    expect(result!.field).toBe('preferredDate');
  });

  it('should return null when no date found', () => {
    expect(extractDate('Sometime soon would be nice')).toBeNull();
  });
});

describe('Email Extraction', () => {
  it('should extract a standard email', () => {
    const result = extractEmail('My email is jane.smith@example.com');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('jane.smith@example.com');
  });

  it('should normalize email to lowercase', () => {
    const result = extractEmail('Email: Jane.Smith@Example.COM');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('jane.smith@example.com');
  });

  it('should handle emails with plus addressing', () => {
    const result = extractEmail('Use jane+clinic@example.com');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('jane+clinic@example.com');
  });

  it('should return null for invalid emails', () => {
    expect(extractEmail('not an email')).toBeNull();
    expect(extractEmail('missing@')).toBeNull();
  });
});

describe('Phone Normalization', () => {
  it('should normalize various formats to standard form', () => {
    expect(normalizePhone('5551234567')).toEqual({
      normalized: '(555) 123-4567',
      valid: true,
    });
    expect(normalizePhone('(555) 123-4567')).toEqual({
      normalized: '(555) 123-4567',
      valid: true,
    });
    expect(normalizePhone('15551234567')).toEqual({
      normalized: '(555) 123-4567',
      valid: true,
    });
  });

  it('should reject too-short numbers', () => {
    expect(normalizePhone('555123').valid).toBe(false);
  });

  it('should reject too-long numbers', () => {
    expect(normalizePhone('555123456789').valid).toBe(false);
  });
});

describe('Name Normalization', () => {
  it('should capitalize each word', () => {
    expect(normalizeName('jane doe')).toEqual({
      normalized: 'Jane Doe',
      valid: true,
    });
  });

  it('should handle all-caps', () => {
    expect(normalizeName('JANE DOE')).toEqual({
      normalized: 'Jane Doe',
      valid: true,
    });
  });

  it('should trim whitespace', () => {
    expect(normalizeName('  Jane Doe  ')).toEqual({
      normalized: 'Jane Doe',
      valid: true,
    });
  });

  it('should reject empty or single-char names', () => {
    expect(normalizeName('').valid).toBe(false);
    expect(normalizeName('J').valid).toBe(false);
  });
});

describe('Confidence Scoring', () => {
  it('should assign higher confidence to explicit patterns', () => {
    const explicit = extractName('My name is Jane Smith');
    const standalone = extractName('Jane Smith');
    expect(explicit!.confidence).toBeGreaterThan(standalone!.confidence);
  });

  it('should assign high confidence to well-formatted phone numbers', () => {
    const result = extractPhoneNumber('(555) 123-4567');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('should assign high confidence to email addresses', () => {
    const result = extractEmail('test@example.com');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
