/**
 * Background Job Worker
 *
 * Processes asynchronous tasks via Bull queues:
 * - SMS delivery
 * - Follow-up nudges
 * - CRM sync
 * - Insurance verification triggers
 * - Analytics event processing
 * - Scheduled follow-ups
 */

export interface JobDefinition {
  name: string;
  data: Record<string, unknown>;
  options?: {
    delay?: number;
    attempts?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay: number };
    priority?: number;
  };
}

export const QUEUE_NAMES = {
  SMS: 'sms',
  FOLLOW_UP: 'follow-up',
  CRM_SYNC: 'crm-sync',
  INSURANCE_VERIFICATION: 'insurance-verification',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
} as const;

export const JOB_TYPES = {
  // SMS Jobs
  SEND_MISSED_CALL_SMS: 'send-missed-call-sms',
  SEND_FOLLOW_UP_NUDGE: 'send-follow-up-nudge',
  SEND_CONFIRMATION_SMS: 'send-confirmation-sms',
  SEND_REMINDER_SMS: 'send-reminder-sms',

  // CRM Jobs
  SYNC_LEAD_TO_CRM: 'sync-lead-to-crm',
  SYNC_BOOKING_TO_CRM: 'sync-booking-to-crm',
  UPDATE_CRM_RECORD: 'update-crm-record',

  // Insurance Jobs
  TRIGGER_INSURANCE_VERIFICATION: 'trigger-insurance-verification',
  PROCESS_INSURANCE_CARD: 'process-insurance-card',

  // Analytics Jobs
  PROCESS_ANALYTICS_EVENT: 'process-analytics-event',
  AGGREGATE_DAILY_METRICS: 'aggregate-daily-metrics',
  PROCESS_AB_TEST_RESULT: 'process-ab-test-result',

  // Notification Jobs
  NOTIFY_HANDOFF_QUEUE: 'notify-handoff-queue',
  NOTIFY_CALLBACK_DUE: 'notify-callback-due',
} as const;

/**
 * Queue Manager
 *
 * Manages Bull queue instances and job processing.
 */
export class QueueManager {
  private queues: Map<string, unknown> = new Map();

  constructor(private redisUrl: string) {}

  /**
   * Initialize all queues
   */
  async initialize(): Promise<void> {
    for (const queueName of Object.values(QUEUE_NAMES)) {
      // TODO: Initialize Bull queue
      // const queue = new Bull(queueName, this.redisUrl);
      // this.queues.set(queueName, queue);
      this.queues.set(queueName, { name: queueName });
      console.log(`[Queue] Initialized queue: ${queueName}`);
    }
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName: string, job: JobDefinition): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    // TODO: Add job to Bull queue
    // const result = await queue.add(job.name, job.data, job.options);
    // return result.id;

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[Queue] Added job ${job.name} to ${queueName}: ${jobId}`);
    return jobId;
  }

  /**
   * Schedule a follow-up nudge
   */
  async scheduleFollowUp(
    conversationId: string,
    delayMinutes: number,
    templateId: string
  ): Promise<string> {
    return this.addJob(QUEUE_NAMES.FOLLOW_UP, {
      name: JOB_TYPES.SEND_FOLLOW_UP_NUDGE,
      data: { conversationId, templateId },
      options: {
        delay: delayMinutes * 60 * 1000,
        attempts: 1,
      },
    });
  }

  /**
   * Queue a CRM sync
   */
  async queueCrmSync(leadId: string, syncType: 'lead' | 'booking'): Promise<string> {
    const jobType = syncType === 'lead'
      ? JOB_TYPES.SYNC_LEAD_TO_CRM
      : JOB_TYPES.SYNC_BOOKING_TO_CRM;

    return this.addJob(QUEUE_NAMES.CRM_SYNC, {
      name: jobType,
      data: { leadId },
      options: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }

  /**
   * Queue an analytics event
   */
  async trackEvent(eventName: string, properties: Record<string, unknown>): Promise<void> {
    await this.addJob(QUEUE_NAMES.ANALYTICS, {
      name: JOB_TYPES.PROCESS_ANALYTICS_EVENT,
      data: { eventName, properties, timestamp: new Date().toISOString() },
    });
  }

  /**
   * Shut down all queues gracefully
   */
  async shutdown(): Promise<void> {
    for (const [name] of this.queues) {
      // TODO: Close Bull queue
      // await queue.close();
      console.log(`[Queue] Closed queue: ${name}`);
    }
  }
}

export default QueueManager;
