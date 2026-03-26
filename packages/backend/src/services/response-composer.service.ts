import { Channel } from '../../shared/src/types/conversation';
import { WorkflowStage } from '../../shared/src/types/orchestration';
import type { ToneSettings } from '../../shared/src/types/playbook';
import type { ExtractableFieldName } from '../../shared/src/types/extraction';
import type { IntentClassification, EscalationDecision } from './orchestration.service';
import { logger } from '../index';

interface CompositionContext {
  workflowStage: WorkflowStage;
  intent: IntentClassification;
  escalation: EscalationDecision;
  channel: Channel;
  extractedFields: Record<string, string | null>;
  missingFields: ExtractableFieldName[];
}

interface PlaybookRef {
  id: string;
  name: string;
  priority: number;
}

/**
 * ResponseComposerService builds the final assistant response by combining
 * playbook content, applying tone/length sliders, and merging context from
 * the conversation state.
 */
export class ResponseComposerService {
  /**
   * Composes the full response by merging active playbook content,
   * applying slider-driven tone and length adjustments, and incorporating
   * conversation context.
   */
  async composeResponse(
    activePlaybooks: PlaybookRef[],
    context: CompositionContext,
    toneSettings: ToneSettings,
  ): Promise<string> {
    let response = '';

    // Phase 1: Select base content from the highest-priority playbook
    if (activePlaybooks.length > 0) {
      response = this.getPlaybookContent(activePlaybooks[0], context);
    } else {
      response = this.getFallbackResponse();
    }

    // Phase 2: Handle escalation messaging
    if (context.escalation.should_escalate) {
      response = this.appendEscalationMessage(response, context.escalation);
    }

    // Phase 3: Apply tone settings from sliders
    response = this.applyToneSettings(response, toneSettings);

    // Phase 4: Apply length constraints based on channel and detail slider
    response = this.applyLengthConstraints(response, toneSettings, context.channel);

    // Phase 5: Inject field prompts for missing data
    if (context.missingFields.length > 0 && !context.escalation.should_escalate) {
      response = this.injectFieldPrompt(response, context.missingFields);
    }

    logger.debug('Response composed', {
      playbookCount: activePlaybooks.length,
      responseLength: response.length,
      workflowStage: context.workflowStage,
    });

    return response;
  }

  /**
   * Applies tone adjustments based on slider settings:
   * - warmth: adds warm/compassionate language vs clinical precision
   * - formality: adjusts register from casual to formal
   * - empathy: adds empathetic acknowledgments
   * - urgency: adds time-sensitive language
   */
  applyToneSettings(response: string, toneSettings: ToneSettings): string {
    let adjusted = response;

    // Empathy adjustments
    if (toneSettings.empathy > 70) {
      if (!adjusted.startsWith('I understand') && !adjusted.startsWith('I appreciate')) {
        adjusted = `I understand how important this is to you. ${adjusted}`;
      }
    } else if (toneSettings.empathy < 30) {
      adjusted = adjusted
        .replace(/I understand how you feel\.\s*/g, '')
        .replace(/I'm sorry to hear that\.\s*/g, '');
    }

    // Formality adjustments
    if (toneSettings.formality > 70) {
      adjusted = adjusted
        .replace(/\bcan't\b/g, 'cannot')
        .replace(/\bdon't\b/g, 'do not')
        .replace(/\bwon't\b/g, 'will not')
        .replace(/\bHi!\b/g, 'Good day.');
    } else if (toneSettings.formality < 30) {
      adjusted = adjusted
        .replace(/\bcannot\b/g, "can't")
        .replace(/\bdo not\b/g, "don't")
        .replace(/\bGood day\.\b/g, 'Hi!');
    }

    // Urgency adjustments
    if (toneSettings.urgency > 70) {
      if (!adjusted.includes('soon') && !adjusted.includes('right away')) {
        adjusted += ' We have limited availability, so I recommend scheduling soon.';
      }
    }

    return adjusted;
  }

  /**
   * Applies length constraints based on the detail slider and channel.
   */
  applyLengthConstraints(
    response: string,
    toneSettings: ToneSettings,
    channel: Channel,
  ): string {
    // SMS has hard character limits
    const maxLength = channel === Channel.SMS ? 320 : this.getTargetLength(toneSettings.detail);

    if (response.length > maxLength) {
      const truncated = response.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf('.');
      if (lastPeriod > maxLength * 0.5) {
        return truncated.substring(0, lastPeriod + 1);
      }
      return truncated + '...';
    }

    return response;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private getTargetLength(detail: number): number {
    if (detail < 25) return 200;
    if (detail < 50) return 400;
    if (detail < 75) return 800;
    return 1500;
  }

  private getPlaybookContent(playbook: PlaybookRef, context: CompositionContext): string {
    // TODO: Load full playbook and evaluate steps based on conversation state
    const stageResponses: Record<string, string> = {
      [WorkflowStage.Greeting]:
        "Hello! Thank you for reaching out to our vein care center. I'm here to help you with scheduling, insurance questions, or any concerns about your vein health. How can I assist you today?",
      [WorkflowStage.DataCollection]:
        "Sure, I can definitely help with that.\nI'll just grab a couple quick details so I can get everything set up for you.\nWhat's your name?",
      [WorkflowStage.InsuranceCollection]:
        "We accept most major insurance plans. Could you share your insurance carrier name so I can look into your coverage options?",
      [WorkflowStage.Scheduling]:
        "I'd be happy to help you schedule a consultation. What day and time work best for you? We have availability at several locations.",
      [WorkflowStage.QuestionAnswering]:
        "That's a great question. Our board-certified specialists offer minimally invasive treatments for a range of vein conditions. Would you like to schedule a free consultation to discuss your options?",
      [WorkflowStage.FollowUp]:
        "Thank you for your visit. How are you feeling after your consultation? Do you have any questions about your treatment plan?",
      [WorkflowStage.Escalation]:
        "I'd like to connect you with one of our team members who can better assist you with this. Let me arrange that for you right away.",
      [WorkflowStage.ModifyBooking]:
        "I can help you with that. Could you provide me with the date or reference number for your existing appointment?",
    };

    return stageResponses[context.workflowStage] || stageResponses[WorkflowStage.Greeting];
  }

  private getFallbackResponse(): string {
    return "Thank you for reaching out. I'm here to help you with scheduling appointments, insurance questions, or learning more about our vein care services. What can I assist you with?";
  }

  private appendEscalationMessage(response: string, escalation: EscalationDecision): string {
    switch (escalation.suggested_action) {
      case 'handoff':
        return `${response}\n\nI'm going to connect you directly with one of our care coordinators who can help right away. Please hold on for just a moment.`;
      case 'callback':
        return `${response}\n\nI'd like to have one of our team members call you to discuss this further. What's the best number and time to reach you?`;
      default:
        return `${response}\n\nLet me connect you with someone who can help you more directly with this.`;
    }
  }

  private injectFieldPrompt(response: string, missingFields: ExtractableFieldName[]): string {
    const firstMissing = missingFields[0];

    const prompts: Record<string, string> = {
      full_name: 'By the way, could I get your full name?',
      phone_number: 'What is the best phone number to reach you at?',
      email: 'Would you like to share your email for appointment confirmations?',
      insurance_provider: 'Do you have insurance? If so, which carrier?',
      date_of_birth: 'For our records, could I also get your date of birth?',
      requested_location: 'Which of our clinic locations is most convenient for you?',
      requested_date_raw: 'What day works best for you to come in?',
    };

    const prompt = prompts[firstMissing];
    if (prompt) {
      return `${response} ${prompt}`;
    }

    return response;
  }
}
