import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Wrench, CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react';
import {
  findMatchingPattern,
  type IssuePattern,
  type ConversationExample,
  type FixAction,
} from '../../data/mockConversationInsights';
import {
  DEFAULT_BEHAVIOR_PROFILE,
  deriveBehaviorSettings,
  derivedToToneSettings,
} from '../../lib/behaviorMapping';

/* ── Props ────────────────────────────────────────── */

interface InsightPanelProps {
  stageFilter: string;
  reasonFilter: string;
  outcomeFilter: string;
  filteredCount: number;
}

/* ── Highlight helper ─────────────────────────────── */

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  const idx = text.indexOf(highlight);
  if (idx === -1) return <span>{text}</span>;

  return (
    <span>
      {text.slice(0, idx)}
      <span className="bg-amber-100 border-b-2 border-amber-400 px-0.5 rounded-sm">
        {highlight}
      </span>
      {text.slice(idx + highlight.length)}
    </span>
  );
}

/* ── Component ────────────────────────────────────── */

export default function InsightPanel({
  stageFilter,
  reasonFilter,
  outcomeFilter,
  filteredCount,
}: InsightPanelProps) {
  const navigate = useNavigate();
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ label: string; link: string } | null>(null);

  const pattern = findMatchingPattern(stageFilter, reasonFilter, outcomeFilter);
  if (!pattern) return null;

  const borderColor = pattern.severity === 'critical' ? 'border-red-400' : 'border-amber-400';
  const iconColor = pattern.severity === 'critical' ? 'text-red-500' : 'text-amber-500';
  const badgeBg = pattern.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';

  /* ── Apply fix handler ── */
  const applyFix = async (fix: FixAction) => {
    if (appliedFixes.has(fix.id) || applyingFixId) return;
    setApplyingFixId(fix.id);

    try {
      if (fix.type === 'slider' && fix.sliderKey && fix.sliderNewValue !== undefined) {
        const updatedProfile = { ...DEFAULT_BEHAVIOR_PROFILE, [fix.sliderKey]: fix.sliderNewValue };
        const derived = deriveBehaviorSettings(updatedProfile);
        const toneSettings = derivedToToneSettings(derived);
        await fetch('/api/sliders/behavior-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: updatedProfile, toneSettings, derived }),
        }).catch(() => {});
        setConfirmation({ label: fix.label, link: '/sliders' });
      } else {
        setConfirmation({ label: fix.label, link: fix.ruleTarget ?? '/playbooks' });
      }
      setAppliedFixes((prev) => new Set(prev).add(fix.id));
    } finally {
      setApplyingFixId(null);
    }
  };

  return (
    <div className={`card border-l-4 ${borderColor} overflow-hidden`}>
      {/* ── Part 1: Biggest Issue Banner ── */}
      <div className="px-4 py-3 flex items-center gap-3">
        <AlertTriangle className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold">Biggest Issue</h3>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeBg}`}>
              {pattern.severity}
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">{pattern.title}</p>
        </div>
        <span className="text-[10px] text-healthcare-muted shrink-0">
          {filteredCount} matching
        </span>
      </div>

      {/* ── Part 2 + 3: Example Conversations with Explanations ── */}
      <div className="border-t border-healthcare-line px-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[10px] font-bold text-healthcare-muted uppercase tracking-wider">
            Example Conversations ({pattern.examples.length})
          </p>
        </div>

        <div className="space-y-4">
          {pattern.examples.map((ex, i) => (
            <div key={i} className="space-y-2">
              {/* Patient message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm bg-brand-600 text-white text-xs leading-relaxed">
                  {ex.patientMessage}
                </div>
              </div>

              {/* Bot response with highlighted problem */}
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-gray-200 text-gray-800 text-xs leading-relaxed">
                  <HighlightedText text={ex.botResponse} highlight={ex.highlightedProblem} />
                </div>
              </div>

              {/* Explanation */}
              <p className="text-[10px] text-amber-700 italic pl-1">
                {ex.explanation}
              </p>

              {/* Conversation ID reference */}
              <p className="text-[9px] text-healthcare-muted pl-1">
                {ex.conversationId}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Part 4 + 5: Fix Actions ── */}
      <div className="border-t border-healthcare-line px-4 py-3">
        <p className="text-[10px] font-bold text-healthcare-muted uppercase tracking-wider mb-2">
          Fix This Pattern
        </p>

        <div className="flex flex-wrap gap-2">
          {pattern.fixes.map((fix) => {
            const isApplied = appliedFixes.has(fix.id);
            const isApplying = applyingFixId === fix.id;

            return (
              <button
                key={fix.id}
                onClick={() => applyFix(fix)}
                disabled={isApplied || isApplying}
                title={fix.description}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isApplied
                    ? 'bg-teal-100 text-teal-500 cursor-default'
                    : 'bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100'
                }`}
              >
                {isApplied ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Wrench className="w-3.5 h-3.5" />
                )}
                {isApplying ? 'Applying...' : fix.label}
              </button>
            );
          })}
        </div>

        {/* Confirmation banner */}
        {confirmation && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 border border-teal-200">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <p className="text-xs text-teal-700 flex-1">
              Applied: {confirmation.label}
            </p>
            <button
              onClick={() => navigate(confirmation.link)}
              className="text-[10px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-0.5 shrink-0"
            >
              View in {confirmation.link === '/sliders' ? 'Behavior Controls' : 'Playbooks'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
