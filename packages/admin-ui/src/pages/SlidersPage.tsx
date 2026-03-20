import { useState } from 'react';
import { Save, RotateCcw, Eye, Settings2 } from 'lucide-react';
import SliderControl from '../components/shared/SliderControl';

interface SliderConfig {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}

const initialSliders: SliderConfig[] = [
  { id: 'empathy', label: 'Empathy Dial', description: 'Controls warmth, compassion, and emotional mirroring in responses', value: 7, min: 1, max: 10, step: 1, minLabel: 'Clinical', maxLabel: 'Compassionate' },
  { id: 'urgency', label: 'Urgency Level', description: 'Adjusts how proactively the bot nudges toward scheduling', value: 5, min: 1, max: 10, step: 1, minLabel: 'Relaxed', maxLabel: 'Assertive' },
  { id: 'detail', label: 'Detail Level', description: 'Controls depth and length of informational responses', value: 6, min: 1, max: 10, step: 1, minLabel: 'Concise', maxLabel: 'Thorough' },
  { id: 'formality', label: 'Formality', description: 'Adjusts language register from casual to professional', value: 7, min: 1, max: 10, step: 1, minLabel: 'Casual', maxLabel: 'Formal' },
  { id: 'sales_pressure', label: 'Sales Pressure', description: 'Controls how strongly the bot promotes booking and services', value: 3, min: 1, max: 10, step: 1, minLabel: 'Informational', maxLabel: 'Promotional' },
  { id: 'autonomy', label: 'Bot Autonomy', description: 'How independently the bot acts before escalating to staff', value: 6, min: 1, max: 10, step: 1, minLabel: 'Conservative', maxLabel: 'Autonomous' },
  { id: 'followup_freq', label: 'Follow-Up Frequency', description: 'How aggressively the bot sends follow-up messages', value: 5, min: 1, max: 10, step: 1, minLabel: 'Minimal', maxLabel: 'Persistent' },
  { id: 'insurance_caution', label: 'Insurance Caution', description: 'Extra care level when discussing insurance and billing topics', value: 8, min: 1, max: 10, step: 1, minLabel: 'Standard', maxLabel: 'Ultra-Careful' },
];

const presets = [
  { id: 'concierge', label: 'Concierge', description: 'High empathy, high detail, low pressure', values: { empathy: 9, urgency: 3, detail: 8, formality: 8, sales_pressure: 2, autonomy: 4, followup_freq: 3, insurance_caution: 8 } },
  { id: 'balanced', label: 'Balanced', description: 'Moderate settings across all dimensions', values: { empathy: 6, urgency: 5, detail: 6, formality: 6, sales_pressure: 4, autonomy: 6, followup_freq: 5, insurance_caution: 7 } },
  { id: 'efficiency', label: 'Efficiency', description: 'Concise, action-oriented, higher autonomy', values: { empathy: 5, urgency: 7, detail: 4, formality: 5, sales_pressure: 5, autonomy: 8, followup_freq: 6, insurance_caution: 6 } },
  { id: 'recovery', label: 'Recovery Mode', description: 'Optimized for missed call and drop-off re-engagement', values: { empathy: 8, urgency: 7, detail: 5, formality: 6, sales_pressure: 4, autonomy: 7, followup_freq: 8, insurance_caution: 7 } },
  { id: 'insurance_sensitive', label: 'Insurance-Sensitive', description: 'Maximum caution for insurance-heavy conversations', values: { empathy: 7, urgency: 3, detail: 8, formality: 8, sales_pressure: 1, autonomy: 3, followup_freq: 3, insurance_caution: 10 } },
];

type ScopeType = 'global' | 'channel' | 'playbook';

const sampleResponses: Record<string, string[]> = {
  low: [
    'Your appointment is confirmed for Tuesday at 2pm. Please bring your insurance card.',
    'We have availability tomorrow. Would you like to book?',
  ],
  medium: [
    'Great news! I have a consultation slot available Tuesday at 2pm that would work well for you. I know dealing with vein concerns can feel overwhelming, but our team will take excellent care of you. Shall I reserve that time?',
    'I understand you missed our call earlier. We wanted to follow up on your inquiry about vein treatment options. Would you like to schedule a quick consultation?',
  ],
  high: [
    'Thank you so much for reaching out to us. I completely understand how concerning vein symptoms can be, and I want you to know that you are in very capable hands with our team. Dr. Martinez has extensive experience with exactly the type of symptoms you have described. I would love to find you the perfect appointment time - we have a wonderful slot available Tuesday at 2pm. Would that work for you?',
    'I am so sorry we missed connecting with you earlier. Your health and comfort are our top priority, and I want to make sure we address your concerns as thoroughly as possible. Our team has helped many patients with similar experiences and the outcomes have been truly wonderful.',
  ],
};

export default function SlidersPage() {
  const [sliders, setSliders] = useState(initialSliders);
  const [scope, setScope] = useState<ScopeType>('global');
  const [hasChanges, setHasChanges] = useState(false);

  const updateSlider = (id: string, value: number) => {
    setSliders((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    setHasChanges(true);
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setSliders((prev) =>
      prev.map((s) => ({
        ...s,
        value: preset.values[s.id as keyof typeof preset.values] ?? s.value,
      })),
    );
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setSliders(initialSliders);
    setHasChanges(false);
  };

  const avgLevel =
    sliders.reduce((sum, s) => sum + s.value, 0) / sliders.length;
  const sampleKey = avgLevel <= 4 ? 'low' : avgLevel <= 7 ? 'medium' : 'high';

  return (
    <div className="space-y-6">
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

      {/* Presets */}
      <div className="card card-body">
        <h3 className="text-sm font-medium mb-3">Quick Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="text-left px-4 py-3 rounded-lg border border-healthcare-border hover:border-brand-300 hover:bg-brand-50 transition-colors"
            >
              <p className="text-sm font-medium">{p.label}</p>
              <p className="text-xs text-healthcare-muted mt-0.5">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card card-body space-y-6">
            {sliders.map((s) => (
              <SliderControl
                key={s.id}
                label={s.label}
                description={s.description}
                value={s.value}
                min={s.min}
                max={s.max}
                step={s.step}
                minLabel={s.minLabel}
                maxLabel={s.maxLabel}
                onChange={(val) => updateSlider(s.id, val)}
              />
            ))}
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
              Sample responses at current slider settings:
            </p>
            {sampleResponses[sampleKey].map((resp, i) => (
              <div
                key={i}
                className="bg-brand-50 rounded-lg p-3 text-sm text-brand-900 border border-brand-100"
              >
                {resp}
              </div>
            ))}
            <div className="text-xs text-healthcare-muted text-center pt-2 border-t border-healthcare-border">
              Avg. intensity: {avgLevel.toFixed(1)} / 10
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
