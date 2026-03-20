import { v4 as uuid } from 'uuid';
import type { PlaybookRevision } from '../../shared/src/types/playbook';
import type { AuditEntityType } from '../../shared/src/types/audit';
import { logger } from '../index';

/** Generic revision record for any versioned entity */
export interface Revision {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  changed_by: string;
  changed_at: string;
  previous_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  change_summary: string;
  approval_state: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approved_by?: string;
  approved_at?: string;
}

export interface RevisionDiff {
  versionA: number;
  versionB: number;
  changes: Record<string, { before: unknown; after: unknown }>;
}

/**
 * VersioningService provides a generic revision history system for
 * versionable entities (playbooks, policies, slider presets, etc.).
 * Supports creating revisions, viewing diffs, rolling back, and approvals.
 */
export class VersioningService {
  // In-memory store - TODO: Replace with Prisma
  private revisions: Revision[] = [];

  /**
   * Creates a new revision entry when an entity is modified.
   */
  async createRevision(
    entityType: string,
    entityId: string,
    changes: Record<string, { before: unknown; after: unknown }>,
    userId: string,
  ): Promise<Revision> {
    const existing = await this.getRevisions(entityType, entityId);
    const latestVersion = existing.length > 0
      ? Math.max(...existing.map(r => r.version))
      : 0;

    const revision: Revision = {
      id: uuid(),
      entity_type: entityType,
      entity_id: entityId,
      version: latestVersion + 1,
      changed_by: userId,
      changed_at: new Date().toISOString(),
      previous_value: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.before]),
      ),
      new_value: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.after]),
      ),
      change_summary: `Updated fields: ${Object.keys(changes).join(', ')}`,
      approval_state: 'pending',
    };

    this.revisions.push(revision);

    logger.info('Revision created', {
      entityType, entityId, version: revision.version, userId,
    });

    return revision;
  }

  /**
   * Returns all revisions for a given entity, sorted by version descending.
   */
  async getRevisions(entityType: string, entityId: string): Promise<Revision[]> {
    return this.revisions
      .filter(r => r.entity_type === entityType && r.entity_id === entityId)
      .sort((a, b) => b.version - a.version);
  }

  /**
   * Rolls back an entity to a previous version by creating a reversal revision.
   */
  async rollback(
    entityType: string,
    entityId: string,
    targetVersion: number,
  ): Promise<Revision> {
    const revisions = await this.getRevisions(entityType, entityId);
    const target = revisions.find(r => r.version === targetVersion);
    if (!target) {
      throw new Error(`Version ${targetVersion} not found for ${entityType}:${entityId}`);
    }

    // Reverse all changes between target version and current
    const toReverse = revisions
      .filter(r => r.version > targetVersion)
      .sort((a, b) => b.version - a.version);

    const rollbackChanges: Record<string, { before: unknown; after: unknown }> = {};
    for (const rev of toReverse) {
      for (const [field, value] of Object.entries(rev.new_value)) {
        rollbackChanges[field] = {
          before: value,
          after: rev.previous_value[field],
        };
      }
    }

    const rollback = await this.createRevision(
      entityType, entityId, rollbackChanges, 'system:rollback',
    );

    logger.info('Rollback completed', {
      entityType, entityId,
      from: revisions[0]?.version, to: targetVersion,
    });

    return rollback;
  }

  /**
   * Computes the diff between two versions of an entity.
   */
  async getDiff(
    entityType: string,
    entityId: string,
    versionA: number,
    versionB: number,
  ): Promise<RevisionDiff> {
    const revisions = await this.getRevisions(entityType, entityId);
    const [min, max] = [Math.min(versionA, versionB), Math.max(versionA, versionB)];

    const relevant = revisions
      .filter(r => r.version > min && r.version <= max)
      .sort((a, b) => a.version - b.version);

    const merged: Record<string, { before: unknown; after: unknown }> = {};
    for (const rev of relevant) {
      for (const [field, value] of Object.entries(rev.new_value)) {
        if (merged[field]) {
          merged[field].after = value;
        } else {
          merged[field] = { before: rev.previous_value[field], after: value };
        }
      }
    }

    return { versionA, versionB, changes: merged };
  }

  /**
   * Approves a specific revision.
   */
  async approve(
    entityType: string,
    entityId: string,
    version: number,
    userId: string,
  ): Promise<Revision> {
    const revision = this.revisions.find(
      r => r.entity_type === entityType && r.entity_id === entityId && r.version === version,
    );

    if (!revision) throw new Error(`Revision not found: ${entityType}:${entityId} v${version}`);
    if (revision.approval_state === 'approved') throw new Error('Already approved');

    revision.approval_state = 'approved';
    revision.approved_by = userId;
    revision.approved_at = new Date().toISOString();

    logger.info('Revision approved', { entityType, entityId, version, approvedBy: userId });
    return revision;
  }
}
