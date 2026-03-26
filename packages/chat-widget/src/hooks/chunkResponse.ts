/**
 * Response Chunking Utility
 *
 * Splits bot responses into natural texting-style message bubbles.
 *
 * CORE RULES:
 * 1. Questions ALWAYS get their own bubble
 * 2. Max 2 sentences per bubble (prefer 1)
 * 3. Split by function: acknowledgment, reassurance, instruction, question
 * 4. Trust-sensitive topics get stricter 1-sentence-per-bubble splitting
 * 5. Max 3 bubbles per turn (merge tail if needed)
 * 6. Never alter script order or logic
 */

const STRUCTURED_BLOCK_MARKERS = [
  'Appointment Confirmation',
  'Patient:',
];

const TRUST_SENSITIVE_KEYWORDS = [
  'insurance', 'coverage', 'benefits', 'verify', 'plan',
  'cost', 'covered', 'confirm', 'reconfirm', 'callback',
  'follow up', 'surprises', 'expect',
];

function isStructuredBlock(text: string): boolean {
  return STRUCTURED_BLOCK_MARKERS.some((marker) => text.includes(marker));
}

function isTrustSensitive(text: string): boolean {
  const lower = text.toLowerCase();
  return TRUST_SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

function isQuestion(s: string): boolean {
  return /\?\s*$/.test(s.trim());
}

/**
 * Classify a sentence by its conversational function.
 */
type SentenceFunction = 'acknowledgment' | 'reassurance' | 'instruction' | 'question';

const ACK_PATTERNS = [
  /^(got it|perfect|of course|makes sense|that makes sense|totally|absolutely|no problem|no worries)/i,
  /^(i'm sorry|sorry to hear|i understand|totally get that|totally understand)/i,
  /^(great|nice|awesome|sounds good|okay|ok)\b/i,
];

function classifySentence(s: string): SentenceFunction {
  if (isQuestion(s)) return 'question';
  if (ACK_PATTERNS.some((p) => p.test(s.trim()))) return 'acknowledgment';
  const lower = s.toLowerCase();
  if (lower.includes('we\'ll') || lower.includes('we can') || lower.includes('i can') ||
      lower.includes('our team') || lower.includes('you\'ll') || lower.includes('i\'ll')) {
    return 'instruction';
  }
  return 'reassurance';
}

/**
 * Split text into sentences. Handles abbreviations and addresses.
 */
function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = '';

  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    current += (current ? ' ' : '') + words[i];

    const word = words[i];
    const endsWithPunctuation = /[.!?]$/.test(word);
    const isAbbreviation = /^(Dr|Mr|Mrs|Ms|Jr|Sr|St|Ave|Blvd|Rd|Ste|Tpke|Tpk|Pkwy|Hwy)\.$/.test(word);
    const isInitial = /^[A-Z]\.$/.test(word);
    const isNumber = /^\d+\.$/.test(word);

    if (endsWithPunctuation && !isAbbreviation && !isInitial && !isNumber) {
      sentences.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    sentences.push(current.trim());
  }

  return sentences.filter((s) => s.length > 0);
}

/**
 * Group sentences into bubbles using deterministic rules.
 *
 * RULES (in priority order):
 * 1. Questions ALWAYS get their own bubble
 * 2. Trust-sensitive: max 1 sentence per bubble (unless ack + short reassurance)
 * 3. Short acknowledgment (< 25 chars) can pair with next non-question sentence
 * 4. Max 2 sentences per bubble
 * 5. Function change (e.g., reassurance -> question) forces new bubble
 * 6. Cap at 3 bubbles total
 */
function groupSentences(sentences: string[], trustSensitive: boolean): string[] {
  const bubbles: string[] = [];
  let i = 0;

  while (i < sentences.length) {
    const s = sentences[i];
    const sFunc = classifySentence(s);

    // Rule 1: Questions always standalone
    if (sFunc === 'question') {
      bubbles.push(s);
      i++;
      continue;
    }

    const next = sentences[i + 1];
    const nextFunc = next ? classifySentence(next) : null;

    // Rule 2: Trust-sensitive topics — strict 1-per-bubble
    // Exception: short ack (< 25 chars) can pair with next non-question
    if (trustSensitive) {
      if (sFunc === 'acknowledgment' && s.length < 25 && next && nextFunc !== 'question') {
        bubbles.push(`${s} ${next}`);
        i += 2;
        continue;
      }
      bubbles.push(s);
      i++;
      continue;
    }

    // Rule 3: Short acknowledgment (< 25 chars) pairs with next non-question
    if (sFunc === 'acknowledgment' && s.length < 25 && next && nextFunc !== 'question') {
      bubbles.push(`${s} ${next}`);
      i += 2;
      continue;
    }

    // Rule 4: Two tightly-connected non-question sentences can share a bubble
    // Only if both are short (< 60 chars each) and same function
    if (next && nextFunc !== 'question' && sFunc === nextFunc &&
        s.length < 60 && next.length < 60) {
      bubbles.push(`${s} ${next}`);
      i += 2;
      continue;
    }

    // Default: one sentence per bubble
    bubbles.push(s);
    i++;
  }

  // Rule 6: Cap at 3 bubbles max (trust-sensitive gets 3, normal gets 2-3)
  if (bubbles.length > 3) {
    const capped = bubbles.slice(0, 2);
    capped.push(bubbles.slice(2).join(' '));
    return capped;
  }

  return bubbles;
}

/**
 * Main chunking function.
 */
export function chunkResponse(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Split on paragraph boundaries first
  const paragraphs = trimmed.split(/\n\n+/);

  if (paragraphs.length > 1) {
    const chunks: string[] = [];
    let summaryBlock = '';

    for (const para of paragraphs) {
      const p = para.trim();
      if (!p) continue;

      if (isStructuredBlock(p)) {
        if (summaryBlock) summaryBlock += '\n\n' + p;
        else summaryBlock = p;
        continue;
      }

      if (summaryBlock) {
        chunks.push(summaryBlock);
        summaryBlock = '';
      }

      if (p.length <= 300) {
        // Still apply sentence splitting within paragraphs
        const sentences = splitSentences(p);
        if (sentences.length > 1) {
          chunks.push(...groupSentences(sentences, isTrustSensitive(p)));
        } else {
          chunks.push(p);
        }
      } else {
        const sentences = splitSentences(p);
        chunks.push(...groupSentences(sentences, isTrustSensitive(p)));
      }
    }
    if (summaryBlock) chunks.push(summaryBlock);

    // Global cap: 3 bubbles max
    const result = chunks.filter((c) => c.trim().length > 0);
    if (result.length > 3) {
      const capped = result.slice(0, 2);
      capped.push(result.slice(2).join(' '));
      return capped;
    }
    return result;
  }

  // Single paragraph
  const sentences = splitSentences(trimmed);
  if (sentences.length <= 1) return [trimmed];

  return groupSentences(sentences, isTrustSensitive(trimmed));
}

// Legacy exports (kept for compatibility but timing now lives in useChat)
export function chunkDelay(text: string, multiplier: number = 1.0): number {
  if (multiplier === 0) return 0;
  const len = text.length;
  const min = len <= 40 ? 100 : len <= 160 ? 200 : 350;
  const max = len <= 40 ? 250 : len <= 160 ? 450 : 650;
  return Math.round((Math.floor(min + Math.random() * (max - min))) * multiplier);
}

export function interChunkDelay(): number {
  return Math.floor(200 + Math.random() * 250);
}
