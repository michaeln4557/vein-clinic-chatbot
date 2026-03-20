import { v4 as uuid } from 'uuid';
import {
  HumanHandoff,
  HandoffStatus,
  EscalationReason,
  EscalationPriority,
  CallbackRequest,
  CallbackStatus,
  EscalationEvent,
} from '../../shared/src/types/handoff';
import { AuditService } from './audit.service';
import { logger } from '../index';

/**
 * HandoffService manages the transition of conversations from the
 * automated chatbot to human agents. Supports callback requests,
 * live transfers, and escalations with queue management.
 */
export class HandoffService {
  // In-memory stores - TODO: Replace with Prisma
  private handoffs: Map<string, HumanHandoff> = new Map();
  private callbacks: Map<string, CallbackRequest> = new Map();
  private escalationEvents: EscalationEvent[] = [];

  constructor(
    private readonly auditService: AuditService,
  ) {}

  /**
   * Creates a callback request for a conversation.
   */
  async requestCallback(
    conversationId: string,
    data: {
      leadId: string;
      phoneNumber: string;
      preferredTime?: string;
      reason?: string;
      contextSummary: string;
    },
  ): Promise<CallbackRequest> {
    const now = new Date().toISOString();

    const callback: CallbackRequest = {
      id: uuid(),
      lead_id: data.leadId,
      conversation_id: conversationId,
      status: CallbackStatus.Requested,
      phone_number: data.phoneNumber,
      preferred_time: data.preferredTime ?? null,
      scheduled_at: null,
      reason: data.reason ?? null,
      context_summary: data.contextSummary,
      attempt_count: 0,
      assigned_agent_id: null,
      created_at: now,
      updated_at: now,
      outcome_notes: null,
    };

    this.callbacks.set(callback.id, callback);

    // TODO: Push to notification queue (Bull) for agent assignment

    await this.auditService.log({
      entityType: 'callback_request',
      entityId: callback.id,
      action: 'created',
      who: 'system:handoff',
      details: { conversationId, preferredTime: data.preferredTime },
    });

    logger.info('Callback requested', { callbackId: callback.id, conversationId });
    return callback;
  }

  /**
   * Escalates a conversation to a human agent.
   */
  async escalateToHuman(
    conversationId: string,
    data: {
      leadId: string;
      reason: EscalationReason;
      priority: EscalationPriority;
      contextSummary: string;
      collectedData: Record<string, string | null>;
      activePlaybookId?: string;
      lastBotMessage?: string;
      triggerMessageId: string;
    },
  ): Promise<HumanHandoff> {
    const now = new Date().toISOString();

    const handoff: HumanHandoff = {
      id: uuid(),
      conversation_id: conversationId,
      lead_id: data.leadId,
      status: HandoffStatus.Requested,
      reason: data.reason,
      priority: data.priority,
      agent_id: null,
      context_summary: data.contextSummary,
      collected_data: data.collectedData,
      active_playbook_id: data.activePlaybookId ?? null,
      last_bot_message: data.lastBotMessage ?? null,
      estimated_wait_seconds: null,
      requested_at: now,
      assigned_at: null,
      completed_at: null,
      resolution_notes: null,
    };

    this.handoffs.set(handoff.id, handoff);

    // Record escalation event
    const event: EscalationEvent = {
      id: uuid(),
      conversation_id: conversationId,
      lead_id: data.leadId,
      reason: data.reason,
      priority: data.priority,
      trigger_message_id: data.triggerMessageId,
      handoff_id: handoff.id,
      callback_request_id: null,
      resulted_in_handoff: true,
      action_taken: 'handoff',
      context: { contextSummary: data.contextSummary },
      timestamp: now,
    };
    this.escalationEvents.push(event);

    // TODO: Send real-time alert to available agents via WebSocket

    await this.auditService.log({
      entityType: 'handoff',
      entityId: handoff.id,
      action: 'escalated',
      who: 'system:handoff',
      details: { conversationId, reason: data.reason, priority: data.priority },
    });

    logger.warn('Conversation escalated to human', {
      handoffId: handoff.id, conversationId, reason: data.reason,
    });

    return handoff;
  }

  /**
   * Returns the queue of pending handoffs.
   */
  async getHandoffQueue(type?: 'handoff' | 'callback'): Promise<{
    handoffs: HumanHandoff[];
    callbacks: CallbackRequest[];
    total: number;
  }> {
    const pendingHandoffs: HumanHandoff[] = [];
    const pendingCallbacks: CallbackRequest[] = [];

    if (!type || type === 'handoff') {
      for (const h of this.handoffs.values()) {
        if (h.status === HandoffStatus.Requested || h.status === HandoffStatus.AgentAssigned) {
          pendingHandoffs.push(h);
        }
      }
    }

    if (!type || type === 'callback') {
      for (const c of this.callbacks.values()) {
        if (c.status === CallbackStatus.Requested || c.status === CallbackStatus.Scheduled) {
          pendingCallbacks.push(c);
        }
      }
    }

    pendingHandoffs.sort((a, b) => a.requested_at.localeCompare(b.requested_at));
    pendingCallbacks.sort((a, b) => a.created_at.localeCompare(b.created_at));

    return {
      handoffs: pendingHandoffs,
      callbacks: pendingCallbacks,
      total: pendingHandoffs.length + pendingCallbacks.length,
    };
  }

  /**
   * Assigns a handoff to a specific agent.
   */
  async assignAgent(handoffId: string, agentId: string): Promise<HumanHandoff> {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff not found: ${handoffId}`);
    if (handoff.status !== HandoffStatus.Requested) {
      throw new Error(`Handoff is not in requested status (current: ${handoff.status})`);
    }

    handoff.status = HandoffStatus.AgentAssigned;
    handoff.agent_id = agentId;
    handoff.assigned_at = new Date().toISOString();
    this.handoffs.set(handoffId, handoff);

    await this.auditService.log({
      entityType: 'handoff',
      entityId: handoffId,
      action: 'assigned',
      who: agentId,
      details: { agentId },
    });

    logger.info('Handoff assigned', { handoffId, agentId });
    return handoff;
  }

  /**
   * Marks a handoff as resolved.
   */
  async resolveHandoff(handoffId: string, resolutionNotes?: string): Promise<HumanHandoff> {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff not found: ${handoffId}`);
    if (handoff.status === HandoffStatus.Completed) throw new Error('Already resolved');

    handoff.status = HandoffStatus.Completed;
    handoff.completed_at = new Date().toISOString();
    handoff.resolution_notes = resolutionNotes ?? null;
    this.handoffs.set(handoffId, handoff);

    await this.auditService.log({
      entityType: 'handoff',
      entityId: handoffId,
      action: 'resolved',
      who: handoff.agent_id ?? 'system',
      details: { resolutionNotes },
    });

    logger.info('Handoff resolved', { handoffId, agentId: handoff.agent_id });
    return handoff;
  }
}
