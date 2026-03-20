import {
  PolicyRule,
  PolicyCategory,
  PolicySeverity,
} from '../../shared/src/types/policy';
import type { ApprovedPhrase, ProhibitedPhrase } from '../../shared/src/types/operator';
import { logger } from '../index';

// ─── Result types ───────────────────────────────────────────────────────────

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  category: PolicyCategory;
  severity: PolicySeverity;
  message: string;
}

export interface PolicyCheckResult {
  passed: boolean;
  violations: PolicyViolation[];
  correctedResponse?: string;
}

/**
 * PolicyService enforces compliance, clinical safety, and brand guidelines
 * on all outgoing responses. Checks for prohibited phrases, ensures
 * required disclaimers are present, and validates insurance-related language.
 */
export class PolicyService {
  // In-memory stores - TODO: Replace with Prisma
  private rules: PolicyRule[] = [];
  private approvedPhrases: ApprovedPhrase[] = [];
  private prohibitedPhrases: ProhibitedPhrase[] = [];

  constructor() {
    this.seedDefaults();
  }

  /**
   * Validates a composed response against all active policy rules.
   */
  async checkResponse(
    response: string,
    context: { activePlaybookIds: string[] },
  ): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];

    // Check each active policy rule
    for (const rule of this.rules) {
      if (!rule.active) continue;

      // If rule is scoped to specific playbooks, check applicability
      if (
        rule.applicable_playbooks.length > 0 &&
        !rule.applicable_playbooks.some(id => context.activePlaybookIds.includes(id))
      ) {
        continue;
      }

      if (rule.match_pattern) {
        const regex = new RegExp(rule.match_pattern, 'gi');
        if (regex.test(response)) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity,
            message: rule.rule_text,
          });
        }
      }
    }

    // Check prohibited phrases
    for (const phrase of this.prohibitedPhrases) {
      if (!phrase.active) continue;

      let matched = false;
      switch (phrase.match_type) {
        case 'exact':
          matched = response.toLowerCase() === phrase.phrase.toLowerCase();
          break;
        case 'contains':
          matched = response.toLowerCase().includes(phrase.phrase.toLowerCase());
          break;
        case 'regex':
          matched = new RegExp(phrase.phrase, 'gi').test(response);
          break;
      }

      if (matched) {
        violations.push({
          ruleId: phrase.id,
          ruleName: `Prohibited: ${phrase.phrase}`,
          category: PolicyCategory.Compliance,
          severity: phrase.severity === 'block' ? PolicySeverity.Block : PolicySeverity.Warn,
          message: phrase.reason,
        });
      }
    }

    // Check for diagnosis language (bot must never diagnose)
    const diagnosisViolation = this.checkNoDiagnosisLanguage(response);
    if (diagnosisViolation) {
      violations.push(diagnosisViolation);
    }

    // Build corrected response if there are blocking violations
    let correctedResponse: string | undefined;
    const blockingViolations = violations.filter(v => v.severity === PolicySeverity.Block);
    if (blockingViolations.length > 0) {
      correctedResponse = this.buildCorrectedResponse(response);
    }

    logger.debug('Policy check complete', {
      totalRulesChecked: this.rules.length + this.prohibitedPhrases.length,
      violations: violations.length,
      blocking: blockingViolations.length,
    });

    return {
      passed: violations.length === 0,
      violations,
      correctedResponse,
    };
  }

  /**
   * Returns all configured policy rules, optionally filtered by category.
   */
  async getPolicyRules(category?: PolicyCategory): Promise<PolicyRule[]> {
    if (category) {
      return this.rules.filter(r => r.category === category);
    }
    return [...this.rules];
  }

  /**
   * Returns insurance-related policy rules.
   */
  async getInsurancePolicies(): Promise<PolicyRule[]> {
    return this.rules.filter(r => r.category === PolicyCategory.Insurance);
  }

  /**
   * Returns clinical safety policy rules.
   */
  async getClinicalSafetyPolicies(): Promise<PolicyRule[]> {
    return this.rules.filter(r => r.category === PolicyCategory.ClinicalSafety);
  }

  /**
   * Checks whether a given text contains any prohibited phrase.
   */
  isPhraseProhibited(text: string): boolean {
    const lower = text.toLowerCase();
    return this.prohibitedPhrases.some(p => {
      if (!p.active) return false;
      switch (p.match_type) {
        case 'exact': return lower === p.phrase.toLowerCase();
        case 'contains': return lower.includes(p.phrase.toLowerCase());
        case 'regex': return new RegExp(p.phrase, 'i').test(text);
      }
    });
  }

  /**
   * Checks whether a given text uses an approved phrase.
   */
  isPhraseApproved(text: string): boolean {
    const lower = text.toLowerCase();
    return this.approvedPhrases.some(p => p.active && lower.includes(p.phrase.toLowerCase()));
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private checkNoDiagnosisLanguage(response: string): PolicyViolation | null {
    const diagnosisPatterns = [
      /you have (varicose veins|spider veins|DVT|deep vein thrombosis|venous insufficiency)/i,
      /you('re| are) suffering from/i,
      /your diagnosis is/i,
      /you need (to have|immediate) surgery/i,
      /this is (definitely|clearly|obviously) a case of/i,
    ];

    for (const pattern of diagnosisPatterns) {
      if (pattern.test(response)) {
        return {
          ruleId: 'policy-no-diagnosis',
          ruleName: 'No Diagnosis Language',
          category: PolicyCategory.ClinicalSafety,
          severity: PolicySeverity.Block,
          message: 'Bot must not use diagnosis language. Suggest consulting a specialist instead.',
        };
      }
    }

    return null;
  }

  private buildCorrectedResponse(response: string): string {
    let corrected = response;

    // Remove prohibited phrases
    for (const phrase of this.prohibitedPhrases) {
      if (!phrase.active || phrase.severity !== 'block') continue;
      const regex = phrase.match_type === 'regex'
        ? new RegExp(phrase.phrase, 'gi')
        : new RegExp(phrase.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      corrected = corrected.replace(regex, '[removed]');
    }

    return corrected;
  }

  private seedDefaults(): void {
    const now = new Date().toISOString();

    this.rules = [
      {
        id: 'rule-no-medical-advice',
        name: 'No Medical Advice',
        category: PolicyCategory.ClinicalSafety,
        rule_text: 'Bot must not recommend starting or stopping medication',
        severity: PolicySeverity.Block,
        locked: true,
        editable_by: ['engineering'],
        match_pattern: 'you should (take|stop taking) (medication|medicine)',
        applicable_playbooks: [],
        active: true,
        created_at: now,
        updated_at: now,
        last_modified_by: 'system',
        rationale: 'Clinical safety: only licensed physicians can prescribe or modify medication.',
      },
      {
        id: 'rule-no-discourage-doctor',
        name: 'No Discouraging Doctor Visit',
        category: PolicyCategory.ClinicalSafety,
        rule_text: 'Bot must not discourage seeing a doctor',
        severity: PolicySeverity.Block,
        locked: true,
        editable_by: ['engineering'],
        match_pattern: "you (don't|do not) need to see a doctor",
        applicable_playbooks: [],
        active: true,
        created_at: now,
        updated_at: now,
        last_modified_by: 'system',
        rationale: 'Clinical safety: always encourage patients to seek professional care.',
      },
      {
        id: 'rule-insurance-disclaimer',
        name: 'Insurance Coverage Disclaimer',
        category: PolicyCategory.Insurance,
        rule_text: 'All insurance coverage statements must include a verification disclaimer',
        severity: PolicySeverity.Warn,
        locked: false,
        editable_by: ['manager', 'compliance_reviewer'],
        applicable_playbooks: [],
        active: true,
        created_at: now,
        updated_at: now,
        last_modified_by: 'system',
        rationale: 'Insurance coverage varies by plan; disclaimers protect against misrepresentation.',
      },
    ];

    this.prohibitedPhrases = [
      { id: 'pp-1', phrase: 'guaranteed results', reason: 'No medical outcome can be guaranteed', match_type: 'contains', severity: 'block', added_by: 'system', source_feedback_id: null, active: true, created_at: now },
      { id: 'pp-2', phrase: 'cure', reason: 'Vein treatments manage conditions, not cure them', match_type: 'contains', severity: 'block', added_by: 'system', source_feedback_id: null, active: true, created_at: now },
      { id: 'pp-3', phrase: 'risk-free', reason: 'All medical procedures carry some risk', match_type: 'contains', severity: 'block', added_by: 'system', source_feedback_id: null, active: true, created_at: now },
      { id: 'pp-4', phrase: '100% safe', reason: 'No procedure is 100% safe', match_type: 'contains', severity: 'block', added_by: 'system', source_feedback_id: null, active: true, created_at: now },
      { id: 'pp-5', phrase: 'fully covered', reason: 'Coverage depends on individual plan', match_type: 'contains', severity: 'block', added_by: 'system', source_feedback_id: null, active: true, created_at: now },
      { id: 'pp-6', phrase: 'no out-of-pocket', reason: 'Cannot guarantee zero costs', match_type: 'contains', severity: 'block', added_by: 'system', source_feedback_id: null, active: true, created_at: now },
    ];

    this.approvedPhrases = [
      { id: 'ap-1', phrase: 'board-certified specialists', context: 'Describing our doctors', applicable_playbooks: [], added_by: 'system', source_feedback_id: null, active: true, created_at: now, usage_count: 0 },
      { id: 'ap-2', phrase: 'minimally invasive', context: 'Describing treatments', applicable_playbooks: [], added_by: 'system', source_feedback_id: null, active: true, created_at: now, usage_count: 0 },
      { id: 'ap-3', phrase: 'free consultation', context: 'Offering initial visits', applicable_playbooks: [], added_by: 'system', source_feedback_id: null, active: true, created_at: now, usage_count: 0 },
      { id: 'ap-4', phrase: 'covered by most insurance plans', context: 'Insurance discussion', applicable_playbooks: [], added_by: 'system', source_feedback_id: null, active: true, created_at: now, usage_count: 0 },
    ];
  }
}
