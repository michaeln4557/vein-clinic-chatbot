import { v4 as uuid } from 'uuid';
import { DUPLICATE_MATCH_THRESHOLD } from '../../shared/src/constants';
import { AuditService } from './audit.service';
import { logger } from '../index';

/** A potential duplicate match between two leads */
export interface DuplicateMatch {
  id: string;
  leadIdA: string;
  leadIdB: string;
  matchScore: number;
  matchedFields: string[];
  resolution?: 'merge' | 'keep_separate' | 'dismiss';
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * DuplicateDetectionService identifies potential duplicate leads
 * based on phone number, name, date of birth, and email matching.
 * Uses fuzzy matching with configurable thresholds and supports
 * manual resolution workflows.
 */
export class DuplicateDetectionService {
  // In-memory store - TODO: Replace with Prisma
  private matches: Map<string, DuplicateMatch> = new Map();

  constructor(
    private readonly auditService: AuditService,
  ) {}

  /**
   * Checks for potential duplicate leads by matching against existing records.
   */
  async checkDuplicate(
    phoneNumber: string,
    name?: string,
    dob?: string,
    email?: string,
  ): Promise<{
    isDuplicate: boolean;
    matches: DuplicateMatch[];
    highestScore: number;
  }> {
    // TODO: Query existing leads from Prisma
    const mockLeads = [
      { id: 'lead-001', phone: '+15551234567', name: 'John Smith', dob: '1985-03-15', email: 'john@example.com' },
      { id: 'lead-002', phone: '+15552345678', name: 'Jane Doe', dob: '1990-07-22', email: 'jane@example.com' },
      { id: 'lead-003', phone: '+15553456789', name: 'Robert Johnson', dob: '1978-11-30', email: 'bob@example.com' },
    ];

    const foundMatches: DuplicateMatch[] = [];
    const normalizedPhone = this.normalizePhone(phoneNumber);

    for (const lead of mockLeads) {
      let score = 0;
      const matchedFields: string[] = [];

      if (this.normalizePhone(lead.phone) === normalizedPhone) {
        score += 0.5;
        matchedFields.push('phone_number');
      }

      if (name && this.fuzzyNameMatch(name, lead.name)) {
        score += 0.2;
        matchedFields.push('full_name');
      }

      if (dob && lead.dob === dob) {
        score += 0.2;
        matchedFields.push('date_of_birth');
      }

      if (email && lead.email.toLowerCase() === email.toLowerCase()) {
        score += 0.1;
        matchedFields.push('email');
      }

      if (score >= DUPLICATE_MATCH_THRESHOLD) {
        const match: DuplicateMatch = {
          id: uuid(),
          leadIdA: 'new-lead',
          leadIdB: lead.id,
          matchScore: score,
          matchedFields,
        };
        foundMatches.push(match);
        this.matches.set(match.id, match);
      }
    }

    const highestScore = foundMatches.length > 0
      ? Math.max(...foundMatches.map(m => m.matchScore))
      : 0;

    if (foundMatches.length > 0) {
      logger.info('Duplicate candidates found', {
        phone: normalizedPhone, matchCount: foundMatches.length, highestScore,
      });
    }

    return {
      isDuplicate: foundMatches.length > 0,
      matches: foundMatches.sort((a, b) => b.matchScore - a.matchScore),
      highestScore,
    };
  }

  /**
   * Resolves a duplicate match with the specified action.
   */
  async resolveDuplicate(
    matchId: string,
    resolution: 'merge' | 'keep_separate' | 'dismiss',
    resolvedBy: string = 'system',
  ): Promise<DuplicateMatch> {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Duplicate match not found: ${matchId}`);
    if (match.resolution) throw new Error(`Already resolved: ${match.resolution}`);

    match.resolution = resolution;
    match.resolvedBy = resolvedBy;
    match.resolvedAt = new Date().toISOString();
    this.matches.set(matchId, match);

    if (resolution === 'merge') {
      // TODO: Merge lead records in CRM
      logger.info('Leads merged', { matchId, leadA: match.leadIdA, leadB: match.leadIdB });
    }

    await this.auditService.log({
      entityType: 'lead',
      entityId: matchId,
      action: `duplicate_${resolution}`,
      who: resolvedBy,
      details: { leadA: match.leadIdA, leadB: match.leadIdB, matchScore: match.matchScore },
    });

    logger.info('Duplicate resolved', { matchId, resolution, resolvedBy });
    return match;
  }

  /**
   * Returns all duplicate match candidates for a given lead.
   */
  async getDuplicateMatches(leadId: string): Promise<DuplicateMatch[]> {
    const results: DuplicateMatch[] = [];
    for (const match of this.matches.values()) {
      if (match.leadIdA === leadId || match.leadIdB === leadId) results.push(match);
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10);
  }

  private fuzzyNameMatch(nameA: string, nameB: string): boolean {
    const a = nameA.toLowerCase().trim();
    const b = nameB.toLowerCase().trim();
    if (a === b) return true;

    const partsA = a.split(/\s+/);
    const partsB = b.split(/\s+/);
    for (const partA of partsA) {
      for (const partB of partsB) {
        if (partA === partB && partA.length > 2) return true;
      }
    }
    return false;
  }
}
