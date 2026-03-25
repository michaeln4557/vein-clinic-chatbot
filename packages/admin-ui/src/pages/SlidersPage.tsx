import { useState } from 'react';
import { Save, RotateCcw, Eye, Settings2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import SliderControl from '../components/shared/SliderControl';

/* ── Types ─────────────────────────────────────────── */

interface SliderConfig {
  id: string;
  label: string;
  helper: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}

interface ToggleConfig {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

/* ── Core Sliders (4 visible) ──────────────────────── */

const initialCoreSliders: SliderConfig[] = [
  { id: 'empathy', label: 'Empathy', helper: 'Controls warmth and reassurance', description: 'How much warmth, emotional acknowledgment, and reassurance the bot uses', value: 6, min: 0, max: 10, step: 1, minLabel: 'Neutral', maxLabel: 'Compassionate' },
  { id: 'conversion_drive', label: 'Conversion Drive', helper: 'Controls how strongly the bot moves toward booking', description: 'How proactively the bot guides the patient toward scheduling', value: 5, min: 0, max: 10, step: 1, minLabel: 'Informational', maxLabel: 'Proactive' },
  { id: 'detail', label: 'Detail Level', helper: 'Controls response length and explanation depth', description: 'How much context and explanation the bot provides', value: 5, min: 0, max: 10, step: 1, minLabel: 'Concise', maxLabel: 'Thorough' },
  { id: 'insurance_sensitivity', label: 'Insurance Sensitivity', helper: 'Controls caution and reassurance when discussing insurance', description: 'Extra caution and reassurance in insurance-related responses', value: 7, min: 0, max: 10, step: 1, minLabel: 'Standard', maxLabel: 'Ultra-Careful' },
];

/* ── Advanced Sliders (hidden by default) ──────────── */

const initialAdvancedSliders: SliderConfig[] = [
  { id: 'formality', label: 'Formality', helper: 'Language register from casual to professional', description: 'Adjusts language register', value: 6, min: 0, max: 10, step: 1, minLabel: 'Casual', maxLabel: 'Formal' },
  { id: 'autonomy', label: 'Bot Autonomy', helper: 'How independently the bot acts before escalating', description: 'How independently the bot handles situations', value: 6, min: 0, max: 10, step: 1, minLabel: 'Conservative', maxLabel: 'Autonomous' },
  { id: 'followup_freq', label: 'Follow-Up Frequency', helper: 'How persistently the bot sends follow-ups', description: 'Follow-up message aggressiveness', value: 5, min: 0, max: 10, step: 1, minLabel: 'Minimal', maxLabel: 'Persistent' },
];

/* ── Presets (4 total) ─────────────────────────────── */

interface Preset {
  id: string;
  label: string;
  bullets: string[];
  core: Record<string, number>;
  advanced: Record<string, number>;
}

const presets: Preset[] = [
  {
    id: 'concierge',
    label: 'Concierge',
    bullets: ['High empathy', 'Low pressure', 'More explanation', 'More reassurance'],
    core: { empathy: 9, conversion_drive: 3, detail: 8, insurance_sensitivity: 8 },
    advanced: { formality: 8, autonomy: 4, followup_freq: 3 },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    bullets: ['Moderate tone', 'Balanced booking guidance', 'Medium detail', 'Standard caution'],
    core: { empathy: 6, conversion_drive: 5, detail: 5, insurance_sensitivity: 7 },
    advanced: { formality: 6, autonomy: 6, followup_freq: 5 },
  },
  {
    id: 'efficiency',
    label: 'Efficiency',
    bullets: ['Faster booking', 'Shorter responses', 'Direct tone', 'Less explanation'],
    core: { empathy: 4, conversion_drive: 8, detail: 3, insurance_sensitivity: 6 },
    advanced: { formality: 5, autonomy: 8, followup_freq: 6 },
  },
  {
    id: 'insurance_sensitive',
    label: 'Insurance-Sensitive',
    bullets: ['Extra care with insurance language', 'Strong reassurance', 'Medium-high empathy', 'Maximum caution'],
    core: { empathy: 7, conversion_drive: 5, detail: 6, insurance_sensitivity: 10 },
    advanced: { formality: 7, autonomy: 3, followup_freq: 3 },
  },
];

/* ── Feature Toggles ───────────────────────────────── */

const initialToggles: ToggleConfig[] = [
  { id: 'typing_indicator_enabled', label: 'Typing Indicator', description: 'Show typing dots before bot replies to simulate a real person typing', enabled: true },
  { id: 'calendar_invite_enabled', label: 'Calendar Invite Option', description: 'Offer to send patients a calendar invite after booking confirmation', enabled: true },
  { id: 'insurance_card_request', label: 'Auto-Request Insurance Card', description: 'Always ask for insurance card photo before confirming appointments', enabled: true },
];

/* ── Preview Responses ─────────────────────────────── */

interface PreviewPair {
  scenario: string;
  low: string;
  high: string;
}

const previewPairs: Record<string, PreviewPair> = {
  empathy: {
    scenario: 'Patient says they have varicose veins',
    low: "What's been going on?",
    high: "I'm sorry that's been bothering you. A lot of people reach out about varicose veins. What's been going on?",
  },
  conversion_drive: {
    scenario: 'Patient is interested in treatment',
    low: 'Let me know if you\'d like to come in sometime.',
    high: 'I can help you find a time. What days work best for you this week or next?',
  },
  detail: {
    scenario: 'Patient asks about treatment options',
    low: 'Our doctors can walk you through options at your consultation.',
    high: 'There are a few common approaches for varicose veins, including radiofrequency ablation and sclerotherapy. Our doctors will evaluate and recommend the best option for you during your consultation.',
  },
  insurance_sensitivity: {
    scenario: 'Patient asks if their insurance is accepted',
    low: 'We work with many plans. We can check for you.',
    high: "We work with many plans, but coverage can vary depending on the specific plan. We'll verify everything ahead of time and follow up with you before the appointment so you know exactly what to expect. That way there are no surprises.",
  },
};

/* ── Scope Type ─────────────────────────────────────── */

type ScopeType = 'global' | 'channel' | 'playbook';

/* ── Component ─────────────────────────────────────── */

export default function SlidersPage() {
  const [coreSliders, setCoreSliders] = useState(initialCoreSliders);
  const [advancedSliders, setAdvancedSliders] = useState(initialAdvancedSliders);
  const [toggles, setToggles] = useState(initialToggles);
  const [scope, setScope] = useState<ScopeType>('global');
  const [activePreset, setActivePreset] = useState<string | null>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewSlider, setPreviewSlider] = useState<string>('empathy');

  const updateCoreSlider = (id: string, value: number) => {
    setCoreSliders((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    setActivePreset(null);
    setHasChanges(true);
  };

  const updateAdvancedSlider = (id: string, value: number) => {
    setAdvancedSliders((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    setActivePreset(null);
    setHasChanges(true);
  };

  const applyPreset = (preset: Preset) => {
    setCoreSliders((prev) =>
      prev.map((s) => ({
        ...s,
        value: preset.core[s.id] ?? s.value,
      })),
    );
    setAdvancedSliders((prev) =>
      prev.map((s) => ({
        ...s,
        value: preset.advanced[s.id] ?? s.value,
      })),
    );
    setActivePreset(preset.id);
    setHasChanges(true);
  };

  const updateToggle = (id: string, enabled: boolean) => {
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled } : t)));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setCoreSliders(initialCoreSliders);
    setAdvancedSliders(initialAdvancedSliders);
    setToggles(initialToggles);
    setActivePreset('balanced');
    setHasChanges(false);
  };

  const currentPreview = previewPairs[previewSlider];
  const currentSliderValue = coreSliders.find((s) => s.id === previewSlider)?.value ?? 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Behavior Controls</h1>
          <p className="text-healthcare-muted mt-1">
            Fine-tune chatbot personality and response behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetToDefaults} className="btn-secondary" disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button className="btn-primary" disabled={!hasChanges}>
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="card card-body">
        <div className="flex items-center gap-4">
          <Settings2 className="w-4 h-4 text-healthcare-muted" />
          <span className="text-sm font-medium">Apply to:</span>
          <div className="flex gap-1.5 bg-gray-100 rounded-lg p-0.5">
            {([
              { value: 'global', label: 'Global' },
              { value: 'channel', label: 'By Channel' },
              { value: 'playbook', label: 'By Playbook' },
            ] as const).map((s) => (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  scope === s.value
                    ? 'bg-white text-healthcare-text shadow-sm'
                    : 'text-healthcare-muted hover:text-healthcare-text'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {scope === 'channel' && (
            <select className="select w-40">
              <option>All Channels</option>
              <option>SMS</option>
              <option>Web Chat</option>
              <option>Voice</option>
            </select>
          )}
          {scope === 'playbook' && (
            <select className="select w-56">
              <option>Select playbook...</option>
              <option>Inbound New Patient</option>
              <option>Missed Call Recovery</option>
              <option>Insurance Pre-Auth</option>
            </select>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="card card-body">
        <h3 className="text-sm font-medium mb-3">Quick Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`text-left px-4 py-3 rounded-lg border transition-colors relative ${
                activePreset === p.id
                  ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
                  : 'border-healthcare-border hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              {activePreset === p.id && (
                <span className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-brand-500" />
                </span>
              )}
              <p className="text-sm font-semibold">{p.label}</p>
              <ul className="mt-1.5 space-y-0.5">
                {p.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-healthcare-muted flex items-start gap-1">
                    <span className="text-brand-400 mt-0.5">&#x2022;</span>
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="card card-body">
        <h3 className="text-sm font-medium mb-4">Feature Toggles</h3>
        <div className="space-y-3">
          {toggles.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-healthcare-border last:border-0">
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-healthcare-muted mt-0.5">{t.description}</p>
              </div>
              <button
                onClick={() => updateToggle(t.id, !t.enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  t.enabled ? 'bg-brand-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    t.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Core Sliders */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card card-body space-y-6">
            <h3 className="text-sm font-medium">Core Controls</h3>
            {coreSliders.map((s) => (
              <div
                key={s.id}
                onClick={() => setPreviewSlider(s.id)}
                className={`cursor-pointer rounded-lg p-3 -m-3 transition-colors ${
                  previewSlider === s.id ? 'bg-brand-50/50 ring-1 ring-brand-100' : 'hover:bg-gray-50'
                }`}
              >
                <SliderControl
                  label={s.label}
                  description={s.helper}
                  value={s.value}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  minLabel={s.minLabel}
                  maxLabel={s.maxLabel}
                  onChange={(val) => updateCoreSlider(s.id, val)}
                />
              </div>
            ))}
          </div>

          {/* Advanced Settings (collapsible) */}
          <div className="card">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="card-body w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                {showAdvanced ? (
                  <ChevronDown className="w-4 h-4 text-healthcare-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-healthcare-muted" />
                )}
                <h3 className="text-sm font-medium">Advanced Settings</h3>
              </div>
              <span className="text-xs text-healthcare-muted">
                {showAdvanced ? 'Hide' : 'Show'} additional controls
              </span>
            </button>
            {showAdvanced && (
              <div className="card-body border-t border-healthcare-border space-y-6 pt-4">
                {advancedSliders.map((s) => (
                  <SliderControl
                    key={s.id}
                    label={s.label}
                    description={s.helper}
                    value={s.value}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    minLabel={s.minLabel}
                    maxLabel={s.maxLabel}
                    onChange={(val) => updateAdvancedSlider(s.id, val)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Eye className="w-4 h-4 text-healthcare-muted" />
            <h3 className="text-sm font-medium">Response Preview</h3>
          </div>
          <div className="card-body space-y-4">
            <p className="text-xs text-healthcare-muted">
              Click a slider to see how it affects responses:
            </p>

            {/* Scenario */}
            <div className="text-xs font-medium text-healthcare-muted uppercase tracking-wide">
              {currentPreview.scenario}
            </div>

            {/* Low example */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Low</span>
                <span className="text-xs text-healthcare-muted">
                  {coreSliders.find((s) => s.id === previewSlider)?.minLabel}
                </span>
              </div>
              <div className={`rounded-lg p-3 text-sm border transition-colors ${
                currentSliderValue <= 3
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : 'bg-gray-50 border-gray-100 text-gray-600'
              }`}>
                {currentPreview.low}
              </div>
            </div>

            {/* High example */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded">High</span>
                <span className="text-xs text-healthcare-muted">
                  {coreSliders.find((s) => s.id === previewSlider)?.maxLabel}
                </span>
              </div>
              <div className={`rounded-lg p-3 text-sm border transition-colors ${
                currentSliderValue >= 7
                  ? 'bg-brand-50 border-brand-200 text-brand-900'
                  : 'bg-gray-50 border-gray-100 text-gray-600'
              }`}>
                {currentPreview.high}
              </div>
            </div>

            {/* Current position indicator */}
            <div className="text-xs text-center text-healthcare-muted pt-2 border-t border-healthcare-border">
              <span className="font-medium capitalize">{previewSlider.replace('_', ' ')}</span>
              {': '}
              <span className="font-semibold text-brand-600">{currentSliderValue}</span>
              <span> / 10</span>
              {currentSliderValue <= 3 && ' (Low range)'}
              {currentSliderValue >= 4 && currentSliderValue <= 7 && ' (Medium range)'}
              {currentSliderValue >= 8 && ' (High range)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
