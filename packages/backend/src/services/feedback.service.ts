import { v4 as uuid } from 'uuid';
import {
  OperatorFeedback,
  FeedbackActionType,
  FeedbackScope,
  FeedbackStatus,
} from '../../shared/src/types/operator';
import { AuditService } from './audit.service';
import { logger } from '../index';

/**
 * FeedbackService manages the collection and processing of quality
 * feedback on chatbot responses. Operators can submit corrections,
 * flag problematic responses, or provide ratings that feed into
 * continuous improvement workflows.
 */
export class FeedbackService {
  // In-memory store - TODO: Replace with Prisma
  private feedbackEntries: Map<string, OperatorFeedback> = new Map();

  constructor(
    private readonly auditService: AuditService,
  ) {}

  /**
   * Submits new operator feedback.
   */
  async submitFeedback(feedback: {
    operator_id: string;
    action_type: FeedbackActionType;
    scope: FeedbackScope;
    conversation_id?: string;
    message_id?: string;
    playbook_id?: string;
    original_response?: string;
    corrected_response?: string;
    explanation: string;
    rating?: number;
    slider_adjustments?: Record<string, number>;
  }): Promise<OperatorFeedback> {
    const now = new Date().toISOString();
    const entry: OperatorFeedback = {
      id: uuid(),
      operator_id: feedback.operator_id,
      action_type: feedback.action_type,
      scope: feedback.scope,
      status: FeedbackStatus.Submitted,
      conversation_id: feedback.conversation_id ?? null,
      message_id: feedback.message_id ?? null,
      playbook_id: feedback.playbook_id ?? null,
      original_response: feedback.original_response ?? null,
      corrected_response: feedback.corrected_response ?? null,
      explanation: feedback.explanation,
      rating: feedback.rating ?? null,
      slider_adjustments: feedback.slider_adjustments ?? null,
      action_data: {},
      reviewed_by: null,
      review_notes: null,
      submitted_at: now,
      reviewed_at: null,
      applied_at: null,
    };

    this.feedbackEntries.set(entry.id, entry);

    await this.auditService.log({
      entityType: 'operator_feedback',
      entityId: entry.id,
      action: 'created',
      who: feedback.operator_id,
      details: { action_type: feedback.action_type, scope: feedback.scope },
    });

    logger.info('Feedback submitted', { feedbackId: entry.id, type: feedback.action_type });
    return entry;
  }

  /**
   * Returns all feedback entries for a specific conversation.
   */
  async getFeedbackForConversation(conversationId: string): Promise<OperatorFeedback[]> {
    const results: OperatorFeedback[] = [];
    for (const entry of this.feedbackEntries.values()) {
      if (entry.conversation_id === conversationId) results.push(entry);
    }
    return results.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  }

  /**
   * Returns the queue of feedback entries awaiting review.
   */
  async getReviewQueue(filters: {
    action_type?: FeedbackActionType;
    scope?: FeedbackScope;
    limit?: number;
  }): Promise<{ entries: OperatorFeedback[]; total: number }> {
    let pending: OperatorFeedback[] = [];

    for (const entry of this.feedbackEntries.values()) {
      if (entry.status !== FeedbackStatus.Submitted) continue;
      if (filters.action_type && entry.action_type !== filters.action_type) continue;
      if (filters.scope && entry.scope !== filters.scope) continue;
      pending.push(entry);
    }

    pending.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
    const total = pending.length;
    const limit = filters.limit || 50;

    return { entries: pending.slice(0, limit), total };
  }

  /**
   * Processes a feedback entry by applying a review decision.
   */
  async processFeedback(
    feedbackId: string,
    action: {
      status: 'accepted' | 'rejected' | 'partially_applied';
      review_notes: string;
      reviewerId: string;
    },
  ): Promise<OperatorFeedback> {
    const entry = this.feedbackEntries.get(feedbackId);
    if (!entry) throw new Error(`Feedback not found: ${feedbackId}`);
    if (entry.status !== FeedbackStatus.Submitted) {
      throw new Error(`Feedback ${feedbackId} is not in submitted status`);
    }

    const now = new Date().toISOString();
    entry.status = action.status as FeedbackStatus;
    entry.reviewed_by = action.reviewerId;
    entry.review_notes = action.review_notes;
    entry.reviewed_at = now;

    if (action.status === 'accepted') {
      entry.applied_at = now;
      // TODO: Apply the feedback (update playbook, add phrases, adjust sliders)
      logger.info('Feedback accepted and queued for application', { feedbackId });
    }

    this.feedbackEntries.set(feedbackId, entry);

    await this.auditService.log({
      entityType: 'operator_feedback',
      entityId: feedbackId,
      action: `reviewed_${action.status}`,
      who: action.reviewerId,
      details: { review_notes: action.review_notes },
    });

    logger.info('Feedback processed', { feedbackId, status: action.status });
    return entry;
  }
}
