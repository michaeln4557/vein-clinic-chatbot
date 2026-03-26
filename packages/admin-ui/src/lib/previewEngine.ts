/**
 * Preview Engine
 *
 * Generates sample bot responses and timing based on current behavior settings.
 */

import type { BehaviorProfile, SpeedSetting } from './behaviorMapping';
import { DEFAULT_BEHAVIOR_PROFILE } from './behaviorMapping';

/* ── Scenarios ────────────────────────────────────── */

export interface PreviewScenario {
  id: string;
  label: string;
  patientMessage: string;
}

export const PREVIEW_SCENARIOS: PreviewScenario[] = [
  { id: 'symptoms', label: 'New patient (symptoms)', patientMessage: 'I have these veins on my legs that are really bothering me.' },
  { id: 'insurance', label: 'Insurance question', patientMessage: 'Do you accept Blue Cross? I want to make sure before I come in.' },
  { id: 'booking', label: 'Ready to book', patientMessage: "I'd like to schedule a consultation. What's available?" },
  { id: 'cost', label: 'Price concern', patientMessage: 'How much does a consultation cost? I don\'t want any surprises.' },
  { id: 'hesitation', label: 'Hesitation', patientMessage: 'I\'m not sure if I really need to come in. Is it serious?' },
  { id: 'human', label: 'Wants human', patientMessage: 'Can I talk to a real person instead?' },
  { id: 'followup', label: 'No response', patientMessage: '(patient has not responded for a while)' },
];

/* ── Response Templates ──────────────────────────── */

type Tier = 1 | 2 | 3 | 4 | 5;

interface ScenarioTemplates {
  tone: Record<Tier, string>;
  booking: Record<Tier, string>;
}

const TEMPLATES: Record<string, ScenarioTemplates> = {
  symptoms: {
    tone: {
      1: 'Thank you for reaching out. Our doctors can evaluate that.',
      2: "I'm sorry that's been bothering you. Our doctors can help.",
      3: "I'm sorry that's been bothering you. A lot of people reach out about this — our doctors see it all the time.",
      4: "Oh yeah, that sounds really frustrating. You're not alone — our doctors see this all the time and can definitely help.",
      5: "Oh I totally get that — that sounds really frustrating. You're definitely not alone, and our doctors can absolutely help with that.",
    },
    booking: {
      1: 'A consultation would let our doctors take a look. Let us know if you have questions.',
      2: "A consultation would be a good first step. Let us know if you'd like to come in.",
      3: 'Would you like to come in for a consultation? We have availability this week.',
      4: "I can help you find a time — we have some great openings this week. What days work for you?",
      5: "I can get you in really quickly — what days work best? I'll grab the closest opening.",
    },
  },
  insurance: {
    tone: {
      1: 'We work with many insurance plans. We can verify your benefits.',
      2: "We work with a lot of plans and we're happy to check yours.",
      3: "Great question. We work with a lot of plans and we're happy to check yours — no surprises.",
      4: "Yeah, great question! We work with a ton of plans. We'll check everything so you know what to expect.",
      5: "Oh yeah, great question! We work with a ton of plans and checking yours is really easy. We'll make sure there are no surprises.",
    },
    booking: {
      1: 'You can call us with your plan details.',
      2: "If you share your plan details, we can look into it.",
      3: "What's your plan name and member ID? I can look into it.",
      4: "Can you share your plan name and member ID? I'll check right now.",
      5: "Go ahead and share your plan name and member ID — I'll check on that right now and get back to you.",
    },
  },
  booking: {
    tone: {
      1: 'Consultations are available.',
      2: "We'd be happy to get you scheduled.",
      3: "We'd be happy to get you scheduled. Most consultations take about 30 minutes.",
      4: "Awesome, let's get you scheduled! Consultations are quick — about 30 minutes.",
      5: "Awesome, let's get you on the schedule! Consultations are quick — about 30 minutes — and you'll leave with a clear plan.",
    },
    booking: {
      1: 'Please let us know your preferred date.',
      2: 'What day works best for you?',
      3: 'Do mornings or afternoons work better for you?',
      4: "What days work best — mornings or afternoons? I'll find the best slot.",
      5: "What days work best — and do you prefer mornings or afternoons? I'll grab the best slot for you.",
    },
  },
  cost: {
    tone: {
      1: 'Costs depend on your insurance coverage.',
      2: "That's a great question. Most treatments are covered by insurance.",
      3: "Totally understand wanting to know upfront. Most treatments are covered by insurance, and we verify everything before you come in.",
      4: "Yeah, totally get that — nobody likes surprises. Most treatments are covered by insurance, and we'll check your exact coverage before your visit.",
      5: "Oh totally, I get that — nobody wants surprises with medical stuff. Most treatments are covered, and we'll walk you through exactly what to expect before you even come in.",
    },
    booking: {
      1: 'Contact us for more details.',
      2: "We can check your coverage if you'd like.",
      3: "Want me to check your coverage? I just need your plan name and member ID.",
      4: "I can check your coverage right now — what's your plan name and member ID?",
      5: "Let me check your coverage real quick — what's your plan name and member ID? I'll get right back to you.",
    },
  },
  hesitation: {
    tone: {
      1: 'A consultation can determine the best course of action.',
      2: "It's always a good idea to have a specialist take a look.",
      3: "That's a really common question. A lot of people aren't sure at first, but a quick consultation can give you peace of mind.",
      4: "Yeah, I hear that a lot actually. A lot of people aren't sure until they come in — and most are glad they did. A quick screening tells you a lot.",
      5: "Oh yeah, I totally hear you — a lot of people feel the same way. But honestly, most people who come in are really glad they did. A quick screening can tell you a lot.",
    },
    booking: {
      1: 'Consultations are available if you decide to come in.',
      2: "If you'd like, we can set up a quick consultation.",
      3: "Would you like to come in for a quick look? No commitment, just peace of mind.",
      4: "Want me to find a time for a quick screening? No commitment — just gives you answers.",
      5: "I can grab a quick opening for you — no commitment at all, just gives you answers. What days work?",
    },
  },
  human: {
    tone: {
      1: 'I can connect you with our team.',
      2: "Absolutely, I can connect you with someone on our team.",
      3: "Absolutely, I can connect you with someone. In the meantime, I'm happy to help with anything quick.",
      4: "Of course! Totally understand. I'll get someone to call you.",
      5: "Of course! Totally understand wanting to talk to someone directly. I'll get someone to call you right away.",
    },
    booking: {
      1: 'Please provide a callback number.',
      2: "What's the best number to reach you?",
      3: "What's the best number to reach you?",
      4: "What's the best number and what time works?",
      5: "What's the best number and what time works? I'll make sure they reach you.",
    },
  },
  followup: {
    tone: {
      1: 'Following up on our conversation.',
      2: 'Just checking in — wanted to make sure you got my message.',
      3: "Hi! Just checking in — wanted to make sure you got my last message.",
      4: "Hey! Just wanted to check in and make sure everything's good. No rush.",
      5: "Hey! Just wanted to check in and make sure everything's good. No rush at all — I'm here whenever you're ready.",
    },
    booking: {
      1: 'We are available when you are ready.',
      2: "Let us know if you'd like to move forward.",
      3: 'Would you still like to schedule a consultation?',
      4: "Want me to hold a spot for you this week?",
      5: "Want me to hold a spot for you this week? I can always move it if something comes up.",
    },
  },
};

/* ── Generator ────────────────────────────────────── */

export function generatePreviewResponse(profile: BehaviorProfile, scenarioId: string): string[] {
  const template = TEMPLATES[scenarioId];
  if (!template) return ['How can I help you today?'];

  const h = profile.humanizationLevel as Tier;
  const b = profile.bookingApproach as Tier;

  return [template.tone[h], template.booking[b]];
}

export function generateCustomPreviewResponse(profile: BehaviorProfile): string[] {
  return generatePreviewResponse(profile, 'symptoms');
}

/* ── Timing ───────────────────────────────────────── */

export interface PreviewTiming {
  typingDelayMs: number;
  interBubblePauseMs: number;
}

const SPEED_TO_TIMING: Record<SpeedSetting, PreviewTiming> = {
  slow: { typingDelayMs: 1200, interBubblePauseMs: 800 },
  medium: { typingDelayMs: 700, interBubblePauseMs: 450 },
  fast: { typingDelayMs: 300, interBubblePauseMs: 200 },
};

export function getPreviewTiming(profile: BehaviorProfile): PreviewTiming {
  // Use the slower of responseSpeed and typingIndicatorSpeed for preview
  return SPEED_TO_TIMING[profile.responseSpeed];
}

/* ── "What Changed" ──────────────────────────────── */

export interface ChangeDescription {
  label: string;
  icon: 'up' | 'down';
}

export function getChangeDescriptions(profile: BehaviorProfile): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  const d = DEFAULT_BEHAVIOR_PROFILE;

  if (profile.humanizationLevel > d.humanizationLevel) {
    changes.push({ label: 'More conversational tone', icon: 'up' });
  } else if (profile.humanizationLevel < d.humanizationLevel) {
    changes.push({ label: 'More structured tone', icon: 'down' });
  }

  if (profile.bookingApproach > d.bookingApproach) {
    changes.push({ label: 'More proactive about booking', icon: 'up' });
  } else if (profile.bookingApproach < d.bookingApproach) {
    changes.push({ label: 'Lighter booking guidance', icon: 'down' });
  }

  if (profile.responseSpeed !== d.responseSpeed) {
    changes.push({
      label: profile.responseSpeed === 'fast' ? 'Faster replies' : 'Slower, more natural pacing',
      icon: profile.responseSpeed === 'fast' ? 'up' : 'down',
    });
  }

  if (profile.typingIndicatorSpeed !== d.typingIndicatorSpeed) {
    changes.push({
      label: profile.typingIndicatorSpeed === 'slow' ? 'Longer typing indicator' : 'Shorter typing indicator',
      icon: profile.typingIndicatorSpeed === 'slow' ? 'down' : 'up',
    });
  }

  return changes;
}

/* ── Compare Presets ─────────────────────────────── */

export interface ComparePreset {
  id: string;
  label: string;
  profile: BehaviorProfile;
}

export const COMPARE_PRESETS: ComparePreset[] = [
  { id: 'default', label: 'Defaults (all 3)', profile: { ...DEFAULT_BEHAVIOR_PROFILE } },
];
