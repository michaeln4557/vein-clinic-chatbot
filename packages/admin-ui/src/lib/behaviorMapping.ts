/**
 * Behavior Mapping Library
 *
 * Maps 2 core sliders (1-5) + conversation settings to internal behavior parameters.
 *
 * CONSTRAINT: These controls only affect tone, pacing, and delivery.
 * They NEVER affect intake flow, insurance logic, booking gates, script order, or compliance.
 */

/* ── Types ────────────────────────────────────────── */

export type SpeedSetting = 'slow' | 'medium' | 'fast';

export type ConversationStage = 'Early' | 'Symptoms' | 'Insurance' | 'Scheduling';
export const CONVERSATION_STAGES: ConversationStage[] = ['Early', 'Symptoms', 'Insurance', 'Scheduling'];

export interface StageSliderOverride {
  humanizationLevel: number;  // 1-5
  bookingApproach: number;    // 1-5
}

export interface BehaviorProfile {
  humanizationLevel: number;  // 1-5
  bookingApproach: number;    // 1-5
  responseSpeed: SpeedSetting;
  typingIndicatorSpeed: SpeedSetting;
  calendarInviteEnabled: boolean;
  googleMapsLinkEnabled: boolean;
  insuranceCardUploadEnabled: boolean;
  stageMode: boolean;
  stageOverrides: Partial<Record<ConversationStage, StageSliderOverride>>;
}

export interface DerivedSettings {
  // From humanizationLevel
  toneWarmthLevel: number;            // 0-100
  conversationalLooseness: number;    // 0-100
  messageChunkingStyle: number;       // 0-100
  formalityLevel: number;             // 0-100

  // From responseSpeed
  pauseBeforeFirstBubbleMs: number;
  pauseBetweenBubblesMs: number;

  // From typingIndicatorSpeed
  typingIndicatorMinMs: number;
  typingIndicatorMaxMs: number;

  // From bookingApproach
  bookingAssertivenessLevel: number;  // 0-100
  bookingSuggestionStrength: number;  // 0-100
}

export interface ToneSettings {
  warmth: number;
  formality: number;
  empathy: number;
  urgency: number;
  detail: number;
}

/* ── Constants ────────────────────────────────────── */

export const DEFAULT_BEHAVIOR_PROFILE: BehaviorProfile = {
  humanizationLevel: 3,
  bookingApproach: 3,
  responseSpeed: 'medium',
  typingIndicatorSpeed: 'medium',
  calendarInviteEnabled: true,
  googleMapsLinkEnabled: true,
  insuranceCardUploadEnabled: true,
  stageMode: false,
  stageOverrides: {},
};

/* ── Slider Metadata ─────────────────────────────── */

export interface SliderStop {
  value: number;
  label: string;
}

export interface SliderMeta {
  key: 'humanizationLevel' | 'bookingApproach';
  label: string;
  helperText: string;
  stops: SliderStop[];
}

export const BEHAVIOR_SLIDERS: SliderMeta[] = [
  {
    key: 'humanizationLevel',
    label: 'Humanization Level',
    helperText: 'Controls how human and conversational the coordinator feels. Workflow and safety rules stay the same.',
    stops: [
      { value: 1, label: 'Structured' },
      { value: 2, label: 'Warmer' },
      { value: 3, label: 'Balanced' },
      { value: 4, label: 'Conversational' },
      { value: 5, label: 'Most human' },
    ],
  },
  {
    key: 'bookingApproach',
    label: 'Booking Approach',
    helperText: 'Controls how strongly the coordinator guides patients toward scheduling after required steps are complete.',
    stops: [
      { value: 1, label: 'Informational' },
      { value: 2, label: 'Light guidance' },
      { value: 3, label: 'Balanced' },
      { value: 4, label: 'Proactive' },
      { value: 5, label: 'Strongly helps book' },
    ],
  },
];

/* ── Mapping Functions ────────────────────────────── */

function lerp(min: number, max: number, value: number, scale: number = 5): number {
  const t = (value - 1) / (scale - 1);
  return Math.round(min + t * (max - min));
}

const SPEED_TIMING: Record<SpeedSetting, { firstBubble: number; betweenBubbles: number }> = {
  slow: { firstBubble: 1200, betweenBubbles: 800 },
  medium: { firstBubble: 700, betweenBubbles: 450 },
  fast: { firstBubble: 300, betweenBubbles: 200 },
};

const TYPING_TIMING: Record<SpeedSetting, { min: number; max: number }> = {
  slow: { min: 800, max: 1500 },
  medium: { min: 400, max: 800 },
  fast: { min: 150, max: 350 },
};

export function deriveBehaviorSettings(profile: BehaviorProfile): DerivedSettings {
  const { humanizationLevel, bookingApproach, responseSpeed, typingIndicatorSpeed } = profile;

  const speed = SPEED_TIMING[responseSpeed];
  const typing = TYPING_TIMING[typingIndicatorSpeed];

  return {
    // Humanization: higher = warmer, looser, less formal
    toneWarmthLevel: lerp(15, 90, humanizationLevel),
    conversationalLooseness: lerp(10, 85, humanizationLevel),
    messageChunkingStyle: lerp(20, 80, humanizationLevel),
    formalityLevel: lerp(85, 15, humanizationLevel),

    // Response Speed
    pauseBeforeFirstBubbleMs: speed.firstBubble,
    pauseBetweenBubblesMs: speed.betweenBubbles,

    // Typing Indicator
    typingIndicatorMinMs: typing.min,
    typingIndicatorMaxMs: typing.max,

    // Booking Approach: higher = more assertive
    bookingAssertivenessLevel: lerp(10, 90, bookingApproach),
    bookingSuggestionStrength: lerp(15, 85, bookingApproach),
  };
}

export function derivedToToneSettings(derived: DerivedSettings): ToneSettings {
  return {
    warmth: derived.toneWarmthLevel,
    formality: derived.formalityLevel,
    empathy: Math.round((derived.toneWarmthLevel + derived.conversationalLooseness) / 2),
    urgency: derived.bookingAssertivenessLevel,
    detail: 50,
  };
}

/* ── Stage Override Resolver ─────────────────────── */

/**
 * Returns the effective slider values for a given stage.
 * If stageMode is off or no override exists for the stage, returns global values.
 */
export function getEffectiveSliders(
  profile: BehaviorProfile,
  stage?: ConversationStage,
): { humanizationLevel: number; bookingApproach: number } {
  if (!profile.stageMode || !stage) {
    return { humanizationLevel: profile.humanizationLevel, bookingApproach: profile.bookingApproach };
  }
  const override = profile.stageOverrides[stage];
  return {
    humanizationLevel: override?.humanizationLevel ?? profile.humanizationLevel,
    bookingApproach: override?.bookingApproach ?? profile.bookingApproach,
  };
}

/* ── Stage Fix Suggestions ───────────────────────── */

/**
 * Suggested slider values when an operator clicks "Fix this step" from funnel analytics.
 * These are starting points — the operator can adjust before saving.
 */
export const STAGE_FIX_SUGGESTIONS: Record<ConversationStage, StageSliderOverride> = {
  Early: { humanizationLevel: 4, bookingApproach: 2 },
  Symptoms: { humanizationLevel: 4, bookingApproach: 3 },
  Insurance: { humanizationLevel: 4, bookingApproach: 4 },
  Scheduling: { humanizationLevel: 3, bookingApproach: 5 },
};

/* ── Stage-to-Backend Mapping ────────────────────── */

export const STAGE_TO_WORKFLOW: Record<ConversationStage, string> = {
  Early: 'greeting',
  Symptoms: 'data_collection',
  Insurance: 'insurance_collection',
  Scheduling: 'scheduling',
};
