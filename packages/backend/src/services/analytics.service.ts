import { v4 as uuid } from 'uuid';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsMetric,
} from '../../shared/src/types/analytics';
import type { Channel } from '../../shared/src/types/conversation';
import type { WorkflowStage } from '../../shared/src/types/orchestration';
import { logger } from '../index';

/** Date range filter for analytics queries */
export interface DateRange {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

/** Conversion funnel metrics */
export interface ConversionMetrics {
  totalConversations: number;
  bookingsCreated: number;
  bookingsConfirmed: number;
  conversionRate: number;
  averageTimeToBookingSeconds: number;
  byChannel: Record<string, { total: number; converted: number; rate: number }>;
}

/** Stage-level drop-off analysis */
export interface DropOffAnalysis {
  stage: string;
  dropOffCount: number;
  dropOffRate: number;
  averageMessagesBeforeDrop: number;
  commonLastIntent: string;
}

/** A/B test results with statistical significance */
export interface ABTestResult {
  testId: string;
  variantA: { name: string; conversions: number; total: number; rate: number };
  variantB: { name: string; conversions: number; total: number; rate: number };
  significanceLevel: number;
  winner: 'A' | 'B' | 'inconclusive';
}

/**
 * AnalyticsService tracks events and computes metrics for the chatbot
 * platform. Provides insights into missed call recovery, conversion
 * funnels, drop-off analysis, and A/B test results.
 */
export class AnalyticsService {
  // In-memory event store - TODO: Replace with analytics DB (ClickHouse, BigQuery)
  private events: AnalyticsEvent[] = [];

  /**
   * Records an analytics event.
   */
  async trackEvent(event: {
    eventType: AnalyticsEventType;
    conversationId?: string;
    leadId?: string;
    userId?: string;
    channel?: string;
    data?: Record<string, unknown>;
    value?: number;
  }): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      id: uuid(),
      event_type: event.eventType,
      timestamp: new Date().toISOString(),
      conversation_id: event.conversationId ?? null,
      lead_id: event.leadId ?? null,
      user_id: event.userId ?? null,
      channel: event.channel ?? null,
      data: event.data ?? {},
      value: event.value ?? null,
      session_id: null,
    };

    // TODO: Persist to analytics database
    this.events.push(analyticsEvent);

    logger.debug('Analytics event tracked', {
      eventType: event.eventType,
      conversationId: event.conversationId,
    });
  }

  /**
   * Computes the missed call recovery rate.
   */
  async getMissedCallRecoveryRate(dateRange: DateRange): Promise<{
    totalMissedCalls: number;
    smsEngaged: number;
    conversationsStarted: number;
    bookingsCreated: number;
    recoveryRate: number;
    engagementRate: number;
  }> {
    // TODO: Query from analytics database with date filtering
    const totalMissedCalls = 150;
    const smsEngaged = 95;
    const conversationsStarted = 72;
    const bookingsCreated = 28;

    return {
      totalMissedCalls,
      smsEngaged,
      conversationsStarted,
      bookingsCreated,
      recoveryRate: Math.round((bookingsCreated / totalMissedCalls) * 100) / 100,
      engagementRate: Math.round((smsEngaged / totalMissedCalls) * 100) / 100,
    };
  }

  /**
   * Returns conversion metrics across the funnel, broken down by channel.
   */
  async getConversionMetrics(filters: {
    dateRange?: DateRange;
    channel?: string;
    locationId?: string;
  }): Promise<ConversionMetrics> {
    // TODO: Query from analytics database
    return {
      totalConversations: 500,
      bookingsCreated: 120,
      bookingsConfirmed: 95,
      conversionRate: 0.19,
      averageTimeToBookingSeconds: 480,
      byChannel: {
        web_chat: { total: 300, converted: 75, rate: 0.25 },
        sms: { total: 120, converted: 30, rate: 0.25 },
      },
    };
  }

  /**
   * Analyzes where conversations drop off in the workflow funnel.
   */
  async getDropOffAnalysis(filters: {
    dateRange?: DateRange;
    channel?: string;
  }): Promise<DropOffAnalysis[]> {
    // TODO: Compute from actual conversation data
    return [
      { stage: 'greeting', dropOffCount: 50, dropOffRate: 0.10, averageMessagesBeforeDrop: 1, commonLastIntent: 'unknown' },
      { stage: 'data_collection', dropOffCount: 80, dropOffRate: 0.18, averageMessagesBeforeDrop: 5, commonLastIntent: 'general_question' },
      { stage: 'insurance_collection', dropOffCount: 60, dropOffRate: 0.15, averageMessagesBeforeDrop: 7, commonLastIntent: 'insurance_inquiry' },
      { stage: 'scheduling', dropOffCount: 25, dropOffRate: 0.08, averageMessagesBeforeDrop: 9, commonLastIntent: 'schedule_appointment' },
    ];
  }

  /**
   * Returns results for an A/B test.
   */
  async getABTestResults(testId: string): Promise<ABTestResult> {
    // TODO: Query actual A/B test data and compute significance
    const variantA = { name: 'Control', conversions: 45, total: 250, rate: 0.18 };
    const variantB = { name: 'Variant', conversions: 62, total: 250, rate: 0.248 };

    const pooledRate = (variantA.conversions + variantB.conversions) / (variantA.total + variantB.total);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / variantA.total + 1 / variantB.total));
    const zScore = Math.abs(variantA.rate - variantB.rate) / se;
    const isSignificant = zScore > 1.96;

    return {
      testId,
      variantA,
      variantB,
      significanceLevel: isSignificant ? 0.95 : 0.5 + (zScore / 1.96) * 0.45,
      winner: isSignificant ? (variantA.rate > variantB.rate ? 'A' : 'B') : 'inconclusive',
    };
  }
}
