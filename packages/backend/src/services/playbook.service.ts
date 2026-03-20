import { v4 as uuid } from 'uuid';
import {
  Playbook,
  PlaybookName,
  PlaybookStatus,
  PlaybookRevision,
  TriggerCondition,
  PlaybookStep,
  ToneSettings,
} from '../../shared/src/types/playbook';
import { DEFAULT_SLIDER_SETTINGS } from '../../shared/src/constants';
import { AuditService } from './audit.service';
import { logger } from '../index';

/**
 * PlaybookService manages the lifecycle of conversational playbooks,
 * including CRUD operations, publishing, versioning, and rollback.
 */
export class PlaybookService {
  // In-memory store - TODO: Replace with Prisma
  private playbooks: Map<string, Playbook> = new Map();
  private revisions: PlaybookRevision[] = [];

  constructor(
    private readonly auditService: AuditService,
  ) {
    this.seedDefaults();
  }

  /**
   * Loads a single playbook by name or ID.
   */
  async loadPlaybook(nameOrId: string): Promise<Playbook | null> {
    const byId = this.playbooks.get(nameOrId);
    if (byId) return byId;

    for (const playbook of this.playbooks.values()) {
      if (playbook.name === nameOrId || playbook.display_name === nameOrId) {
        return playbook;
      }
    }

    // TODO: Query Prisma database
    logger.debug('Playbook not found', { nameOrId });
    return null;
  }

  /**
   * Returns all published (active) playbooks.
   */
  async getActivePlaybooks(): Promise<Playbook[]> {
    // TODO: Replace with Prisma query
    const active: Playbook[] = [];
    for (const playbook of this.playbooks.values()) {
      if (playbook.status === PlaybookStatus.Published) {
        active.push(playbook);
      }
    }
    return active;
  }

  /**
   * Creates a new playbook in draft status.
   */
  async createPlaybook(data: {
    name: PlaybookName;
    display_name: string;
    description: string;
    trigger_conditions: TriggerCondition[];
    steps: PlaybookStep[];
    tone_settings?: ToneSettings;
    createdBy: string;
  }): Promise<Playbook> {
    const now = new Date().toISOString();
    const playbook: Playbook = {
      id: uuid(),
      name: data.name,
      display_name: data.display_name,
      description: data.description,
      version: 1,
      status: PlaybookStatus.Draft,
      trigger_conditions: data.trigger_conditions,
      response_goals: [],
      steps: data.steps,
      allowed_language: [],
      prohibited_language: [],
      tone_settings: data.tone_settings ?? {
        warmth: DEFAULT_SLIDER_SETTINGS.warmth,
        formality: DEFAULT_SLIDER_SETTINGS.formality,
        empathy: DEFAULT_SLIDER_SETTINGS.empathy,
        urgency: DEFAULT_SLIDER_SETTINGS.urgency,
        detail: DEFAULT_SLIDER_SETTINGS.detail,
      },
      booking_timing: { proactive_booking: false },
      escalation_rules: [],
      examples: [],
      operator_settings: {},
      created_at: now,
      updated_at: now,
      last_modified_by: data.createdBy,
    };

    // TODO: Persist to Prisma
    this.playbooks.set(playbook.id, playbook);

    await this.auditService.log({
      entityType: 'playbook',
      entityId: playbook.id,
      action: 'created',
      who: data.createdBy,
      details: { name: data.name, display_name: data.display_name },
    });

    logger.info('Playbook created', { id: playbook.id, name: playbook.name });
    return playbook;
  }

  /**
   * Updates an existing playbook. Only draft playbooks can be edited directly.
   */
  async updatePlaybook(
    id: string,
    data: Partial<Pick<Playbook,
      'display_name' | 'description' | 'trigger_conditions' | 'steps' |
      'response_goals' | 'allowed_language' | 'prohibited_language' |
      'tone_settings' | 'booking_timing' | 'escalation_rules' | 'examples'
    >>,
    userId: string = 'system',
  ): Promise<Playbook> {
    const playbook = this.playbooks.get(id);
    if (!playbook) {
      throw new Error(`Playbook not found: ${id}`);
    }

    if (playbook.status === PlaybookStatus.Published) {
      throw new Error('Cannot edit a published playbook. Create a new draft version instead.');
    }

    // Capture previous state for revision
    const previousValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        previousValue[key] = (playbook as any)[key];
        newValue[key] = value;
      }
    }

    // Apply updates
    Object.assign(playbook, data, {
      updated_at: new Date().toISOString(),
      last_modified_by: userId,
    });

    // Create revision record
    const revision: PlaybookRevision = {
      id: uuid(),
      playbook_id: id,
      version: playbook.version,
      changed_by: userId,
      changed_at: new Date().toISOString(),
      previous_value: previousValue,
      new_value: newValue,
      change_summary: `Updated fields: ${Object.keys(data).join(', ')}`,
      approval_state: 'pending',
      publish_state: 'unpublished',
    };
    this.revisions.push(revision);

    this.playbooks.set(id, playbook);

    await this.auditService.log({
      entityType: 'playbook',
      entityId: id,
      action: 'updated',
      who: userId,
      details: { changedFields: Object.keys(data) },
    });

    logger.info('Playbook updated', { id, changedFields: Object.keys(data) });
    return playbook;
  }

  /**
   * Publishes a draft playbook, making it available for the orchestration engine.
   */
  async publishPlaybook(id: string, userId: string = 'system'): Promise<Playbook> {
    const playbook = this.playbooks.get(id);
    if (!playbook) throw new Error(`Playbook not found: ${id}`);
    if (playbook.status === PlaybookStatus.Published) throw new Error('Playbook is already published');
    if (playbook.trigger_conditions.length === 0) throw new Error('Playbook must have at least one trigger');
    if (playbook.steps.length === 0) throw new Error('Playbook must have at least one step');

    playbook.status = PlaybookStatus.Published;
    playbook.version += 1;
    playbook.updated_at = new Date().toISOString();
    playbook.last_modified_by = userId;

    this.playbooks.set(id, playbook);

    await this.auditService.log({
      entityType: 'playbook',
      entityId: id,
      action: 'published',
      who: userId,
      details: { version: playbook.version },
    });

    logger.info('Playbook published', { id, version: playbook.version });
    return playbook;
  }

  /**
   * Rolls back a playbook to a previous version.
   */
  async rollbackPlaybook(id: string, version: number, userId: string = 'system'): Promise<Playbook> {
    const playbook = this.playbooks.get(id);
    if (!playbook) throw new Error(`Playbook not found: ${id}`);

    const targetRevision = this.revisions.find(
      r => r.playbook_id === id && r.version === version,
    );
    if (!targetRevision) {
      throw new Error(`Version ${version} not found for playbook ${id}`);
    }

    // TODO: Reconstruct playbook state from revision chain
    playbook.version = version;
    playbook.status = PlaybookStatus.Draft;
    playbook.updated_at = new Date().toISOString();
    playbook.last_modified_by = userId;
    this.playbooks.set(id, playbook);

    // Mark the revision as rolled back
    const latestRevision = this.revisions.find(
      r => r.playbook_id === id && r.publish_state === 'published',
    );
    if (latestRevision) {
      latestRevision.publish_state = 'rolled_back';
    }

    await this.auditService.log({
      entityType: 'playbook',
      entityId: id,
      action: 'rolled_back',
      who: userId,
      details: { targetVersion: version },
    });

    logger.info('Playbook rolled back', { id, targetVersion: version });
    return playbook;
  }

  /**
   * Returns the full revision history for a playbook.
   */
  async getRevisionHistory(id: string): Promise<PlaybookRevision[]> {
    return this.revisions
      .filter(r => r.playbook_id === id)
      .sort((a, b) => b.version - a.version);
  }

  // ─── Seed Data ────────────────────────────────────────────────────────────

  private seedDefaults(): void {
    const now = new Date().toISOString();
    const defaultTone: ToneSettings = {
      warmth: DEFAULT_SLIDER_SETTINGS.warmth,
      formality: DEFAULT_SLIDER_SETTINGS.formality,
      empathy: DEFAULT_SLIDER_SETTINGS.empathy,
      urgency: DEFAULT_SLIDER_SETTINGS.urgency,
      detail: DEFAULT_SLIDER_SETTINGS.detail,
    };

    const defaults: Playbook[] = [
      {
        id: 'pb-new-patient-intake',
        name: PlaybookName.NewPatientIntake,
        display_name: 'New Patient Intake',
        description: 'First-touch greeting and intake for new patient inquiries',
        version: 1,
        status: PlaybookStatus.Published,
        trigger_conditions: [
          { type: 'intent', value: 'schedule_appointment', priority: 50 },
          { type: 'fallback', value: 'true', priority: 10 },
        ],
        response_goals: ['Greet warmly', 'Identify needs', 'Collect name and phone'],
        steps: [
          {
            step_id: 's1', label: 'Welcome', description: 'Greet the patient',
            prompt_template: 'Welcome the patient and ask how you can help.',
            transitions: [{ condition: 'success', target_step_id: 's2' }],
          },
          {
            step_id: 's2', label: 'Collect Name', description: 'Ask for patient name',
            prompt_template: 'Ask for the patient\'s full name.',
            extraction_targets: ['full_name'],
            transitions: [{ condition: 'success', target_step_id: 's3' }],
          },
          {
            step_id: 's3', label: 'Collect Phone', description: 'Ask for phone number',
            prompt_template: 'Ask for the best phone number to reach them.',
            extraction_targets: ['phone_number'],
            transitions: [{ condition: 'success', target_step_id: 's4' }],
          },
        ],
        allowed_language: ['free consultation', 'board-certified specialists'],
        prohibited_language: ['guarantee', 'cure'],
        tone_settings: { ...defaultTone, warmth: 75, empathy: 70 },
        booking_timing: { proactive_booking: false },
        escalation_rules: [],
        examples: [],
        operator_settings: {},
        created_at: now,
        updated_at: now,
        last_modified_by: 'system',
      },
      {
        id: 'pb-insurance-collection',
        name: PlaybookName.InsuranceCollection,
        display_name: 'Insurance Collection',
        description: 'Collecting and verifying insurance information',
        version: 1,
        status: PlaybookStatus.Published,
        trigger_conditions: [
          { type: 'intent', value: 'insurance_inquiry', priority: 60 },
        ],
        response_goals: ['Collect insurance carrier', 'Verify coverage applicability'],
        steps: [
          {
            step_id: 's1', label: 'Ask Carrier', description: 'Ask for insurance carrier name',
            prompt_template: 'Ask which insurance carrier the patient has.',
            extraction_targets: ['insurance_provider'],
            transitions: [{ condition: 'success', target_step_id: 's2' }],
          },
          {
            step_id: 's2', label: 'Confirm Coverage', description: 'Provide coverage info',
            prompt_template: 'Confirm coverage details. Always include disclaimer.',
            transitions: [{ condition: 'success', target_step_id: 's3' }],
          },
        ],
        allowed_language: ['accepted at most locations', 'in-network'],
        prohibited_language: ['fully covered', 'no out-of-pocket', 'guaranteed coverage'],
        tone_settings: { ...defaultTone, formality: 70, detail: 70 },
        booking_timing: { proactive_booking: false },
        escalation_rules: [
          {
            id: 'esc-ins-1',
            description: 'Escalate complex insurance questions',
            condition: 'patient asks about specific claim or denial',
            priority: 'high',
            action: 'callback',
          },
        ],
        examples: [],
        operator_settings: {},
        created_at: now,
        updated_at: now,
        last_modified_by: 'system',
      },
      {
        id: 'pb-appointment-scheduling',
        name: PlaybookName.AppointmentScheduling,
        display_name: 'Appointment Scheduling',
        description: 'Scheduling an appointment (date, time, location selection)',
        version: 1,
        status: PlaybookStatus.Published,
        trigger_conditions: [
          { type: 'intent', value: 'schedule_appointment', priority: 70 },
        ],
        response_goals: ['Identify preferred date/time', 'Present available slots', 'Create provisional booking'],
        steps: [
          {
            step_id: 's1', label: 'Ask Preferred Date', description: 'Ask when patient wants to come in',
            prompt_template: 'Ask what day and time work best for the patient.',
            extraction_targets: ['requested_date_raw', 'requested_time_raw'],
            transitions: [{ condition: 'success', target_step_id: 's2' }],
          },
          {
            step_id: 's2', label: 'Present Slots', description: 'Show available time slots',
            prompt_template: 'Present the available slots and ask patient to choose.',
            transitions: [{ condition: 'success', target_step_id: 's3' }],
          },
          {
            step_id: 's3', label: 'Confirm Booking', description: 'Confirm the appointment',
            prompt_template: 'Confirm the selected slot and create a provisional booking.',
            requires_confirmation: true,
            transitions: [{ condition: 'success', target_step_id: 's4' }],
          },
        ],
        allowed_language: ['free consultation', 'we look forward to seeing you'],
        prohibited_language: [],
        tone_settings: { ...defaultTone, urgency: 60, proactivity: 70 } as any,
        booking_timing: { proactive_booking: true, min_messages_before_booking: 3 },
        escalation_rules: [],
        examples: [],
        operator_settings: {},
        created_at: now,
        updated_at: now,
        last_modified_by: 'system',
      },
    ];

    for (const pb of defaults) {
      this.playbooks.set(pb.id, pb);
    }
  }
}
