import { v4 as uuid } from 'uuid';
import {
  ExtractedField,
  ExtractableFieldName,
  VerificationStatus,
  CrmReadyState,
  CrmSyncPayload,
} from '../../shared/src/types/extraction';
import { REQUIRED_CRM_FIELDS, OPTIONAL_CRM_FIELDS } from '../../shared/src/constants';
import { AuditService } from './audit.service';
import { logger } from '../index';

/**
 * ExtractionService is responsible for pulling structured CRM fields
 * from unstructured conversation messages. It tracks extraction state
 * per conversation and determines CRM readiness.
 */
export class ExtractionService {
  // In-memory extraction state - TODO: Replace with Prisma
  private extractionsByConversation: Map<string, ExtractedField[]> = new Map();

  constructor(
    private readonly auditService: AuditService,
  ) {}

  /**
   * Extracts CRM-relevant fields from a user message and stores them.
   * Returns the newly extracted fields and the current missing fields list.
   */
  async extractFields(
    message: string,
    conversationId: string,
    leadId?: string,
  ): Promise<{
    extracted: ExtractedField[];
    missingFields: ExtractableFieldName[];
    crmReadyState: CrmReadyState;
  }> {
    const existing = this.extractionsByConversation.get(conversationId) || [];
    const newExtractions: ExtractedField[] = [];
    const now = new Date().toISOString();
    const messageId = uuid(); // TODO: use actual message ID

    // ─── Pattern-based extraction (to be replaced with LLM) ─────────────

    // Phone number
    const phoneMatch = message.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      newExtractions.push(this.createField({
        field_name: 'phone_number',
        raw_value: phoneMatch[0],
        normalized_value: this.normalizePhone(phoneMatch[0]),
        confidence: 0.95,
        source_text: message,
        source_message_id: messageId,
        timestamp: now,
        conversation_id: conversationId,
        lead_id: leadId ?? conversationId,
      }));
    }

    // Email
    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      newExtractions.push(this.createField({
        field_name: 'email',
        raw_value: emailMatch[0],
        normalized_value: emailMatch[0].toLowerCase().trim(),
        confidence: 0.95,
        source_text: message,
        source_message_id: messageId,
        timestamp: now,
        conversation_id: conversationId,
        lead_id: leadId ?? conversationId,
      }));
    }

    // Date of birth
    const dobMatch = message.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (dobMatch) {
      newExtractions.push(this.createField({
        field_name: 'date_of_birth',
        raw_value: dobMatch[0],
        normalized_value: this.normalizeDob(dobMatch[0]),
        confidence: 0.80,
        source_text: message,
        source_message_id: messageId,
        timestamp: now,
        conversation_id: conversationId,
        lead_id: leadId ?? conversationId,
      }));
    }

    // Name extraction
    const nameMatch = message.match(
      /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    );
    if (nameMatch) {
      newExtractions.push(this.createField({
        field_name: 'full_name',
        raw_value: nameMatch[1],
        normalized_value: nameMatch[1].trim(),
        confidence: 0.85,
        source_text: message,
        source_message_id: messageId,
        timestamp: now,
        conversation_id: conversationId,
        lead_id: leadId ?? conversationId,
      }));
    }

    // Insurance carrier
    const carriers = [
      'Aetna', 'UnitedHealthcare', 'United Healthcare', 'Blue Cross',
      'Blue Shield', 'BCBS', 'Cigna', 'Humana', 'Kaiser', 'Medicare',
      'Medicaid', 'Tricare', 'Anthem',
    ];
    for (const carrier of carriers) {
      if (message.toLowerCase().includes(carrier.toLowerCase())) {
        const normalized = this.normalizeInsuranceCarrier(carrier);
        newExtractions.push(this.createField({
          field_name: 'insurance_provider',
          raw_value: carrier,
          normalized_value: normalized,
          confidence: 0.90,
          source_text: message,
          source_message_id: messageId,
          timestamp: now,
          conversation_id: conversationId,
          lead_id: leadId ?? conversationId,
        }));
        break;
      }
    }

    // Store new extractions
    const all = [...existing, ...newExtractions];
    this.extractionsByConversation.set(conversationId, all);

    // Compute missing fields
    const extracted = this.getLatestFieldMap(all);
    const missingFields = this.computeMissingFields(extracted);
    const crmReadyState = this.computeReadyState(extracted);

    logger.debug('Extraction complete', {
      newFields: newExtractions.length,
      missingFields,
      crmReadyState,
    });

    return { extracted: newExtractions, missingFields, crmReadyState };
  }

  /**
   * Normalizes a raw extracted value into a canonical form.
   */
  normalizeField(fieldName: ExtractableFieldName, rawValue: string): string | null {
    switch (fieldName) {
      case 'phone_number': return this.normalizePhone(rawValue);
      case 'email': return rawValue.toLowerCase().trim();
      case 'full_name': return rawValue.trim();
      case 'date_of_birth': return this.normalizeDob(rawValue);
      case 'insurance_provider': return this.normalizeInsuranceCarrier(rawValue);
      default: return rawValue.trim();
    }
  }

  /**
   * Returns the current extraction state for a conversation.
   */
  async getExtractionStatus(conversationId: string): Promise<{
    fieldsExtracted: number;
    totalRequired: number;
    crmReadyState: CrmReadyState;
  }> {
    const all = this.extractionsByConversation.get(conversationId) || [];
    const fieldMap = this.getLatestFieldMap(all);
    return {
      fieldsExtracted: Object.keys(fieldMap).length,
      totalRequired: REQUIRED_CRM_FIELDS.length,
      crmReadyState: this.computeReadyState(fieldMap),
    };
  }

  /**
   * Returns the list of required fields that are still missing.
   */
  async getMissingFields(conversationId: string): Promise<ExtractableFieldName[]> {
    const all = this.extractionsByConversation.get(conversationId) || [];
    const fieldMap = this.getLatestFieldMap(all);
    return this.computeMissingFields(fieldMap);
  }

  /**
   * Suggests the next best question to ask based on missing fields.
   */
  async getRecommendedNextQuestion(conversationId: string): Promise<string | null> {
    const missing = await this.getMissingFields(conversationId);
    if (missing.length === 0) return null;

    const priority: Record<string, number> = {
      full_name: 1, phone_number: 2, insurance_provider: 3,
      email: 4, date_of_birth: 5, requested_location: 6,
    };

    const sorted = [...missing].sort(
      (a, b) => (priority[a] ?? 99) - (priority[b] ?? 99),
    );

    const questions: Record<string, string> = {
      full_name: "Could I get your full name?",
      phone_number: "What's the best phone number to reach you?",
      insurance_provider: "Which insurance carrier do you have?",
      email: "Would you like to share your email for appointment confirmations?",
      date_of_birth: "For our records, what is your date of birth?",
      requested_location: "Which of our clinic locations is most convenient for you?",
    };

    return questions[sorted[0]] || null;
  }

  /**
   * Builds the CRM sync payload from extracted fields.
   */
  async getCrmPayload(conversationId: string): Promise<CrmSyncPayload> {
    const all = this.extractionsByConversation.get(conversationId) || [];
    const fieldMap = this.getLatestFieldMap(all);
    const allFieldNames: ExtractableFieldName[] = [...REQUIRED_CRM_FIELDS, ...OPTIONAL_CRM_FIELDS] as ExtractableFieldName[];

    const fields: CrmSyncPayload['fields'] = {} as any;
    for (const name of allFieldNames) {
      const field = fieldMap[name];
      fields[name] = {
        value: field?.verified_value ?? field?.normalized_value ?? field?.raw_value ?? null,
        confidence: field?.confidence ?? 0,
        verification_status: field?.verification_status ?? VerificationStatus.Missing,
      };
    }

    const missingFields = this.computeMissingFields(fieldMap);
    const conflicting = all
      .filter(f => f.verification_status === VerificationStatus.Conflicting)
      .map(f => f.field_name);

    return {
      lead_id: all[0]?.lead_id ?? conversationId,
      ready_state: this.computeReadyState(fieldMap),
      fields,
      conversation_id: conversationId,
      sync_timestamp: new Date().toISOString(),
      missing_fields: missingFields,
      conflicting_fields: [...new Set(conflicting)],
    };
  }

  /**
   * Returns the CRM readiness state for a conversation.
   */
  async getCrmReadyState(conversationId: string): Promise<{
    ready: boolean;
    state: CrmReadyState;
    missingRequired: ExtractableFieldName[];
  }> {
    const all = this.extractionsByConversation.get(conversationId) || [];
    const fieldMap = this.getLatestFieldMap(all);
    const state = this.computeReadyState(fieldMap);
    const missing = this.computeMissingFields(fieldMap);

    return {
      ready: state === CrmReadyState.ReadyForLeadSync || state === CrmReadyState.ReadyForSchedulingSync,
      state,
      missingRequired: missing,
    };
  }

  /**
   * Allows an operator to manually override an extracted field value.
   */
  async overrideField(
    conversationId: string,
    fieldName: ExtractableFieldName,
    value: string,
    operatorId: string,
  ): Promise<ExtractedField> {
    const field = this.createField({
      field_name: fieldName,
      raw_value: value,
      normalized_value: value,
      confidence: 1.0,
      source_text: `Manual override by ${operatorId}`,
      source_message_id: 'override',
      timestamp: new Date().toISOString(),
      conversation_id: conversationId,
      lead_id: conversationId,
    });
    field.verified_value = value;
    field.verification_status = VerificationStatus.Verified;

    const existing = this.extractionsByConversation.get(conversationId) || [];
    existing.push(field);
    this.extractionsByConversation.set(conversationId, existing);

    await this.auditService.log({
      entityType: 'lead',
      entityId: conversationId,
      action: 'field_overridden',
      who: operatorId,
      details: { fieldName, value },
    });

    logger.info('Field overridden', { conversationId, fieldName, operatorId });
    return field;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private createField(data: Omit<ExtractedField, 'id' | 'verified_value' | 'verification_status' | 'previous_values'>): ExtractedField {
    return {
      id: uuid(),
      ...data,
      verified_value: null,
      verification_status: VerificationStatus.Captured,
    };
  }

  private getLatestFieldMap(fields: ExtractedField[]): Record<string, ExtractedField> {
    const map: Record<string, ExtractedField> = {};
    for (const field of fields) {
      const existing = map[field.field_name];
      if (!existing || field.timestamp > existing.timestamp) {
        map[field.field_name] = field;
      }
    }
    return map;
  }

  private computeMissingFields(fieldMap: Record<string, ExtractedField>): ExtractableFieldName[] {
    return (REQUIRED_CRM_FIELDS as readonly string[]).filter(
      f => !fieldMap[f]?.raw_value,
    ) as ExtractableFieldName[];
  }

  private computeReadyState(fieldMap: Record<string, ExtractedField>): CrmReadyState {
    const required = REQUIRED_CRM_FIELDS as readonly string[];
    const hasSome = required.some(f => !!fieldMap[f]?.raw_value);
    const hasAll = required.every(f => !!fieldMap[f]?.raw_value);

    if (!hasSome) return CrmReadyState.NotReady;
    if (!hasAll) return CrmReadyState.PartiallyReady;
    return CrmReadyState.ReadyForLeadSync;
  }

  private normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return raw;
  }

  private normalizeDob(raw: string): string {
    const parts = raw.split(/[\/\-]/);
    if (parts.length === 3) {
      let year = parseInt(parts[2], 10);
      if (year < 100) year += year > 30 ? 1900 : 2000;
      return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return raw;
  }

  private normalizeInsuranceCarrier(raw: string): string {
    const map: Record<string, string> = {
      'bcbs': 'Blue Cross Blue Shield',
      'uhc': 'UnitedHealthcare',
      'united healthcare': 'UnitedHealthcare',
      'blue cross': 'Blue Cross Blue Shield',
      'blue shield': 'Blue Cross Blue Shield',
    };
    return map[raw.toLowerCase()] || raw;
  }
}
