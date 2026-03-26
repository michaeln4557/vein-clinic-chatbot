import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import type { BehaviorProfile, ConversationStage } from '../../lib/behaviorMapping';
import { DEFAULT_BEHAVIOR_PROFILE, getEffectiveSliders, CONVERSATION_STAGES } from '../../lib/behaviorMapping';
import {
  PREVIEW_SCENARIOS,
  generatePreviewResponse,
  generateCustomPreviewResponse,
  getPreviewTiming,
  getChangeDescriptions,
  COMPARE_PRESETS,
} from '../../lib/previewEngine';
import PreviewChat from './PreviewChat';

interface LivePreviewProps {
  profile: BehaviorProfile;
  stage?: ConversationStage;
  initialScenario?: string;
  /** Called when operator picks a stage inside preview (syncs with left panel) */
  onStageChange?: (stage: ConversationStage) => void;
}

export default function LivePreview({ profile, stage, initialScenario, onStageChange }: LivePreviewProps) {
  const [scenarioId, setScenarioId] = useState(initialScenario || PREVIEW_SCENARIOS[0].id);
  const [customMessage, setCustomMessage] = useState('');
  const [compareId, setCompareId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  // Compute effective profile with stage-specific slider values
  const effectiveProfile = useMemo(() => {
    if (!stage || !profile.stageMode) return profile;
    const sliders = getEffectiveSliders(profile, stage);
    return { ...profile, ...sliders };
  }, [profile, stage]);

  // Sync scenario when initialScenario changes (stage switch from parent)
  const prevInitialRef = useRef(initialScenario);
  useEffect(() => {
    if (initialScenario && initialScenario !== prevInitialRef.current) {
      prevInitialRef.current = initialScenario;
      if (scenarioId !== 'custom') {
        setScenarioId(initialScenario);
      }
    }
  }, [initialScenario, scenarioId]);

  // Auto-replay when profile or scenario changes
  const prevProfileKey = useRef('');
  useEffect(() => {
    const key = `${effectiveProfile.humanizationLevel}-${effectiveProfile.bookingApproach}-${effectiveProfile.responseSpeed}-${scenarioId}-${stage}`;
    if (key !== prevProfileKey.current) {
      prevProfileKey.current = key;
      setPlayKey((k) => k + 1);
      setIsPlaying(true);
    }
  }, [effectiveProfile, scenarioId, stage]);

  const isCustom = scenarioId === 'custom';
  const scenario = PREVIEW_SCENARIOS.find((s) => s.id === scenarioId);
  const patientMessage = isCustom
    ? (customMessage || 'My legs have been hurting a lot lately.')
    : (scenario?.patientMessage ?? '');

  const currentBotMessages = useMemo(
    () => isCustom
      ? generateCustomPreviewResponse(effectiveProfile)
      : generatePreviewResponse(effectiveProfile, scenarioId),
    [effectiveProfile, scenarioId, isCustom],
  );
  const currentTiming = useMemo(() => getPreviewTiming(effectiveProfile), [effectiveProfile]);

  const comparePreset = COMPARE_PRESETS.find((p) => p.id === compareId);
  const compareBotMessages = useMemo(
    () => {
      if (!comparePreset) return [];
      return isCustom
        ? generateCustomPreviewResponse(comparePreset.profile)
        : generatePreviewResponse(comparePreset.profile, scenarioId);
    },
    [comparePreset, scenarioId, isCustom],
  );
  const compareTiming = useMemo(
    () => comparePreset ? getPreviewTiming(comparePreset.profile) : currentTiming,
    [comparePreset, currentTiming],
  );

  const changes = useMemo(() => getChangeDescriptions(effectiveProfile), [effectiveProfile]);

  const handleReplay = useCallback(() => {
    setPlayKey((k) => k + 1);
    setIsPlaying(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleScenarioChange = useCallback((id: string) => {
    setScenarioId(id);
    setPlayKey((k) => k + 1);
    setIsPlaying(true);
  }, []);

  const handleCustomSubmit = useCallback(() => {
    if (customMessage.trim()) {
      setPlayKey((k) => k + 1);
      setIsPlaying(true);
    }
  }, [customMessage]);

  return (
    <div className="card sticky top-8">
      <div className="card-header">
        <h3 className="text-sm font-medium">Live Preview</h3>
        <p className="text-xs text-healthcare-muted mt-0.5">
          See how settings change coordinator behavior in real time.
        </p>
      </div>

      <div className="card-body space-y-3">
        {/* Stage selector (when in stage mode) */}
        {profile.stageMode && (
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {CONVERSATION_STAGES.map((s) => {
              const hasOverride = !!profile.stageOverrides[s];
              return (
                <button
                  key={s}
                  onClick={() => onStageChange?.(s)}
                  className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-colors relative ${
                    stage === s
                      ? 'bg-white text-healthcare-text shadow-sm'
                      : 'text-healthcare-muted hover:text-healthcare-text'
                  }`}
                >
                  {s}
                  {hasOverride && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Scenario picker */}
        <select
          value={scenarioId}
          onChange={(e) => handleScenarioChange(e.target.value)}
          className="select text-xs"
        >
          {PREVIEW_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
          <option value="custom">Custom message...</option>
        </select>

        {/* Custom message input */}
        {isCustom && (
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); }}
            placeholder="Type a patient message..."
            className="input text-xs"
          />
        )}

        {/* Chat preview area */}
        <div className="bg-white border border-healthcare-line rounded-xl p-3 min-h-[200px] max-h-[380px] overflow-y-auto">
          {compareId && comparePreset ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 mb-1.5 block">
                  Your settings
                </span>
                <PreviewChat
                  key={`current-${playKey}`}
                  patientMessage={patientMessage}
                  botMessages={currentBotMessages}
                  typingDelayMs={currentTiming.typingDelayMs}
                  interBubblePauseMs={currentTiming.interBubblePauseMs}
                  isPlaying={isPlaying}
                  onComplete={handleComplete}
                />
              </div>
              <hr className="border-healthcare-line" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">
                  {comparePreset.label}
                </span>
                <PreviewChat
                  key={`compare-${playKey}`}
                  patientMessage={patientMessage}
                  botMessages={compareBotMessages}
                  typingDelayMs={compareTiming.typingDelayMs}
                  interBubblePauseMs={compareTiming.interBubblePauseMs}
                  isPlaying={isPlaying}
                  onComplete={() => {}}
                />
              </div>
            </div>
          ) : (
            <PreviewChat
              key={`single-${playKey}`}
              patientMessage={patientMessage}
              botMessages={currentBotMessages}
              typingDelayMs={currentTiming.typingDelayMs}
              interBubblePauseMs={currentTiming.interBubblePauseMs}
              isPlaying={isPlaying}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* What Changed */}
        {changes.length > 0 && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-healthcare-muted">
              What changed
            </p>
            {changes.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-healthcare-text">
                {c.icon === 'up'
                  ? <ArrowUp className="w-3 h-3 text-brand-600" />
                  : <ArrowDown className="w-3 h-3 text-orange-500" />}
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-healthcare-muted">Compare:</span>
            <select
              value={compareId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null;
                setCompareId(id);
                if (id) { setPlayKey((k) => k + 1); setIsPlaying(true); }
              }}
              className="text-[11px] border border-healthcare-line rounded-md px-2 py-1 bg-white"
            >
              <option value="">Off</option>
              {COMPARE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <button onClick={handleReplay} className="btn-ghost text-xs" title="Replay preview">
            {isPlaying
              ? <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              : <Play className="w-3.5 h-3.5" />}
            <span>Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
