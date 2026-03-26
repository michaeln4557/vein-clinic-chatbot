/**
 * Mock Conversation Insights
 *
 * Pre-computed issue patterns mapped to filter combinations.
 * Each pattern includes example conversation snippets, explanations, and fix actions.
 */

import type { BehaviorProfile } from '../lib/behaviorMapping';

/* ── Types ────────────────────────────────────────── */

export interface ConversationExample {
  conversationId: string;
  patientMessage: string;
  botResponse: string;
  highlightedProblem: string;   // substring of botResponse to highlight
  explanation: string;
}

export interface FixAction {
  id: string;
  label: string;
  description: string;
  type: 'slider' | 'rule';
  sliderKey?: keyof BehaviorProfile;
  sliderNewValue?: number | string;
  ruleTarget?: string;
}

export interface IssuePattern {
  id: string;
  stage: string;
  reason: string;
  title: string;
  severity: 'critical' | 'warning';
  dropPercent: number;
  examples: ConversationExample[];
  fixes: FixAction[];
}

/* ── Pattern Data ─────────────────────────────────── */

const issuePatterns: IssuePattern[] = [
  {
    id: 'insurance-friction',
    stage: 'insurance',
    reason: 'friction',
    title: 'Insurance Step — Friction (38% drop)',
    severity: 'critical',
    dropPercent: 38,
    examples: [
      {
        conversationId: 'CONV-3002',
        patientMessage: 'Do you take Blue Cross? How much does it cost without insurance?',
        botResponse: 'We work with most major insurance providers including Blue Cross. Our team can verify your specific coverage when you come in. Would you like to schedule?',
        highlightedProblem: 'Would you like to schedule?',
        explanation: 'Bot pushed scheduling before answering the cost question',
      },
      {
        conversationId: 'CONV-3006',
        patientMessage: "I don't have insurance and I can't afford out of pocket right now",
        botResponse: 'I understand. We do have financing options available. Would you like to learn more?',
        highlightedProblem: 'Would you like to learn more?',
        explanation: 'Bot offered financing too briefly — didn\'t acknowledge the financial concern with empathy',
      },
      {
        conversationId: 'CONV-3004',
        patientMessage: 'Can I just talk to a real person? I have complicated insurance',
        botResponse: 'Of course! I can arrange for someone from our team to call you. Would you prefer a callback now or at a scheduled time?',
        highlightedProblem: 'Would you prefer a callback now or at a scheduled time?',
        explanation: 'Bot didn\'t attempt to address the insurance concern before escalating',
      },
    ],
    fixes: [
      {
        id: 'fix-insurance-reassurance',
        label: 'Add insurance reassurance earlier',
        description: 'Insert reassurance language before asking to schedule when insurance is mentioned',
        type: 'rule',
        ruleTarget: '/playbooks',
      },
      {
        id: 'fix-delay-intake',
        label: 'Delay intake when insurance is mentioned',
        description: 'Hold off on scheduling prompts until insurance concerns are addressed',
        type: 'rule',
        ruleTarget: '/playbooks',
      },
      {
        id: 'fix-humanization-up',
        label: 'Increase Humanization (3 → 4)',
        description: 'More empathetic, conversational tone when handling sensitive topics',
        type: 'slider',
        sliderKey: 'humanizationLevel',
        sliderNewValue: 4,
      },
    ],
  },
  {
    id: 'early-stopped',
    stage: 'early',
    reason: 'stopped_responding',
    title: 'Early Stage — Stopped Responding (25% drop)',
    severity: 'warning',
    dropPercent: 25,
    examples: [
      {
        conversationId: 'CONV-3003',
        patientMessage: 'hi',
        botResponse: 'Welcome! Are you looking to schedule a consultation for vein treatment, or do you have a question about our services?',
        highlightedProblem: 'Are you looking to schedule a consultation for vein treatment, or do you have a question about our services?',
        explanation: 'Opening message was too formal and gave too many options — patient disengaged',
      },
    ],
    fixes: [
      {
        id: 'fix-opening-engagement',
        label: 'Improve opening engagement',
        description: 'Use warmer, shorter opening that mirrors the patient\'s casual tone',
        type: 'rule',
        ruleTarget: '/playbooks',
      },
      {
        id: 'fix-humanization-early',
        label: 'Increase Humanization (3 → 4)',
        description: 'More natural, conversational openers to keep early engagement',
        type: 'slider',
        sliderKey: 'humanizationLevel',
        sliderNewValue: 4,
      },
    ],
  },
  {
    id: 'insurance-escalation',
    stage: 'insurance',
    reason: 'escalation',
    title: 'Insurance Step — Escalation (33% of drop-offs)',
    severity: 'warning',
    dropPercent: 33,
    examples: [
      {
        conversationId: 'CONV-3004',
        patientMessage: 'Can I just talk to a real person? I have complicated insurance',
        botResponse: 'Of course! I can arrange for someone from our team to call you. Would you prefer a callback now or at a scheduled time?',
        highlightedProblem: 'Would you prefer a callback now or at a scheduled time?',
        explanation: 'Bot escalated immediately without trying to resolve the insurance concern first',
      },
    ],
    fixes: [
      {
        id: 'fix-insurance-reassurance-esc',
        label: 'Add earlier insurance reassurance',
        description: 'Attempt to address insurance concerns before offering human handoff',
        type: 'rule',
        ruleTarget: '/playbooks',
      },
      {
        id: 'fix-humanization-esc',
        label: 'Increase Humanization (3 → 4)',
        description: 'More empathetic handling of insurance frustration',
        type: 'slider',
        sliderKey: 'humanizationLevel',
        sliderNewValue: 4,
      },
    ],
  },
  {
    id: 'insurance-declined',
    stage: 'insurance',
    reason: 'declined',
    title: 'Insurance Step — Declined (33% of drop-offs)',
    severity: 'warning',
    dropPercent: 33,
    examples: [
      {
        conversationId: 'CONV-3006',
        patientMessage: "I don't have insurance and I can't afford out of pocket right now",
        botResponse: 'I understand. We do have financing options available. Would you like to learn more?',
        highlightedProblem: 'Would you like to learn more?',
        explanation: 'Financing was mentioned too briefly without details — patient felt dismissed',
      },
    ],
    fixes: [
      {
        id: 'fix-financing-earlier',
        label: 'Add financing mention earlier',
        description: 'Proactively mention financing and payment plans before patients raise cost concerns',
        type: 'rule',
        ruleTarget: '/playbooks',
      },
      {
        id: 'fix-booking-approach-up',
        label: 'Increase Booking Approach (3 → 4)',
        description: 'More assertive in presenting value and next steps when patients hesitate',
        type: 'slider',
        sliderKey: 'bookingApproach',
        sliderNewValue: 4,
      },
    ],
  },
];

/* ── Pattern Matching ─────────────────────────────── */

export function findMatchingPattern(
  stage: string,
  reason: string,
  outcome: string,
): IssuePattern | null {
  // No issues to show for successful conversions
  if (outcome === 'converted') return null;

  // Exact match on stage + reason
  if (stage !== 'all' && reason !== 'all') {
    return issuePatterns.find((p) => p.stage === stage && p.reason === reason) ?? null;
  }

  // Stage set, reason "all" → worst pattern for that stage
  if (stage !== 'all') {
    const stagePatterns = issuePatterns.filter((p) => p.stage === stage);
    if (stagePatterns.length === 0) return null;
    return stagePatterns.reduce((worst, p) =>
      p.severity === 'critical' || p.dropPercent > worst.dropPercent ? p : worst,
    );
  }

  // All filters "all" or only outcome set → return highest-severity pattern
  const critical = issuePatterns.find((p) => p.severity === 'critical');
  return critical ?? issuePatterns[0] ?? null;
}
