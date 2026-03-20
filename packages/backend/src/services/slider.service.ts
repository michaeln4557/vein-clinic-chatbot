import { v4 as uuid } from 'uuid';
import {
  SliderPresetName,
  SliderOverrideScope,
} from '../../shared/src/types/slider';
import type { ToneSettings } from '../../shared/src/types/playbook';
import type { Channel } from '../../shared/src/types/conversation';
import { DEFAULT_SLIDER_SETTINGS } from '../../shared/src/constants';
import { AuditService } from './audit.service';
import { logger } from '../index';

/** Slider setting keys that can be adjusted */
type SliderKey = keyof ToneSettings;

/** A named preset with associated slider values */
interface SliderPreset {
  id: string;
  name: SliderPresetName;
  description: string;
  values: Record<SliderKey, number>;
  system_defined: boolean;
}

/**
 * SliderService manages the tone/style sliders that control how the
 * chatbot composes responses. Sliders can be set at global, channel,
 * or playbook scope, with overrides cascading in that order.
 */
export class SliderService {
  // In-memory stores - TODO: Replace with Prisma
  private globalSettings: ToneSettings = {
    warmth: DEFAULT_SLIDER_SETTINGS.warmth,
    formality: DEFAULT_SLIDER_SETTINGS.formality,
    empathy: DEFAULT_SLIDER_SETTINGS.empathy,
    urgency: DEFAULT_SLIDER_SETTINGS.urgency,
    detail: DEFAULT_SLIDER_SETTINGS.detail,
  };
  private channelOverrides: Map<string, Partial<ToneSettings>> = new Map();
  private playbookOverrides: Map<string, Partial<ToneSettings>> = new Map();
  private presets: Map<string, SliderPreset> = new Map();

  constructor(
    private readonly auditService: AuditService,
  ) {
    this.seedPresets();
  }

  /**
   * Returns the slider settings for a given scope.
   */
  async getSliderSettings(scope: {
    type: SliderOverrideScope;
    id?: string;
  }): Promise<ToneSettings> {
    switch (scope.type) {
      case SliderOverrideScope.Global:
        return { ...this.globalSettings };
      case SliderOverrideScope.Channel: {
        const override = scope.id ? this.channelOverrides.get(scope.id) : undefined;
        return { ...this.globalSettings, ...override };
      }
      case SliderOverrideScope.Playbook: {
        const override = scope.id ? this.playbookOverrides.get(scope.id) : undefined;
        return { ...this.globalSettings, ...override };
      }
      default:
        return { ...this.globalSettings };
    }
  }

  /**
   * Updates a single slider value at the specified scope.
   */
  async updateSlider(
    sliderId: SliderKey,
    value: number,
    scope: { type: SliderOverrideScope; id?: string },
    userId: string = 'system',
  ): Promise<ToneSettings> {
    if (value < 0 || value > 100) throw new Error(`Value must be 0-100, got ${value}`);

    const validSliders: SliderKey[] = ['warmth', 'formality', 'empathy', 'urgency', 'detail'];
    if (!validSliders.includes(sliderId)) throw new Error(`Invalid slider: ${sliderId}`);

    switch (scope.type) {
      case SliderOverrideScope.Global:
        this.globalSettings[sliderId] = value;
        break;
      case SliderOverrideScope.Channel: {
        if (!scope.id) throw new Error('Channel scope requires an id');
        const existing = this.channelOverrides.get(scope.id) || {};
        existing[sliderId] = value;
        this.channelOverrides.set(scope.id, existing);
        break;
      }
      case SliderOverrideScope.Playbook: {
        if (!scope.id) throw new Error('Playbook scope requires an id');
        const existing = this.playbookOverrides.get(scope.id) || {};
        existing[sliderId] = value;
        this.playbookOverrides.set(scope.id, existing);
        break;
      }
    }

    await this.auditService.log({
      entityType: 'slider_setting',
      entityId: sliderId,
      action: 'updated',
      who: userId,
      details: { scope: scope.type, scopeId: scope.id, value },
    });

    logger.info('Slider updated', { sliderId, value, scope });
    return this.getSliderSettings(scope);
  }

  /**
   * Returns a named preset configuration.
   */
  async getPreset(presetName: string): Promise<SliderPreset | null> {
    return this.presets.get(presetName) || null;
  }

  /**
   * Applies a preset to the specified scope.
   */
  async applyPreset(
    presetName: string,
    scope: { type: SliderOverrideScope; id?: string },
    userId: string = 'system',
  ): Promise<ToneSettings> {
    const preset = this.presets.get(presetName);
    if (!preset) throw new Error(`Preset not found: ${presetName}`);

    const settings: ToneSettings = { ...preset.values };

    switch (scope.type) {
      case SliderOverrideScope.Global:
        this.globalSettings = settings;
        break;
      case SliderOverrideScope.Channel:
        if (!scope.id) throw new Error('Channel scope requires an id');
        this.channelOverrides.set(scope.id, settings);
        break;
      case SliderOverrideScope.Playbook:
        if (!scope.id) throw new Error('Playbook scope requires an id');
        this.playbookOverrides.set(scope.id, settings);
        break;
    }

    await this.auditService.log({
      entityType: 'slider_preset',
      entityId: presetName,
      action: 'preset_applied',
      who: userId,
      details: { scope: scope.type, scopeId: scope.id },
    });

    logger.info('Preset applied', { presetName, scope });
    return this.getSliderSettings(scope);
  }

  /**
   * Returns a preview of how changing a slider would affect settings.
   */
  async previewSliderImpact(
    sliderId: SliderKey,
    value: number,
    scope: { type: SliderOverrideScope; id?: string } = { type: SliderOverrideScope.Global },
  ): Promise<{ current: ToneSettings; preview: ToneSettings; delta: number }> {
    const current = await this.getSliderSettings(scope);
    const preview = { ...current, [sliderId]: value };
    return { current, preview, delta: value - current[sliderId] };
  }

  /**
   * Resolves the effective tone settings by cascading:
   * global -> channel override -> playbook override.
   */
  async getEffectiveToneSettings(
    channel?: Channel | string,
    playbookId?: string,
  ): Promise<ToneSettings> {
    let settings = { ...this.globalSettings };

    if (channel) {
      const channelOverride = this.channelOverrides.get(channel);
      if (channelOverride) settings = { ...settings, ...channelOverride };
    }

    if (playbookId) {
      const playbookOverride = this.playbookOverrides.get(playbookId);
      if (playbookOverride) settings = { ...settings, ...playbookOverride };
    }

    return settings;
  }

  // ─── Seed Data ────────────────────────────────────────────────────────────

  private seedPresets(): void {
    const presets: SliderPreset[] = [
      {
        id: uuid(), name: SliderPresetName.Concierge,
        description: 'High-touch, warm, detailed responses for premium experience.',
        values: { warmth: 85, formality: 40, empathy: 85, urgency: 30, detail: 75 },
        system_defined: true,
      },
      {
        id: uuid(), name: SliderPresetName.Balanced,
        description: 'Middle-ground settings for normal operations.',
        values: { warmth: 60, formality: 50, empathy: 60, urgency: 40, detail: 50 },
        system_defined: true,
      },
      {
        id: uuid(), name: SliderPresetName.Efficiency,
        description: 'Fast, concise responses optimized for throughput.',
        values: { warmth: 40, formality: 50, empathy: 40, urgency: 70, detail: 25 },
        system_defined: true,
      },
      {
        id: uuid(), name: SliderPresetName.RecoveryMode,
        description: 'Conservative settings for recovering from a system issue.',
        values: { warmth: 70, formality: 60, empathy: 75, urgency: 20, detail: 60 },
        system_defined: true,
      },
      {
        id: uuid(), name: SliderPresetName.InsuranceSensitive,
        description: 'Extra-careful handling of insurance-related conversations.',
        values: { warmth: 55, formality: 70, empathy: 65, urgency: 30, detail: 80 },
        system_defined: true,
      },
    ];

    for (const preset of presets) {
      this.presets.set(preset.name, preset);
    }
  }
}
