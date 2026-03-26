import { v4 as uuid } from 'uuid';
import {
  Channel,
  ConversationStatus,
  ParticipantRole,
  type MessageMetadata,
} from '../../shared/src/types/conversation';
import {
  RiskLevel,
  ComplexityLevel,
  WorkflowStage,
} from '../../shared/src/types/orchestration';
import {
  EscalationReason,
  EscalationPriority,
} from '../../shared/src/types/handoff';
import type { ToneSettings } from '../../shared/src/types/playbook';
import type { ExtractedField, ExtractableFieldName } from '../../shared/src/types/extraction';
import { PlaybookService } from './playbook.service';
import { PolicyService } from './policy.service';
import { ResponseComposerService } from './response-composer.service';
import { ExtractionService } from './extraction.service';
import { SliderService } from './slider.service';
import { AuditService } from './audit.service';
import {
  MessageFragmentationService,
  HUMAN_MODE_FRAGMENTATION_CONFIG,
  NO_FRAGMENTATION_CONFIG,
} from './message-fragmentation.service';
import type { FragmentationResult } from './message-fragmentation.service';
import { SliderPresetName } from '../../shared/src/types/slider';
import { logger } from '../index';

// ─── Internal types used by the orchestration engine ────────────────────────

export interface IntentClassification {
  intent: string;
  confidence: number;
  complexity: ComplexityLevel;
  risk_level: RiskLevel;
  secondary_intents?: string[];
}

export interface EscalationDecision {
  should_escalate: boolean;
  reason?: EscalationReason;
  priority: EscalationPriority;
  suggested_action?: 'handoff' | 'callback' | 'queue';
  context?: string;
}

export interface OrchestrationTrace {
  trace_id: string;
  conversation_id: string;
  timestamp: string;
  intent: IntentClassification;
  workflow_stage: WorkflowStage;
  active_playbook_ids: string[];
  policy_violations: string[];
  escalation: EscalationDecision;
  tone_settings: ToneSettings;
  duration_ms: number;
}

/**
 * OrchestrationService is the central coordinator for message processing.
 * It classifies intent, selects playbooks, checks policies, composes
 * the response, and produces a full orchestration trace for observability.
 */
export class OrchestrationService {
  private readonly fragmentationService: MessageFragmentationService;

  constructor(
    private readonly playbookService: PlaybookService,
    private readonly policyService: PolicyService,
    private readonly responseComposer: ResponseComposerService,
    private readonly extractionService: ExtractionService,
    private readonly sliderService: SliderService,
    private readonly auditService: AuditService,
  ) {
    this.fragmentationService = new MessageFragmentationService();
  }

  /**
   * Main entry point: receives a raw user message and orchestrates the
   * full pipeline from classification through response composition.
   */
  async processMessage(
    conversationId: string,
    message: { content: string; channel?: Channel },
  ): Promise<{ response: string; fragments: FragmentationResult; trace: OrchestrationTrace }> {
    const startTime = Date.now();
    const traceId = uuid();
    const channel = message.channel ?? Channel.WebChat;

    // TODO: Load conversation from Prisma
    const conversationState = await this.loadConversationState(conversationId);

    // Step 1 - Classify intent
    const intent = await this.classifyIntent(message.content, {
      messageHistory: conversationState.messages,
      channel,
    });

    // Step 2 - Determine workflow stage
    const workflowStage = this.determineWorkflowStage(conversationState);

    // Step 3 - Select active playbooks based on intent + context
    const activePlaybooks = await this.selectPlaybooks(intent, {
      workflowStage,
      channel,
    });

    // Step 4 - Evaluate whether escalation is needed
    const escalation = await this.evaluateEscalation(conversationState, intent);

    // Step 5 - Extract CRM fields from the new message
    const extractionResult = await this.extractionService.extractFields(
      message.content,
      conversationId,
      conversationState.leadId,
    );

    // Step 6 - Get effective slider/tone settings for this context
    const toneSettings = await this.sliderService.getEffectiveToneSettings(
      channel,
      activePlaybooks[0]?.id,
    );

    // Step 7 - Compose the response using playbooks + sliders + context
    let response = await this.responseComposer.composeResponse(
      activePlaybooks,
      {
        workflowStage,
        intent,
        escalation,
        channel,
        extractedFields: conversationState.extractedFields,
        missingFields: extractionResult.missingFields,
      },
      toneSettings,
    );

    // Step 8 - Check policies on the composed response
    const policyResult = await this.policyService.checkResponse(response, {
      activePlaybookIds: activePlaybooks.map(p => p.id),
    });

    if (policyResult.violations.length > 0) {
      logger.warn('Policy violations detected, applying corrections', {
        traceId,
        violations: policyResult.violations.map(v => v.ruleName),
      });
      if (policyResult.correctedResponse) {
        response = policyResult.correctedResponse;
      }
    }

    // Step 9 - Handle escalation if needed
    if (escalation.should_escalate) {
      logger.info('Escalation triggered', {
        traceId,
        reason: escalation.reason,
        priority: escalation.priority,
      });
      // TODO: Trigger handoff service
    }

    // Step 10 - Fragment response for Human Mode delivery
    const fragmentationConfig = await this.getFragmentationConfig(channel, activePlaybooks[0]?.id);
    const fragments = this.fragmentationService.fragment(response, fragmentationConfig);

    if (fragments.was_fragmented) {
      logger.info('Response fragmented for Human Mode delivery', {
        traceId,
        fragmentCount: fragments.fragments.length,
        totalDeliveryMs: fragments.total_delivery_ms,
      });
    }

    // Build the full trace
    const trace = this.buildOrchestrationTrace({
      traceId,
      conversationId,
      intent,
      workflowStage,
      activePlaybooks: activePlaybooks.map(p => p.id),
      policyViolations: policyResult.violations.map(v => v.ruleName),
      escalation,
      toneSettings,
      startTime,
    });

    // Audit log
    await this.auditService.log({
      entityType: 'conversation',
      entityId: conversationId,
      action: 'message_processed',
      who: 'system:orchestration',
      details: { traceId, intent: intent.intent, workflowStage },
    });

    return { response, fragments, trace };
  }

  /**
   * Classifies the user's intent from their message, considering
   * conversation history and channel context.
   */
  async classifyIntent(
    message: string,
    context: {
      messageHistory: Array<{ role: string; content: string }>;
      channel: Channel;
    },
  ): Promise<IntentClassification> {
    // TODO: Replace with LLM-based classification or ML model
    const lower = message.toLowerCase();

    let intent = 'unknown';
    let confidence = 0.5;
    let complexity = ComplexityLevel.Simple;
    let riskLevel = RiskLevel.Low;

    // Keyword-based classification stub
    if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('book')) {
      intent = 'schedule_appointment';
      confidence = 0.85;
      complexity = ComplexityLevel.Moderate;
    } else if (lower.includes('insurance') || lower.includes('coverage') || lower.includes('copay')) {
      intent = 'insurance_inquiry';
      confidence = 0.80;
      complexity = ComplexityLevel.Complex;
      riskLevel = RiskLevel.Medium;
    } else if (lower.includes('pain') || lower.includes('swollen') || lower.includes('symptom') || lower.includes('vein')) {
      intent = 'symptom_description';
      confidence = 0.75;
      complexity = ComplexityLevel.Moderate;
      riskLevel = RiskLevel.Medium;
    } else if (lower.includes('location') || lower.includes('near') || lower.includes('address') || lower.includes('where')) {
      intent = 'location_inquiry';
      confidence = 0.80;
    } else if (lower.includes('cost') || lower.includes('price') || lower.includes('how much')) {
      intent = 'pricing_inquiry';
      confidence = 0.80;
      riskLevel = RiskLevel.Medium;
    } else if (lower.includes('cancel')) {
      intent = 'cancel_appointment';
      confidence = 0.85;
      complexity = ComplexityLevel.Moderate;
    } else if (lower.includes('reschedule') || lower.includes('change appointment')) {
      intent = 'reschedule';
      confidence = 0.85;
      complexity = ComplexityLevel.Moderate;
    } else if (lower.includes('callback') || lower.includes('call me') || lower.includes('call back')) {
      intent = 'callback_request';
      confidence = 0.85;
    } else if (lower.includes('complaint') || lower.includes('unhappy') || lower.includes('terrible')) {
      intent = 'complaint';
      confidence = 0.75;
      riskLevel = RiskLevel.High;
      complexity = ComplexityLevel.Complex;
    }

    // Critical risk for emergency keywords
    if (lower.includes('emergency') || lower.includes('bleeding') || lower.includes('chest pain')) {
      riskLevel = RiskLevel.Critical;
      complexity = ComplexityLevel.ExceedsCapability;
    }

    // More history = slightly higher confidence
    if (context.messageHistory.length > 3) {
      confidence = Math.min(confidence + 0.05, 0.99);
    }

    return { intent, confidence, complexity, risk_level: riskLevel };
  }

  /**
   * Determines the current workflow stage based on conversation state.
   */
  determineWorkflowStage(state: ConversationState): WorkflowStage {
    const { messages, extractedFields, status } = state;

    if (messages.length === 0) {
      return WorkflowStage.Greeting;
    }

    if (status === 'escalated') {
      return WorkflowStage.Escalation;
    }

    const hasName = !!extractedFields['full_name'];
    const hasPhone = !!extractedFields['phone_number'];
    const hasInsurance = !!extractedFields['insurance_provider'];
    const hasDate = !!extractedFields['requested_date_normalized'];

    if (!hasName && !hasPhone) {
      return WorkflowStage.DataCollection;
    }

    if (!hasInsurance) {
      return WorkflowStage.InsuranceCollection;
    }

    if (hasInsurance && !hasDate) {
      return WorkflowStage.Scheduling;
    }

    if (hasDate) {
      return WorkflowStage.Scheduling;
    }

    return WorkflowStage.DataCollection;
  }

  /**
   * Selects which playbooks should be active for this turn.
   */
  async selectPlaybooks(
    intent: IntentClassification,
    context: { workflowStage: WorkflowStage; channel: Channel },
  ): Promise<Array<{ id: string; name: string; priority: number }>> {
    const allPlaybooks = await this.playbookService.getActivePlaybooks();
    const matched: Array<{ id: string; name: string; priority: number }> = [];

    for (const playbook of allPlaybooks) {
      for (const trigger of playbook.trigger_conditions) {
        let isMatch = false;

        switch (trigger.type) {
          case 'intent':
            isMatch = trigger.value === intent.intent;
            if (isMatch && trigger.confidence_threshold && intent.confidence < trigger.confidence_threshold) {
              isMatch = false;
            }
            break;
          case 'keyword':
            // Keyword triggers are handled during classification
            break;
          case 'status_change':
            // Handled by the workflow engine
            break;
          case 'fallback':
            isMatch = intent.intent === 'unknown';
            break;
        }

        if (isMatch) {
          matched.push({
            id: playbook.id,
            name: playbook.display_name,
            priority: trigger.priority ?? 50,
          });
          break;
        }
      }
    }

    return matched.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluates whether the conversation should be escalated to a human agent.
   */
  async evaluateEscalation(
    state: ConversationState,
    intent: IntentClassification,
  ): Promise<EscalationDecision> {
    if (intent.risk_level === RiskLevel.Critical) {
      return {
        should_escalate: true,
        reason: EscalationReason.MedicalEmergency,
        priority: EscalationPriority.Critical,
        suggested_action: 'handoff',
        context: 'Patient described emergency symptoms',
      };
    }

    if (intent.risk_level === RiskLevel.High && intent.confidence < 0.6) {
      return {
        should_escalate: true,
        reason: EscalationReason.LowConfidence,
        priority: EscalationPriority.High,
        suggested_action: 'callback',
        context: 'High risk intent with low classification confidence',
      };
    }

    if (intent.intent === 'complaint') {
      return {
        should_escalate: true,
        reason: EscalationReason.PatientDissatisfaction,
        priority: EscalationPriority.High,
        suggested_action: 'callback',
        context: 'Patient expressing complaint or dissatisfaction',
      };
    }

    if (state.messages.length > 20) {
      return {
        should_escalate: true,
        reason: EscalationReason.ConversationTimeout,
        priority: EscalationPriority.Medium,
        suggested_action: 'callback',
        context: 'Conversation exceeded 20 messages without resolution',
      };
    }

    return {
      should_escalate: false,
      priority: EscalationPriority.Low,
    };
  }

  /**
   * Builds the full orchestration trace for observability.
   */
  buildOrchestrationTrace(params: {
    traceId: string;
    conversationId: string;
    intent: IntentClassification;
    workflowStage: WorkflowStage;
    activePlaybooks: string[];
    policyViolations: string[];
    escalation: EscalationDecision;
    toneSettings: ToneSettings;
    startTime: number;
  }): OrchestrationTrace {
    return {
      trace_id: params.traceId,
      conversation_id: params.conversationId,
      timestamp: new Date().toISOString(),
      intent: params.intent,
      workflow_stage: params.workflowStage,
      active_playbook_ids: params.activePlaybooks,
      policy_violations: params.policyViolations,
      escalation: params.escalation,
      tone_settings: params.toneSettings,
      duration_ms: Date.now() - params.startTime,
    };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /**
   * Determines fragmentation config based on the active preset.
   * Returns Human Mode config when the Patient Coordinator (Human Mode)
   * preset is active; otherwise returns no-fragmentation passthrough.
   */
  private async getFragmentationConfig(
    channel: Channel | string,
    playbookId?: string,
  ) {
    // Check if the active preset is Human Mode by inspecting current tone settings.
    // Human Mode has very low formality (20) and very low detail (20) — a unique signature.
    const tone = await this.sliderService.getEffectiveToneSettings(channel, playbookId);
    const isHumanMode = tone.formality <= 25 && tone.detail <= 25;

    return isHumanMode ? HUMAN_MODE_FRAGMENTATION_CONFIG : NO_FRAGMENTATION_CONFIG;
  }

  private async loadConversationState(conversationId: string): Promise<ConversationState> {
    // TODO: Replace with Prisma query
    return {
      id: conversationId,
      channel: Channel.WebChat,
      status: 'active',
      leadId: undefined,
      messages: [],
      extractedFields: {},
    };
  }
}

/** Internal representation of conversation state for orchestration */
interface ConversationState {
  id: string;
  channel: Channel;
  status: string;
  leadId?: string;
  messages: Array<{ role: string; content: string }>;
  extractedFields: Record<string, string | null>;
}
