import { v4 as uuid } from 'uuid';
import {
  AuditLogEntry,
  AuditAction,
  AuditEntityType,
} from '../../shared/src/types/audit';
import { logger } from '../index';

/** Simplified audit log input used by services */
export interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  who: string;
  details: Record<string, unknown>;
}

/** Filters for querying the audit log */
export interface AuditFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  who?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * AuditService provides a centralized audit log for all system actions.
 * Every significant operation is recorded for compliance, debugging,
 * and analytics.
 */
export class AuditService {
  // In-memory store - TODO: Replace with Prisma (append-only table)
  private entries: AuditLogEntry[] = [];

  /**
   * Records an audit entry. Simplified input interface for convenience.
   */
  async log(input: AuditLogInput): Promise<void> {
    const entry: AuditLogEntry = {
      id: uuid(),
      who: input.who,
      who_display_name: input.who,
      who_role: 'system',
      what: this.mapAction(input.action),
      what_description: `${input.action} on ${input.entityType}:${input.entityId}`,
      when: new Date().toISOString(),
      why: '',
      entity_type: input.entityType,
      entity_id: input.entityId,
      previous_value: null,
      new_value: input.details as Record<string, unknown>,
      ip_address: null,
      user_agent: null,
      metadata: input.details,
    };

    // TODO: Persist to database (append-only)
    this.entries.push(entry);

    logger.debug('Audit entry recorded', {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      who: input.who,
    });
  }

  /**
   * Queries audit entries with optional filters.
   */
  async getLog(filters: AuditFilters): Promise<{
    entries: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    let filtered = [...this.entries];

    if (filters.entityType) filtered = filtered.filter(e => e.entity_type === filters.entityType);
    if (filters.entityId) filtered = filtered.filter(e => e.entity_id === filters.entityId);
    if (filters.action) filtered = filtered.filter(e => e.what === filters.action);
    if (filters.who) filtered = filtered.filter(e => e.who === filters.who);
    if (filters.from) filtered = filtered.filter(e => e.when >= filters.from!);
    if (filters.to) filtered = filtered.filter(e => e.when <= filters.to!);

    // Sort by timestamp descending
    filtered.sort((a, b) => b.when.localeCompare(a.when));

    const total = filtered.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const page = filtered.slice(offset, offset + limit);

    return { entries: page, total, hasMore: offset + limit < total };
  }

  /**
   * Returns the complete action history for a specific entity.
   */
  async getEntityHistory(
    entityType: AuditEntityType,
    entityId: string,
  ): Promise<AuditLogEntry[]> {
    const result = await this.getLog({
      entityType,
      entityId,
      limit: 1000,
    });
    return result.entries;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private mapAction(action: string): AuditAction {
    const mapping: Record<string, AuditAction> = {
      created: AuditAction.Created,
      updated: AuditAction.Updated,
      deleted: AuditAction.Deleted,
      published: AuditAction.Published,
      approved: AuditAction.Approved,
      rejected: AuditAction.Rejected,
      escalated: AuditAction.Escalated,
      crm_synced: AuditAction.ExternalSync,
      config_changed: AuditAction.ConfigChanged,
    };
    return mapping[action] || AuditAction.Updated;
  }
}
