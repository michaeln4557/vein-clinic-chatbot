/**
 * Twilio SMS Adapter
 *
 * Handles all SMS communication through Twilio:
 * - Sending missed-call recovery messages
 * - Sending follow-up nudges
 * - Sending booking confirmations
 * - Receiving inbound SMS messages
 * - Template rendering with location-specific data
 */

export interface SmsMessage {
  to: string;
  from?: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  category: 'missed_call' | 'follow_up' | 'confirmation' | 'reminder' | 'general';
  active: boolean;
  ab_test_variant?: string;
}

export interface InboundSmsPayload {
  from: string;
  to: string;
  body: string;
  numMedia: number;
  mediaUrls: string[];
  messageSid: string;
  timestamp: Date;
}

export class TwilioAdapter {
  private accountSid: string;
  private authToken: string;
  private defaultFromNumber: string;

  constructor(config: {
    accountSid: string;
    authToken: string;
    defaultFromNumber: string;
  }) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.defaultFromNumber = config.defaultFromNumber;
  }

  /**
   * Send an SMS message via Twilio
   */
  async sendMessage(message: SmsMessage): Promise<{ sid: string; status: string }> {
    // TODO: Replace with actual Twilio SDK call
    // const client = twilio(this.accountSid, this.authToken);
    // const result = await client.messages.create({
    //   to: message.to,
    //   from: message.from || this.defaultFromNumber,
    //   body: message.body,
    //   mediaUrl: message.mediaUrl,
    //   statusCallback: message.statusCallback,
    // });

    console.log(`[SMS] Sending to ${message.to}: ${message.body.substring(0, 50)}...`);

    return {
      sid: `SM_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'queued',
    };
  }

  /**
   * Send a missed-call recovery SMS
   */
  async sendMissedCallRecovery(
    phoneNumber: string,
    template: SmsTemplate,
    variables: Record<string, string>
  ): Promise<{ sid: string; status: string; templateId: string }> {
    const body = this.renderTemplate(template.body, variables);
    const result = await this.sendMessage({
      to: phoneNumber,
      body,
    });
    return { ...result, templateId: template.id };
  }

  /**
   * Send a follow-up nudge
   */
  async sendFollowUp(
    phoneNumber: string,
    template: SmsTemplate,
    variables: Record<string, string>
  ): Promise<{ sid: string; status: string }> {
    const body = this.renderTemplate(template.body, variables);
    return this.sendMessage({ to: phoneNumber, body });
  }

  /**
   * Send a booking confirmation
   */
  async sendBookingConfirmation(
    phoneNumber: string,
    bookingDetails: {
      patientName: string;
      locationName: string;
      locationAddress: string;
      date: string;
      time: string;
      isProvisional: boolean;
    }
  ): Promise<{ sid: string; status: string }> {
    const statusText = bookingDetails.isProvisional
      ? 'Your appointment has been provisionally scheduled. We will confirm after insurance verification.'
      : 'Your appointment is confirmed.';

    const body = [
      `Hi ${bookingDetails.patientName},`,
      '',
      statusText,
      '',
      `Location: ${bookingDetails.locationName}`,
      `Address: ${bookingDetails.locationAddress}`,
      `Date: ${bookingDetails.date}`,
      `Time: ${bookingDetails.time}`,
      '',
      'If you need to make changes, reply to this message or call us.',
    ].join('\n');

    return this.sendMessage({ to: phoneNumber, body });
  }

  /**
   * Parse an inbound Twilio webhook payload
   */
  parseInboundWebhook(body: Record<string, string>): InboundSmsPayload {
    const numMedia = parseInt(body.NumMedia || '0', 10);
    const mediaUrls: string[] = [];

    for (let i = 0; i < numMedia; i++) {
      const url = body[`MediaUrl${i}`];
      if (url) mediaUrls.push(url);
    }

    return {
      from: body.From,
      to: body.To,
      body: body.Body || '',
      numMedia,
      mediaUrls,
      messageSid: body.MessageSid,
      timestamp: new Date(),
    };
  }

  /**
   * Render a template with variable substitution
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }

  /**
   * Validate webhook signature for security
   */
  validateWebhookSignature(
    _signature: string,
    _url: string,
    _params: Record<string, string>
  ): boolean {
    // TODO: Implement Twilio signature validation
    // const twilio = require('twilio');
    // return twilio.validateRequest(this.authToken, signature, url, params);
    return true;
  }
}

export default TwilioAdapter;
