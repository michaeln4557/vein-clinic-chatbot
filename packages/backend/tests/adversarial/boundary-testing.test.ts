/**
 * Boundary Testing
 *
 * Tests edge cases: empty messages, very long messages, special characters,
 * emoji, rapid consecutive messages, and HTML/script injection attempts.
 */

// ---- Types ----

interface MessageValidation {
  valid: boolean;
  sanitized: string;
  warnings: string[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

// ---- Message validator ----

function validateMessage(input: string): MessageValidation {
  const warnings: string[] = [];

  // Empty message
  if (!input || input.trim().length === 0) {
    return {
      valid: false,
      sanitized: '',
      warnings: ['Empty message received'],
    };
  }

  // Length limit (5000 characters)
  const MAX_LENGTH = 5000;
  let sanitized = input;
  if (input.length > MAX_LENGTH) {
    sanitized = input.substring(0, MAX_LENGTH);
    warnings.push(`Message truncated from ${input.length} to ${MAX_LENGTH} characters`);
  }

  // Strip HTML/script tags
  const htmlPattern = /<[^>]*>/g;
  if (htmlPattern.test(sanitized)) {
    sanitized = sanitized.replace(htmlPattern, '');
    warnings.push('HTML tags stripped from message');
  }

  // Strip script content
  const scriptPattern = /<script[\s\S]*?<\/script>/gi;
  if (scriptPattern.test(sanitized)) {
    sanitized = sanitized.replace(scriptPattern, '');
    warnings.push('Script content removed from message');
  }

  // Neutralize common XSS payloads
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '');

  // Strip null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize whitespace (collapse multiple spaces, trim)
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return {
    valid: sanitized.length > 0,
    sanitized,
    warnings,
  };
}

// ---- Rate limiter ----

class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(sessionId: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.timestamps.get(sessionId) || [];

    // Remove expired timestamps
    const active = timestamps.filter((t) => now - t < this.windowMs);

    if (active.length >= this.maxRequests) {
      const oldestActive = active[0];
      const retryAfterMs = this.windowMs - (now - oldestActive);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }

    active.push(now);
    this.timestamps.set(sessionId, active);

    return {
      allowed: true,
      remaining: this.maxRequests - active.length,
    };
  }

  reset(sessionId: string): void {
    this.timestamps.delete(sessionId);
  }
}

// ---- Tests ----

describe('Empty Message Handling', () => {
  it('should reject empty string', () => {
    const result = validateMessage('');
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain('Empty message received');
  });

  it('should reject whitespace-only message', () => {
    const result = validateMessage('   \t\n  ');
    expect(result.valid).toBe(false);
  });

  it('should reject null-byte-only message', () => {
    const result = validateMessage('\0\0\0');
    expect(result.valid).toBe(false);
  });

  it('should accept message with leading/trailing whitespace', () => {
    const result = validateMessage('  Hello  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Hello');
  });
});

describe('Very Long Messages (>5000 chars)', () => {
  it('should truncate messages exceeding 5000 characters', () => {
    const longMessage = 'a'.repeat(6000);
    const result = validateMessage(longMessage);
    expect(result.valid).toBe(true);
    expect(result.sanitized.length).toBeLessThanOrEqual(5000);
    expect(result.warnings.some((w) => w.includes('truncated'))).toBe(true);
  });

  it('should preserve content up to the limit', () => {
    const message = 'Hello '.repeat(1000); // 6000 chars
    const result = validateMessage(message);
    expect(result.sanitized.length).toBeLessThanOrEqual(5000);
    expect(result.sanitized.startsWith('Hello')).toBe(true);
  });

  it('should handle exactly 5000 characters', () => {
    const message = 'x'.repeat(5000);
    const result = validateMessage(message);
    expect(result.valid).toBe(true);
    expect(result.sanitized.length).toBe(5000);
    expect(result.warnings.some((w) => w.includes('truncated'))).toBe(false);
  });

  it('should handle 4999 characters without truncation', () => {
    const message = 'x'.repeat(4999);
    const result = validateMessage(message);
    expect(result.valid).toBe(true);
    expect(result.sanitized.length).toBe(4999);
  });
});

describe('Special Characters and Emoji', () => {
  it('should accept emoji in messages', () => {
    const result = validateMessage('I need help with my veins please');
    expect(result.valid).toBe(true);
  });

  it('should accept common special characters', () => {
    const result = validateMessage("I'm at Dr. Smith's office (Room #3) - can you help?");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toContain("Dr. Smith's");
  });

  it('should accept unicode characters', () => {
    const result = validateMessage('My name is Jose Garcia');
    expect(result.valid).toBe(true);
  });

  it('should accept phone number formats', () => {
    const result = validateMessage('Call me at (555) 234-5678 or +1-555-234-5678');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toContain('(555) 234-5678');
  });

  it('should accept email addresses', () => {
    const result = validateMessage('My email is patient@example.com');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toContain('patient@example.com');
  });

  it('should handle multiple consecutive emoji', () => {
    const result = validateMessage('Thank you so much!!!');
    expect(result.valid).toBe(true);
  });

  it('should handle messages with only special characters', () => {
    const result = validateMessage('???!!!...');
    expect(result.valid).toBe(true);
  });
});

describe('HTML/Script Injection', () => {
  it('should strip basic HTML tags', () => {
    const result = validateMessage('<b>Hello</b> I need <i>help</i>');
    expect(result.valid).toBe(true);
    expect(result.sanitized).not.toContain('<b>');
    expect(result.sanitized).not.toContain('<i>');
    expect(result.sanitized).toContain('Hello');
    expect(result.sanitized).toContain('help');
  });

  it('should strip script tags', () => {
    const result = validateMessage('Hello <script>alert("xss")</script> world');
    expect(result.valid).toBe(true);
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).not.toContain('alert');
  });

  it('should strip img tags with onerror handlers', () => {
    const result = validateMessage('<img src=x onerror=alert(1)>');
    expect(result.valid).toBe(false); // After stripping, nothing remains
  });

  it('should neutralize javascript: protocol', () => {
    const result = validateMessage('Check this link: javascript:alert(document.cookie)');
    expect(result.sanitized).not.toContain('javascript:');
  });

  it('should neutralize event handlers', () => {
    const result = validateMessage('Hello onmouseover=alert(1) there');
    expect(result.sanitized).not.toMatch(/on\w+\s*=/i);
  });

  it('should strip nested HTML', () => {
    const result = validateMessage('<div><p><a href="javascript:void(0)">Click</a></p></div>');
    expect(result.sanitized).not.toContain('<div>');
    expect(result.sanitized).not.toContain('<a');
  });

  it('should handle encoded HTML entities gracefully', () => {
    const result = validateMessage('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result.valid).toBe(true);
    // HTML entities are not tags and should pass through
    expect(result.sanitized).toContain('&lt;');
  });

  it('should strip data URI schemes', () => {
    const result = validateMessage('data:text/html,<script>alert(1)</script>');
    expect(result.sanitized).not.toContain('data:text/html');
  });

  it('should remove null bytes', () => {
    const result = validateMessage('Hello\0World');
    expect(result.sanitized).not.toContain('\0');
    expect(result.sanitized).toContain('HelloWorld');
  });
});

describe('Rapid Consecutive Messages (Rate Limiting)', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(5, 10_000); // 5 messages per 10 seconds
  });

  it('should allow messages within the rate limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('session-1');
      expect(result.allowed).toBe(true);
    }
  });

  it('should block messages exceeding the rate limit', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('session-1');
    }
    const result = limiter.check('session-1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeDefined();
    expect(result.retryAfterMs!).toBeGreaterThan(0);
  });

  it('should track remaining requests', () => {
    const r1 = limiter.check('session-1');
    expect(r1.remaining).toBe(4);

    const r2 = limiter.check('session-1');
    expect(r2.remaining).toBe(3);
  });

  it('should track sessions independently', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('session-1');
    }

    const result1 = limiter.check('session-1');
    expect(result1.allowed).toBe(false);

    const result2 = limiter.check('session-2');
    expect(result2.allowed).toBe(true);
  });

  it('should reset rate limit for a session', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('session-1');
    }
    expect(limiter.check('session-1').allowed).toBe(false);

    limiter.reset('session-1');
    expect(limiter.check('session-1').allowed).toBe(true);
  });
});

describe('Combined Edge Cases', () => {
  it('should handle empty string after HTML stripping', () => {
    const result = validateMessage('<script></script>');
    expect(result.valid).toBe(false);
  });

  it('should handle message that is all whitespace after sanitization', () => {
    const result = validateMessage('<b>  </b>');
    expect(result.valid).toBe(false);
  });

  it('should handle extremely long HTML injection attempt', () => {
    const longScript = '<script>' + 'x'.repeat(10000) + '</script>';
    const result = validateMessage(longScript);
    expect(result.sanitized).not.toContain('<script>');
  });

  it('should handle mixed legitimate content and injection', () => {
    const result = validateMessage(
      'My name is Sarah <script>alert("xss")</script> and I need an appointment'
    );
    expect(result.valid).toBe(true);
    expect(result.sanitized).toContain('Sarah');
    expect(result.sanitized).toContain('appointment');
    expect(result.sanitized).not.toContain('<script>');
  });

  it('should handle newlines and tabs in messages', () => {
    const result = validateMessage('Line 1\nLine 2\tTabbed');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Line 1 Line 2 Tabbed');
  });

  it('should handle repeated special characters', () => {
    const result = validateMessage('!!!!!??????.......,,,,,,');
    expect(result.valid).toBe(true);
  });
});
