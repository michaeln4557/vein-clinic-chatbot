/**
 * Response Chunking Utility
 *
 * Splits a long bot response into smaller, human-feeling message chunks.
 * Designed to make the chatbot feel like a real person texting in short bursts.
 *
 * Rules:
 * - Split by sentence boundaries first
 * - Group 1-2 short sentences per chunk
 * - Max ~240 characters per chunk unless it's a structured block (e.g. appointment summary)
 * - Keep context together (don't split mid-thought)
 * - Respect paragraph boundaries (\n\n)
 */

const STRUCTURED_BLOCK_MARKERS = [
  'Appointment Confirmation',
  'Patient:',
];

/**
 * Check if text looks like a structured block (appointment summary, etc.)
 * that should NOT be split further.
 */
function isStructuredBlock(text: string): boolean {
  return STRUCTURED_BLOCK_MARKERS.some((marker) => text.includes(marker));
}

/**
 * Split text into sentences. Handles common abbreviations.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by a space or end-of-string
  // But avoid splitting on common abbreviations (Dr., Mr., Mrs., etc.)
  const sentences: string[] = [];
  let current = '';

  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    current += (current ? ' ' : '') + words[i];

    const word = words[i];
    const endsWithPeriod = /[.!?]$/.test(word);
    const isAbbreviation = /^(Dr|Mr|Mrs|Ms|Jr|Sr|St|Ave|Blvd|Rd|Ste|Tpke|Tpk|Pkwy|Hwy)\.$/.test(word);
    const isInitial = /^[A-Z]\.$/.test(word);
    const isNumber = /^\d+\.$/.test(word);

    if (endsWithPeriod && !isAbbreviation && !isInitial && !isNumber) {
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
 * Group sentences into chunks of comfortable reading length.
 * Prefers 1-2 sentences per chunk, max ~240 chars.
 */
function groupSentences(sentences: string[]): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const combined = current ? `${current} ${sentence}` : sentence;

    if (!current) {
      // First sentence in this chunk
      current = sentence;
    } else if (combined.length <= 240) {
      // Can fit another sentence
      current = combined;
    } else {
      // Current chunk is full, start new one
      chunks.push(current);
      current = sentence;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Main chunking function.
 * Takes a bot response string and returns an array of message chunks.
 */
export function chunkResponse(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Short messages: don't chunk
  if (trimmed.length <= 260) {
    return [trimmed];
  }

  // Structured blocks (appointment summary): keep as single chunk
  if (isStructuredBlock(trimmed)) {
    // But still split paragraphs if there's a structured block + other content
    const paragraphs = trimmed.split(/\n\n+/);
    if (paragraphs.length > 1) {
      // Check if any paragraph is the structured summary
      const chunks: string[] = [];
      let summaryBlock = '';

      for (const para of paragraphs) {
        if (isStructuredBlock(para)) {
          if (summaryBlock) summaryBlock += '\n\n' + para;
          else summaryBlock = para;
        } else {
          if (summaryBlock) {
            chunks.push(summaryBlock);
            summaryBlock = '';
          }
          // Chunk this non-structured paragraph
          const sentences = splitSentences(para);
          chunks.push(...groupSentences(sentences));
        }
      }
      if (summaryBlock) chunks.push(summaryBlock);
      return chunks.filter((c) => c.trim().length > 0);
    }
    return [trimmed];
  }

  // Split by paragraphs first
  const paragraphs = trimmed.split(/\n\n+/);

  if (paragraphs.length > 1) {
    // Each paragraph becomes its own chunk (or gets further split if too long)
    const chunks: string[] = [];
    for (const para of paragraphs) {
      const p = para.trim();
      if (!p) continue;
      if (p.length <= 260) {
        chunks.push(p);
      } else {
        const sentences = splitSentences(p);
        chunks.push(...groupSentences(sentences));
      }
    }
    return chunks;
  }

  // Single paragraph, split by sentences
  const sentences = splitSentences(trimmed);
  if (sentences.length <= 1) {
    return [trimmed]; // Can't split further
  }

  return groupSentences(sentences);
}

/**
 * Calculate typing delay for a chunk based on its length.
 * Uses the humanization spec timing model.
 */
export function chunkDelay(text: string, multiplier: number = 1.0): number {
  if (multiplier === 0) return 0;

  const len = text.length;
  let min: number;
  let max: number;

  if (len <= 40) {
    min = 150; max = 350;
  } else if (len <= 160) {
    min = 300; max = 600;
  } else {
    min = 500; max = 900;
  }

  const base = Math.floor(min + Math.random() * (max - min));
  return Math.round(base * multiplier);
}

/**
 * Calculate inter-chunk pause (shorter than initial typing delay).
 * Must be long enough for typing dots to be visible.
 */
export function interChunkDelay(): number {
  return Math.floor(300 + Math.random() * 300); // 300-600ms
}
