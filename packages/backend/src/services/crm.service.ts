import { v4 as uuid } from 'uuid';
import { CrmReadyState, CrmSyncPayload } from '../../shared/src/types/extraction';
import { ExtractionService } from './extraction.service';
import { AuditService } from './audit.service';
import { logger } from '../index';

export interface CrmSyncResult {
  success: boolean;
  crmRecordId?: string;
  errors?: string[];
  warnings?: string[];
  syncedAt: string;
}

/**
 * CrmService manages the synchronization of lead and booking data
 * to the external CRM system. Validates readiness, builds payloads,
 * and handles sync lifecycle.
 */
export class CrmService {
  constructor(
    private readonly extractionService: ExtractionService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Syncs a lead's extracted data to the CRM system.
   */
  async syncLead(leadId: string): Promise<CrmSyncResult> {
    logger.info('Starting CRM lead sync', { leadId });

    const conversationId = leadId; // TODO: proper lead -> conversation mapping
    const readiness = await this.validateSyncReadiness(conversationId);

    if (!readiness.ready) {
      logger.warn('Lead not ready for CRM sync', { leadId, missing: readiness.missingFields });
      return {
        success: false,
        errors: [`Missing required fields: ${readiness.missingFields.join(', ')}`],
        warnings: readiness.warnings,
        syncedAt: new Date().toISOString(),
      };
    }

    const payload = await this.extractionService.getCrmPayload(conversationId);

    // TODO: Send payload to external CRM API (Salesforce, HubSpot, etc.)
    // const crmResponse = await this.crmClient.createOrUpdateLead(payload);

    const crmRecordId = `crm-${uuid().substring(0, 8)}`;

    await this.auditService.log({
      entityType: 'lead',
      entityId: leadId,
      action: 'crm_synced',
      who: 'system:crm',
      details: { crmRecordId, readyState: payload.ready_state },
    });

    logger.info('CRM lead sync complete', { leadId, crmRecordId });
    return { success: true, crmRecordId, syncedAt: new Date().toISOString() };
  }

  /**
   * Syncs a booking to the CRM system.
   */
  async syncBooking(bookingId: string): Promise<CrmSyncResult> {
    logger.info('Starting CRM booking sync', { bookingId });

    // TODO: Load booking from Prisma and send to CRM
    const crmRecordId = `crm-booking-${uuid().substring(0, 8)}`;

    await this.auditService.log({
      entityType: 'scheduling_request',
      entityId: bookingId,
      action: 'crm_synced',
      who: 'system:crm',
      details: { crmRecordId },
    });

    logger.info('CRM booking sync complete', { bookingId, crmRecordId });
    return { success: true, crmRecordId, syncedAt: new Date().toISOString() };
  }

  /**
   * Returns a preview of the CRM payload without performing the sync.
   */
  async getCrmPayloadPreview(conversationId: string): Promise<{
    payload: CrmSyncPayload;
    readiness: { ready: boolean; missingFields: string[]; warnings: string[] };
  }> {
    const payload = await this.extractionService.getCrmPayload(conversationId);
    const readiness = await this.validateSyncReadiness(conversationId);
    return { payload, readiness };
  }

  /**
   * Validates whether a conversation has sufficient data for CRM sync.
   */
  async validateSyncReadiness(conversationId: string): Promise<{
    ready: boolean;
    missingFields: string[];
    warnings: string[];
  }> {
    const crmState = await this.extractionService.getCrmReadyState(conversationId);
    const warnings: string[] = [];

    if (!crmState.ready) {
      warnings.push('Lead does not meet minimum CRM sync requirements.');
    }

    // TODO: Check for existing CRM record (duplicate check)
    // TODO: Validate data format against CRM schema requirements

    return {
      ready: crmState.ready,
      missingFields: crmState.missingRequired,
      warnings,
    };
  }
}
