import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, RotateCcw, Settings2, X, Sparkles } from 'lucide-react';
import {
  DEFAULT_BEHAVIOR_PROFILE,
  BEHAVIOR_SLIDERS,
  CONVERSATION_STAGES,
  STAGE_FIX_SUGGESTIONS,
  deriveBehaviorSettings,
  derivedToToneSettings,
  getEffectiveSliders,
  type BehaviorProfile,
  type ConversationStage,
  type SpeedSetting,
} from '../lib/behaviorMapping';
import SafeguardsBanner from '../components/behavior/SafeguardsBanner';
import BehaviorSlider from '../components/behavior/BehaviorSlider';
import LivePreview from '../components/behavior/LivePreview';

/* ── Speed options for segmented controls ────────── */

const SPEED_OPTIONS: { value: SpeedSetting; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'fast', label: 'Fast' },
];

/* ── Scenario map for preview stage alignment ─────── */
const STAGE_TO_SCENARIO: Record<ConversationStage, string> = {
  Early: 'symptoms',
  Symptoms: 'symptoms',
  Insurance: 'insurance',
  Scheduling: 'booking',
};

/* ── Component ───────────────────────────────────── */

export default function SlidersPage() {
  const [searchParams] = useSearchParams();
  const initialStage = searchParams.get('stage');
  const [profile, setProfile] = useState<BehaviorProfile>({ ...DEFAULT_BEHAVIOR_PROFILE });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedStage, setSelectedStage] = useState<ConversationStage>('Early');
  const [showSuggestionBanner, setShowSuggestionBanner] = useState(false);
  const deepLinkAppliedRef = useRef(false);

  // Handle deep-link from funnel analytics (?stage=Insurance)
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;
    if (initialStage && CONVERSATION_STAGES.includes(initialStage as ConversationStage)) {
      deepLinkAppliedRef.current = true;
      const stage = initialStage as ConversationStage;
      setSelectedStage(stage);

      setProfile((prev) => {
        // Only prefill if no override exists for this stage
        const hasExisting = prev.stageOverrides[stage];
        const suggestions = hasExisting ? undefined : STAGE_FIX_SUGGESTIONS[stage];
        return {
          ...prev,
          stageMode: true,
          stageOverrides: suggestions
            ? { ...prev.stageOverrides, [stage]: suggestions }
            : prev.stageOverrides,
        };
      });
      setHasChanges(true);
      setShowSuggestionBanner(true);
    }
  }, [initialStage]);

  const update = <K extends keyof BehaviorProfile>(key: K, value: BehaviorProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateStageSlider = (key: 'humanizationLevel' | 'bookingApproach', value: number) => {
    setProfile((prev) => ({
      ...prev,
      stageOverrides: {
        ...prev.stageOverrides,
        [selectedStage]: {
          humanizationLevel: prev.stageOverrides[selectedStage]?.humanizationLevel ?? prev.humanizationLevel,
          bookingApproach: prev.stageOverrides[selectedStage]?.bookingApproach ?? prev.bookingApproach,
          [key]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const clearStageOverride = (stage: ConversationStage) => {
    setProfile((prev) => {
      const next = { ...prev.stageOverrides };
      delete next[stage];
      return { ...prev, stageOverrides: next };
    });
    setHasChanges(true);
  };

  const resetAll = () => {
    setProfile({ ...DEFAULT_BEHAVIOR_PROFILE });
    setHasChanges(false);
    setShowSuggestionBanner(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const derived = deriveBehaviorSettings(profile);
      const toneSettings = derivedToToneSettings(derived);

      // Build per-stage derived settings if stage mode is on
      const stageDerived: Record<string, { derived: ReturnType<typeof deriveBehaviorSettings>; toneSettings: ReturnType<typeof derivedToToneSettings> }> = {};
      if (profile.stageMode) {
        for (const [stage, override] of Object.entries(profile.stageOverrides)) {
          const stageProfile = { ...profile, ...override };
          const d = deriveBehaviorSettings(stageProfile);
          stageDerived[stage] = { derived: d, toneSettings: derivedToToneSettings(d) };
        }
      }

      const resp = await fetch('http://localhost:3001/api/v1/chat/behavior-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, toneSettings, derived, stageDerived }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSaveStatus(`Saved! Persona: ${data.personaLabel}`);
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Error saving');
        setTimeout(() => setSaveStatus(''), 3000);
      }
      setHasChanges(false);
    } catch {
      setSaveStatus('Connection error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Current effective slider values (stage-aware)
  const effectiveSliders = profile.stageMode
    ? getEffectiveSliders(profile, selectedStage)
    : { humanizationLevel: profile.humanizationLevel, bookingApproach: profile.bookingApproach };

  const hasStageOverride = profile.stageMode && !!profile.stageOverrides[selectedStage];
  const overrideCount = Object.keys(profile.stageOverrides).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Behavior Controls</h1>
          <p className="text-healthcare-muted mt-1 text-sm">
            Adjust how the coordinator sounds and responds. Clinical workflow and booking rules stay protected.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className={`text-sm font-medium ${saveStatus.includes('Error') || saveStatus.includes('Connection') ? 'text-red-600' : 'text-green-600'}`}>
              {saveStatus}
            </span>
          )}
          <button onClick={resetAll} className="btn-secondary" disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={!hasChanges || saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Safeguards removed — guardrails are always-on and don't need UI prominence */}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT: Controls */}
        <div className="xl:col-span-3 space-y-6">
          {/* Mode toggle: Global / Stage-Specific */}
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => update('stageMode', false)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  !profile.stageMode
                    ? 'bg-white text-healthcare-text shadow-sm'
                    : 'text-healthcare-muted hover:text-healthcare-text'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => update('stageMode', true)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  profile.stageMode
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-healthcare-muted hover:text-healthcare-text'
                }`}
              >
                Stage-Specific
              </button>
            </div>
            <p className="text-xs text-healthcare-muted">
              {profile.stageMode
                ? `Adjust behavior per conversation stage${overrideCount > 0 ? ` (${overrideCount} override${overrideCount > 1 ? 's' : ''})` : ''}`
                : 'Same behavior across all stages'}
            </p>
          </div>

          {/* Suggestion banner from funnel deep-link */}
          {showSuggestionBanner && profile.stageMode && (
            <div className="flex items-start gap-3 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl">
              <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-800">
                  Suggested adjustments for {selectedStage}
                </p>
                <p className="text-xs text-brand-600 mt-0.5">
                  Based on funnel drop-off data. Review and save to apply.
                </p>
              </div>
              <button
                onClick={() => setShowSuggestionBanner(false)}
                className="text-brand-400 hover:text-brand-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stage tabs (only when stage mode is on) */}
          {profile.stageMode && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {CONVERSATION_STAGES.map((stage) => {
                const hasOverride = !!profile.stageOverrides[stage];
                return (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors relative ${
                      selectedStage === stage
                        ? 'bg-white text-healthcare-text shadow-sm'
                        : 'text-healthcare-muted hover:text-healthcare-text'
                    }`}
                  >
                    {stage}
                    {hasOverride && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Core sliders card */}
          <div className="card card-body space-y-8">
            {/* Card header when in stage mode */}
            {profile.stageMode && (
              <div className="flex items-center justify-between pb-2 border-b border-healthcare-line">
                <div>
                  <p className="text-sm font-semibold text-healthcare-text">
                    {selectedStage} Stage Behavior
                  </p>
                  <p className="text-xs text-healthcare-muted mt-0.5">
                    {hasStageOverride
                      ? 'Custom override active'
                      : 'Using global defaults — adjust to create an override'}
                  </p>
                </div>
                {hasStageOverride && (
                  <button
                    onClick={() => clearStageOverride(selectedStage)}
                    className="inline-flex items-center gap-1 text-xs text-healthcare-muted hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear override
                  </button>
                )}
              </div>
            )}

            {BEHAVIOR_SLIDERS.map((slider) => (
              <div
                key={slider.key}
                className={`-mx-6 px-6 py-5 ${
                  slider.key === 'humanizationLevel'
                    ? 'bg-brand-50/50 rounded-lg border border-brand-100'
                    : ''
                }`}
              >
                <BehaviorSlider
                  label={slider.label}
                  helperText={slider.helperText}
                  value={effectiveSliders[slider.key]}
                  stops={slider.stops}
                  onChange={(val) => {
                    if (profile.stageMode) {
                      updateStageSlider(slider.key, val);
                    } else {
                      update(slider.key, val);
                    }
                  }}
                  onReset={() => {
                    if (profile.stageMode) {
                      updateStageSlider(slider.key, profile[slider.key]);
                    } else {
                      update(slider.key, 3);
                    }
                  }}
                />
              </div>
            ))}
          </div>

          {/* Conversation Settings */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-healthcare-muted" />
              <h3 className="text-sm font-medium">Conversation Settings</h3>
            </div>
            <div className="card-body space-y-5">
              <SegmentedControl
                label="Response Speed"
                description="Controls how fast replies appear."
                options={SPEED_OPTIONS}
                value={profile.responseSpeed}
                onChange={(v) => update('responseSpeed', v)}
              />
              <SegmentedControl
                label="Typing Indicator Speed"
                description="Controls how long typing dots are shown before each message."
                options={SPEED_OPTIONS}
                value={profile.typingIndicatorSpeed}
                onChange={(v) => update('typingIndicatorSpeed', v)}
              />
              <hr className="border-healthcare-line" />
              <ToggleRow
                label="Calendar Invite"
                description="Offer to send patients a calendar invite after booking confirmation."
                enabled={profile.calendarInviteEnabled}
                onChange={(v) => update('calendarInviteEnabled', v)}
              />
              <ToggleRow
                label="Google Maps Link"
                description="Include a Google Maps link when confirming location."
                enabled={profile.googleMapsLinkEnabled}
                onChange={(v) => update('googleMapsLinkEnabled', v)}
              />
              <ToggleRow
                label="Insurance Card Upload"
                description="Ask for a photo of the insurance card. When off, collects plan name and member ID only."
                enabled={profile.insuranceCardUploadEnabled}
                onChange={(v) => update('insuranceCardUploadEnabled', v)}
              />
            </div>
          </div>

          {/* Reset all */}
          <div className="flex justify-center">
            <button
              onClick={resetAll}
              className="btn-ghost text-healthcare-muted"
              disabled={!hasChanges}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset all to default
            </button>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="xl:col-span-2">
          <LivePreview
            profile={profile}
            stage={profile.stageMode ? selectedStage : undefined}
            initialScenario={profile.stageMode ? STAGE_TO_SCENARIO[selectedStage] : undefined}
            onStageChange={(s) => setSelectedStage(s)}
          />
        </div>
      </div>

      {/* Go Live: Embed Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-lg font-semibold">Go Live</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Add this code to your website to embed the chatbot. It will use the behavior settings you configure above.
        </p>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap">{`<!-- Vein Treatment Clinic Chat Widget -->
<script src="https://your-domain.com/vein-clinic-chat.iife.js"></script>
<script>
  VeinClinicChat.init({
    apiUrl: 'https://api.your-domain.com',
    channel: 'web'
  });
</script>`}</pre>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`<!-- Vein Treatment Clinic Chat Widget -->\n<script src="https://your-domain.com/vein-clinic-chat.iife.js"></script>\n<script>\n  VeinClinicChat.init({\n    apiUrl: 'https://api.your-domain.com',\n    channel: 'web'\n  });\n</script>`);
            }}
            className="btn-secondary text-sm"
          >
            Copy Code
          </button>
          <a
            href="http://localhost:3200"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Open Live Chatbot
          </a>
        </div>
      </div>

    </div>
  );
}

/* ── Segmented Control ───────────────────────────── */

function SegmentedControl<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string;
  description: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-healthcare-text">{label}</p>
        <p className="text-xs text-healthcare-muted mt-0.5">{description}</p>
      </div>
      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 flex-shrink-0 ml-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              value === opt.value
                ? 'bg-white text-healthcare-text shadow-sm'
                : 'text-healthcare-muted hover:text-healthcare-text'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Toggle Row ──────────────────────────────────── */

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-healthcare-text">{label}</p>
        <p className="text-xs text-healthcare-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
          enabled ? 'bg-brand-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
