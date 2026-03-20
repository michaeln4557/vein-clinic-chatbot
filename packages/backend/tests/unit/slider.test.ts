/**
 * Slider Boundary Enforcement Tests
 *
 * Tests slider boundary enforcement, preset application,
 * and override resolution (global < channel < playbook).
 */

// ---- Types ----

interface SliderConfig {
  /** Tone: 0 = very formal, 100 = very casual */
  tone: number;
  /** Empathy: 0 = minimal, 100 = maximum */
  empathy: number;
  /** Urgency: 0 = relaxed, 100 = pressing */
  urgency: number;
  /** Detail level: 0 = brief, 100 = verbose */
  detail: number;
  /** Sales pressure: 0 = none, 100 = aggressive */
  salesPressure: number;
}

interface SliderPreset {
  name: string;
  values: Partial<SliderConfig>;
}

type OverrideLevel = 'global' | 'channel' | 'playbook';

interface SliderOverride {
  level: OverrideLevel;
  values: Partial<SliderConfig>;
}

// ---- Implementation ----

const SLIDER_BOUNDS = {
  tone: { min: 0, max: 100 },
  empathy: { min: 0, max: 100 },
  urgency: { min: 0, max: 100 },
  detail: { min: 0, max: 100 },
  salesPressure: { min: 0, max: 60 }, // Hard cap: never too aggressive for healthcare
};

const DEFAULT_SLIDERS: SliderConfig = {
  tone: 60,
  empathy: 70,
  urgency: 30,
  detail: 50,
  salesPressure: 20,
};

const PRESETS: Record<string, SliderPreset> = {
  'warm-healthcare': {
    name: 'Warm Healthcare',
    values: { tone: 65, empathy: 80, urgency: 25, detail: 55, salesPressure: 15 },
  },
  'efficient-booking': {
    name: 'Efficient Booking',
    values: { tone: 50, empathy: 60, urgency: 50, detail: 40, salesPressure: 30 },
  },
  'missed-call-recovery': {
    name: 'Missed Call Recovery',
    values: { tone: 70, empathy: 75, urgency: 45, detail: 45, salesPressure: 35 },
  },
  'insurance-inquiry': {
    name: 'Insurance Inquiry',
    values: { tone: 55, empathy: 65, urgency: 20, detail: 70, salesPressure: 10 },
  },
};

function clampSliderValue(
  key: keyof SliderConfig,
  value: number
): { clamped: number; wasClamped: boolean } {
  const bounds = SLIDER_BOUNDS[key];
  if (value < bounds.min) return { clamped: bounds.min, wasClamped: true };
  if (value > bounds.max) return { clamped: bounds.max, wasClamped: true };
  return { clamped: value, wasClamped: false };
}

function applyPreset(preset: SliderPreset): SliderConfig {
  const result = { ...DEFAULT_SLIDERS };
  for (const [key, value] of Object.entries(preset.values)) {
    const k = key as keyof SliderConfig;
    const { clamped } = clampSliderValue(k, value as number);
    result[k] = clamped;
  }
  return result;
}

function resolveOverrides(overrides: SliderOverride[]): SliderConfig {
  // Priority: global < channel < playbook
  const priorityOrder: OverrideLevel[] = ['global', 'channel', 'playbook'];
  const sorted = [...overrides].sort(
    (a, b) => priorityOrder.indexOf(a.level) - priorityOrder.indexOf(b.level)
  );

  const result = { ...DEFAULT_SLIDERS };
  for (const override of sorted) {
    for (const [key, value] of Object.entries(override.values)) {
      const k = key as keyof SliderConfig;
      const { clamped } = clampSliderValue(k, value as number);
      result[k] = clamped;
    }
  }
  return result;
}

function validateSliderConfig(config: SliderConfig): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    const k = key as keyof SliderConfig;
    const bounds = SLIDER_BOUNDS[k];
    if (bounds) {
      if (value < bounds.min) violations.push(`${key} below minimum (${value} < ${bounds.min})`);
      if (value > bounds.max) violations.push(`${key} above maximum (${value} > ${bounds.max})`);
    }
  }
  return { valid: violations.length === 0, violations };
}

// ---- Tests ----

describe('Slider Boundary Enforcement', () => {
  it('should accept values within bounds', () => {
    const result = clampSliderValue('tone', 50);
    expect(result.clamped).toBe(50);
    expect(result.wasClamped).toBe(false);
  });

  it('should clamp values below minimum to minimum', () => {
    const result = clampSliderValue('tone', -10);
    expect(result.clamped).toBe(0);
    expect(result.wasClamped).toBe(true);
  });

  it('should clamp values above maximum to maximum', () => {
    const result = clampSliderValue('tone', 150);
    expect(result.clamped).toBe(100);
    expect(result.wasClamped).toBe(true);
  });

  it('should enforce hard cap on salesPressure at 60', () => {
    const result = clampSliderValue('salesPressure', 80);
    expect(result.clamped).toBe(60);
    expect(result.wasClamped).toBe(true);
  });

  it('should allow salesPressure at the cap boundary', () => {
    const result = clampSliderValue('salesPressure', 60);
    expect(result.clamped).toBe(60);
    expect(result.wasClamped).toBe(false);
  });

  it('should accept boundary values (0 and 100)', () => {
    expect(clampSliderValue('tone', 0).wasClamped).toBe(false);
    expect(clampSliderValue('tone', 100).wasClamped).toBe(false);
  });
});

describe('Preset Application', () => {
  it('should apply warm-healthcare preset', () => {
    const preset = PRESETS['warm-healthcare'];
    const config = applyPreset(preset);
    expect(config.tone).toBe(65);
    expect(config.empathy).toBe(80);
    expect(config.salesPressure).toBe(15);
  });

  it('should apply efficient-booking preset', () => {
    const config = applyPreset(PRESETS['efficient-booking']);
    expect(config.urgency).toBe(50);
    expect(config.detail).toBe(40);
    expect(config.salesPressure).toBe(30);
  });

  it('should apply missed-call-recovery preset', () => {
    const config = applyPreset(PRESETS['missed-call-recovery']);
    expect(config.empathy).toBe(75);
    expect(config.urgency).toBe(45);
    expect(config.salesPressure).toBe(35);
  });

  it('should clamp preset values that exceed bounds', () => {
    const extremePreset: SliderPreset = {
      name: 'Extreme',
      values: { salesPressure: 90 }, // exceeds cap of 60
    };
    const config = applyPreset(extremePreset);
    expect(config.salesPressure).toBe(60);
  });

  it('should use defaults for fields not in the preset', () => {
    const partialPreset: SliderPreset = {
      name: 'Partial',
      values: { tone: 80 },
    };
    const config = applyPreset(partialPreset);
    expect(config.tone).toBe(80);
    expect(config.empathy).toBe(DEFAULT_SLIDERS.empathy);
    expect(config.urgency).toBe(DEFAULT_SLIDERS.urgency);
  });
});

describe('Override Resolution (global < channel < playbook)', () => {
  it('should apply global overrides to defaults', () => {
    const config = resolveOverrides([
      { level: 'global', values: { tone: 40 } },
    ]);
    expect(config.tone).toBe(40);
  });

  it('should let channel override global', () => {
    const config = resolveOverrides([
      { level: 'global', values: { tone: 40, empathy: 50 } },
      { level: 'channel', values: { tone: 70 } },
    ]);
    expect(config.tone).toBe(70); // channel wins
    expect(config.empathy).toBe(50); // global still applies
  });

  it('should let playbook override both channel and global', () => {
    const config = resolveOverrides([
      { level: 'global', values: { tone: 40 } },
      { level: 'channel', values: { tone: 60 } },
      { level: 'playbook', values: { tone: 80 } },
    ]);
    expect(config.tone).toBe(80);
  });

  it('should apply overrides in correct priority regardless of input order', () => {
    const config = resolveOverrides([
      { level: 'playbook', values: { empathy: 90 } },
      { level: 'global', values: { empathy: 30 } },
      { level: 'channel', values: { empathy: 60 } },
    ]);
    expect(config.empathy).toBe(90); // playbook wins
  });

  it('should clamp overrides that exceed bounds', () => {
    const config = resolveOverrides([
      { level: 'playbook', values: { salesPressure: 100 } },
    ]);
    expect(config.salesPressure).toBe(60); // clamped to hard cap
  });

  it('should preserve defaults for non-overridden fields', () => {
    const config = resolveOverrides([
      { level: 'global', values: { tone: 40 } },
    ]);
    expect(config.empathy).toBe(DEFAULT_SLIDERS.empathy);
    expect(config.urgency).toBe(DEFAULT_SLIDERS.urgency);
    expect(config.detail).toBe(DEFAULT_SLIDERS.detail);
    expect(config.salesPressure).toBe(DEFAULT_SLIDERS.salesPressure);
  });
});

describe('Slider Config Validation', () => {
  it('should validate a correct config', () => {
    const result = validateSliderConfig(DEFAULT_SLIDERS);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect below-minimum violations', () => {
    const result = validateSliderConfig({ ...DEFAULT_SLIDERS, tone: -5 });
    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual(expect.stringContaining('tone below minimum'));
  });

  it('should detect above-maximum violations', () => {
    const result = validateSliderConfig({ ...DEFAULT_SLIDERS, salesPressure: 80 });
    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual(expect.stringContaining('salesPressure above maximum'));
  });

  it('should detect multiple violations', () => {
    const result = validateSliderConfig({
      tone: -10,
      empathy: 200,
      urgency: 50,
      detail: 50,
      salesPressure: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBe(3);
  });
});
