/**
 * MessageFragmentationService
 *
 * Breaks a single composed AI response into multiple short, human-like
 * message fragments with realistic typing delays between them.
 *
 * This is the core engine behind the "Patient Coordinator (Human Mode)"
 * preset. Instead of delivering one polished response, it simulates a
 * real person texting — short bursts, natural pauses, imperfect flow.
 */

export interface MessageFragment {
  /** The text content of this fragment. */
  content: string;
  /** Milliseconds to wait BEFORE sending this fragment (typing delay). */
  delay_ms: number;
  /** Whether to show a typing indicator during the delay. */
  show_typing: boolean;
  /** Sequence index (0-based). */
  index: number;
}

export interface FragmentationResult {
  /** The ordered list of message fragments to deliver. */
  fragments: MessageFragment[];
  /** Total estimated delivery time including all delays. */
  total_delivery_ms: number;
  /** Whether fragmentation was applied (false = single message passthrough). */
  was_fragmented: boolean;
}

export interface FragmentationConfig {
  /** Enable message fragmentation. */
  enabled: boolean;
  /** Max words per fragment (hard cap). */
  max_words_per_fragment: number;
  /** Target words per fragment (soft target). */
  target_words_per_fragment: number;
  /** Delay before first message (ms). */
  initial_delay: { min: number; max: number };
  /** Delay between fragments (ms). */
  inter_message_delay: { min: number; max: number };
  /** Extra delay for fragments with more words (ms per word). */
  per_word_delay_ms: number;
  /** Show typing indicator during delays. */
  show_typing_indicator: boolean;
}

/** Default config for Patient Coordinator (Human Mode). */
export const HUMAN_MODE_FRAGMENTATION_CONFIG: FragmentationConfig = {
  enabled: true,
  max_words_per_fragment: 18,
  target_words_per_fragment: 8,
  initial_delay: { min: 500, max: 1200 },
  inter_message_delay: { min: 300, max: 800 },
  per_word_delay_ms: 40,
  show_typing_indicator: true,
};

/** Passthrough config — no fragmentation. */
export const NO_FRAGMENTATION_CONFIG: FragmentationConfig = {
  enabled: false,
  max_words_per_fragment: 999,
  target_words_per_fragment: 999,
  initial_delay: { min: 0, max: 0 },
  inter_message_delay: { min: 0, max: 0 },
  per_word_delay_ms: 0,
  show_typing_indicator: false,
};

export class MessageFragmentationService {
  /**
   * Fragments a composed response into multiple human-like messages.
   *
   * If fragmentation is disabled, returns the original response as a
   * single fragment with no delay.
   */
  fragment(response: string, config: FragmentationConfig): FragmentationResult {
    if (!config.enabled || !response.trim()) {
      return {
        fragments: [{
          content: response,
          delay_ms: 0,
          show_typing: false,
          index: 0,
        }],
        total_delivery_ms: 0,
        was_fragmented: false,
      };
    }

    // Step 1: Split the response into natural sentence/clause boundaries
    const rawChunks = this.splitIntoChunks(response);

    // Step 2: Enforce max length — break chunks that are too long
    const sizedChunks = this.enforceSizeLimits(rawChunks, config);

    // Step 3: Optionally prepend a human opener if the first chunk is long
    const finalChunks = this.injectHumanOpener(sizedChunks);

    // Step 4: Assign delays to each fragment
    const fragments = this.assignDelays(finalChunks, config);

    const totalDelivery = fragments.reduce((sum, f) => sum + f.delay_ms, 0);

    return {
      fragments,
      total_delivery_ms: totalDelivery,
      was_fragmented: fragments.length > 1,
    };
  }

  /**
   * Splits a response into chunks at natural boundaries:
   * sentence endings, question marks, conjunctions, em-dashes.
   */
  private splitIntoChunks(response: string): string[] {
    // First split on explicit sentence boundaries
    const sentences = response
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const chunks: string[] = [];

    for (const sentence of sentences) {
      // If a sentence has a conjunction mid-way, split on it
      const words = sentence.split(/\s+/);
      if (words.length > 14) {
        const subChunks = this.splitLongSentence(sentence);
        chunks.push(...subChunks);
      } else {
        chunks.push(sentence);
      }
    }

    return chunks;
  }

  /**
   * Splits a long sentence at natural break points:
   * conjunctions, commas, semicolons, "so", "but", "and".
   */
  private splitLongSentence(sentence: string): string[] {
    // Try splitting at conjunctions/commas
    const breakPatterns = [
      /,\s+(and|but|so|or|because|since|though|although)\s+/i,
      /,\s+/,
      /\s+(and|but|so|or)\s+/i,
      /;\s+/,
      /\s+—\s+/,
    ];

    for (const pattern of breakPatterns) {
      const match = sentence.match(pattern);
      if (match && match.index !== undefined) {
        const breakPoint = match.index;
        const beforeBreak = sentence.substring(0, breakPoint).trim();
        // Include the conjunction in the second part for natural reading
        const afterBreak = sentence.substring(breakPoint).replace(/^[,;—]\s*/, '').trim();

        if (beforeBreak.length > 5 && afterBreak.length > 5) {
          return [beforeBreak, afterBreak];
        }
      }
    }

    // Fallback: split roughly in the middle at a word boundary
    const words = sentence.split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    return [
      words.slice(0, mid).join(' '),
      words.slice(mid).join(' '),
    ];
  }

  /**
   * Enforces max_words_per_fragment by splitting oversized chunks.
   */
  private enforceSizeLimits(chunks: string[], config: FragmentationConfig): string[] {
    const result: string[] = [];

    for (const chunk of chunks) {
      const words = chunk.split(/\s+/);
      if (words.length <= config.max_words_per_fragment) {
        result.push(chunk);
      } else {
        // Split at the target size
        for (let i = 0; i < words.length; i += config.target_words_per_fragment) {
          const slice = words.slice(i, i + config.target_words_per_fragment).join(' ');
          if (slice.trim()) result.push(slice);
        }
      }
    }

    return result;
  }

  /**
   * If the first chunk doesn't start with a natural human opener,
   * and the response has enough substance, prepend one.
   */
  private injectHumanOpener(chunks: string[]): string[] {
    if (chunks.length === 0) return chunks;

    const first = chunks[0].toLowerCase();
    const startsNatural = /^(got it|okay|yeah|makes sense|sure|hey|hi|no worries|totally|right)/.test(first);

    // Don't inject if it already sounds natural or is very short
    if (startsNatural || chunks.length <= 1) {
      return chunks;
    }

    // Don't inject openers for greetings — they already have their own
    if (/^(hello|thank you|thanks|welcome|good (morning|afternoon|evening))/i.test(first)) {
      return chunks;
    }

    return chunks;
  }

  /**
   * Assigns realistic typing delays to each fragment.
   * Longer fragments get slightly longer delays to simulate typing time.
   */
  private assignDelays(chunks: string[], config: FragmentationConfig): MessageFragment[] {
    return chunks.map((content, index) => {
      const wordCount = content.split(/\s+/).length;

      let delay_ms: number;
      if (index === 0) {
        // First message: initial thinking delay
        delay_ms = this.randomInRange(config.initial_delay.min, config.initial_delay.max);
      } else {
        // Subsequent messages: inter-message delay + per-word bonus
        const baseDelay = this.randomInRange(
          config.inter_message_delay.min,
          config.inter_message_delay.max,
        );
        delay_ms = baseDelay + (wordCount * config.per_word_delay_ms);
      }

      return {
        content,
        delay_ms: Math.round(delay_ms),
        show_typing: config.show_typing_indicator,
        index,
      };
    });
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
