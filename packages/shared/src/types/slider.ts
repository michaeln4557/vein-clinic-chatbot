/**
 * Slider configuration types for operator-tunable bot behavior.
 *
 * Sliders expose internal bot parameters as simple 0-100 controls
 * that operators can adjust without understanding the underlying
 * prompt engineering. Presets bundle slider values for common
 * operational modes.
 */

/** Names of the predefined slider presets. */
export enum SliderPresetName {
  /** High-touch, warm, detailed responses for premium experience. */
  Concierge = 'Concierge',
  /** Middle-ground settings for normal operations. */
  Balanced = 'Balanced',
  /** Fast, concise responses optimized for throughput. */
  Efficiency = 'Efficiency',
  /** Conservative settings for recovering from a system issue. */
  RecoveryMode = 'Recovery_Mode',
  /** Extra-careful handling of insurance-related conversations. */
  InsuranceSensitive = 'Insurance_Sensitive',
}

/** Scope at which a slider override applies. */
export enum SliderOverrideScope {
  /** Applies to all conversations across all channels. */
  Global = 'global',
  /** Applies only to a specific channel (SMS or web chat). */
  Channel = 'channel',
  /** Applies only when a specific playbook is active. */
  Playbook = 'playbook',
}

/**
 * Defines how an internal slider value maps to runtime behavior.
 *
 * This allows the system to translate a simple 0-100 value into
 * meaningful prompt parameters, temperature settings, or other
 * configurable behaviors.
 */
export interface RuntimeMapping {
  /** The internal parameter this slider controls. */
  parameter_name: string;

  /** Minimum value of the internal parameter. */
  parameter_min: number;

  /** Maximum value of the internal parameter. */
  parameter_max: number;

  /** Type of mapping (linear, exponential, stepped). */
  mapping_type: 'linear' | 'exponential' | 'stepped';

  /** For stepped mappings, the defined steps. */
  steps?: Array<{
    /** Slider value threshold. */
    threshold: number;
    /** Internal parameter value at this step. */
    value: number;
    /** Label for this step. */
    label: string;
  }>;
}

/**
 * A single slider setting that operators can adjust.
 */
export interface SliderSetting {
  /** Unique slider identifier. */
  id: string;

  /** Human-readable name displayed in the admin UI. */
  name: string;

  /** Current internal value (0-100). */
  internal_value: number;

  /** Factory default value (0-100). */
  default_value: number;

  /** Minimum allowed value. */
  min: number;

  /** Maximum allowed value. */
  max: number;

  /** Human-readable description of what this slider controls. */
  description: string;

  /** How the slider value maps to runtime behavior. */
  runtime_mapping: RuntimeMapping;

  /** Category for grouping in the admin UI. */
  category?: string;

  /** Whether this slider is currently active. */
  active: boolean;
}

/**
 * A preset that bundles slider values for a common operational mode.
 */
export interface SliderPreset {
  /** Unique preset identifier. */
  id: string;

  /** Preset name. */
  name: SliderPresetName;

  /** Human-readable description of when to use this preset. */
  description: string;

  /** Map of slider IDs to their preset values. */
  values: Record<string, number>;

  /** Whether this is a system-defined preset (cannot be deleted). */
  system_defined: boolean;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}

/**
 * An override that applies slider values at a specific scope.
 *
 * Overrides take precedence over global settings when their
 * scope conditions match the current conversation context.
 */
export interface SliderOverride {
  /** Unique override identifier. */
  id: string;

  /** Scope at which this override applies. */
  scope: SliderOverrideScope;

  /** Channel this override applies to (when scope is 'channel'). */
  channel?: string;

  /** Playbook ID this override applies to (when scope is 'playbook'). */
  playbook_id?: string;

  /** Map of slider IDs to their override values. */
  values: Record<string, number>;

  /** ID of the operator who created this override. */
  created_by: string;

  /** Reason for the override. */
  reason: string;

  /** Whether this override is currently active. */
  active: boolean;

  /** ISO 8601 timestamp when this override expires (null = permanent). */
  expires_at: string | null;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}
