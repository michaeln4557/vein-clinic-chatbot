import { v4 as uuid } from 'uuid';
import { LocationService } from './location.service';
import { AuditService } from './audit.service';
import { logger } from '../index';

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  locationId?: string;
  variables: string[];
}

/**
 * SmsService handles all outbound SMS messaging through Twilio.
 * Supports templated messages with location-specific customization,
 * missed call recovery, follow-ups, and appointment confirmations.
 */
export class SmsService {
  // TODO: Inject actual Twilio client
  // private twilioClient: Twilio;

  constructor(
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
  ) {
    // TODO: Initialize Twilio client
    // this.twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  /**
   * Sends an SMS to a missed caller using the location-specific template.
   */
  async sendMissedCallSms(phoneNumber: string, locationId: string): Promise<SmsResult> {
    const template = await this.getTemplateForLocation('missed_call', locationId);
    if (!template) {
      return { success: false, error: `No missed_call template for location ${locationId}`, sentAt: new Date().toISOString() };
    }

    const location = await this.locationService.getLocationConfig(locationId);
    const locationName = location?.display_name || 'our clinic';

    const body = this.interpolateTemplate(template.body, {
      location_name: locationName,
      phone: location?.phone || '',
    });

    return this.sendSms(phoneNumber, body, 'missed_call', locationId);
  }

  /**
   * Sends a follow-up SMS for an idle conversation.
   */
  async sendFollowUp(conversationId: string): Promise<SmsResult> {
    // TODO: Load conversation from database to get phone number and location
    logger.info('Follow-up SMS requested', { conversationId });
    return {
      success: false,
      error: 'Not yet wired: conversation lookup required',
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Sends a booking confirmation SMS.
   */
  async sendConfirmation(bookingId: string): Promise<SmsResult> {
    // TODO: Load booking and related data from database
    logger.info('Confirmation SMS requested', { bookingId });
    return {
      success: false,
      error: 'Not yet wired: booking lookup required',
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Returns the SMS template for a given template name and location.
   */
  async getTemplateForLocation(
    templateName: string,
    locationId: string,
  ): Promise<SmsTemplate | null> {
    // TODO: Load location-specific templates from database
    const defaults: Record<string, string> = {
      missed_call: "Hi! We noticed you called {location_name}. We'd love to help you schedule a free vein consultation. Reply to get started!",
      follow_up: "Hi! We wanted to follow up on your recent inquiry about vein care. Would you like to schedule a consultation? Reply YES.",
      confirmation: "Your appointment at {location_name} is confirmed for {date} at {time}. Reply C to confirm or R to reschedule.",
      reminder: "Reminder: Your appointment at {location_name} is tomorrow at {time}. Reply C to confirm or R to reschedule.",
    };

    if (defaults[templateName]) {
      return {
        id: `default-${templateName}`,
        name: templateName,
        body: defaults[templateName],
        variables: this.extractTemplateVariables(defaults[templateName]),
      };
    }

    return null;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async sendSms(
    to: string,
    body: string,
    messageType: string,
    locationId?: string,
  ): Promise<SmsResult> {
    const normalizedPhone = this.normalizePhone(to);
    if (!normalizedPhone) {
      return { success: false, error: 'Invalid phone number format', sentAt: new Date().toISOString() };
    }

    if (body.length > 1600) {
      logger.warn('SMS body exceeds 1600 characters, truncating', { originalLength: body.length });
      body = body.substring(0, 1597) + '...';
    }

    try {
      // TODO: Send via Twilio
      // const message = await this.twilioClient.messages.create({
      //   to: normalizedPhone,
      //   from: process.env.TWILIO_FROM_NUMBER,
      //   body,
      // });

      const messageId = `msg-${uuid().substring(0, 8)}`;

      await this.auditService.log({
        entityType: 'conversation', // SMS messages relate to conversations
        entityId: messageId,
        action: 'sms_sent',
        who: 'system:sms',
        details: { to: normalizedPhone, messageType, locationId, bodyLength: body.length },
      });

      logger.info('SMS sent', { messageId, to: normalizedPhone, type: messageType });
      return { success: true, messageId, sentAt: new Date().toISOString() };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMS error';
      logger.error('SMS send failed', { to: normalizedPhone, error: errorMessage });
      return { success: false, error: errorMessage, sentAt: new Date().toISOString() };
    }
  }

  private normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  private extractTemplateVariables(template: string): string[] {
    const matches = template.match(/\{(\w+)\}/g);
    return matches ? matches.map(m => m.replace(/[{}]/g, '')) : [];
  }
}
