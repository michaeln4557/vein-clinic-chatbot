import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, ChevronDown, ChevronUp, Info, Wrench } from 'lucide-react';

/* ══════════════════════════════════════════════
   CONVERSION FUNNEL ANALYTICS
   "Where are patients dropping off and why?"
   Pure diagnostic tool — no summaries or recommendations.
   ══════════════════════════════════════════════ */

/* ── Funnel Stage Data Model ─────────────────── */

interface DropOffReason {
  reason: string;
  count: number;
  percent: number;
  /** Example phrases users say that fall into this category */
  examplePhrases?: string[];
}

interface FunnelStage {
  name: string;
  shortName: string;
  description: string;
  reached: number;
  droppedOff: number;
  dropOffPercent: number;
  progressedPercent: number;
  isWorst: boolean;
  reasons: DropOffReason[];
}

/* ── Drop-off classification definitions ────────
   Stopped responding: no reply after bot message + follow-up
   Escalation: user asks for human OR system escalates
   Declined: explicit rejection language
   Friction: hesitation — "depends", "how much", "do you take my insurance", "not sure"
   ────────────────────────────────────────────── */

const dropOffDefinitions = [
  { label: 'Stopped responding', desc: 'No reply after bot message + follow-up triggered' },
  { label: 'Escalation', desc: 'User asks for human OR system escalates' },
  { label: 'Declined', desc: 'Explicit rejection language detected' },
  { label: 'Friction', desc: '"depends", "how much", "do you take my insurance", "not sure"' },
];

const funnelStages: FunnelStage[] = [
  {
    name: 'Early (First 2 Messages)',
    shortName: 'Early',
    description: 'Patient receives greeting and initial engagement',
    reached: 12,
    droppedOff: 3,
    dropOffPercent: 25,
    progressedPercent: 75,
    isWorst: false,
    reasons: [
      { reason: 'Stopped responding', count: 2, percent: 67 },
      { reason: 'Friction', count: 1, percent: 33, examplePhrases: ['who is this', 'wrong number', 'not interested'] },
    ],
  },
  {
    name: 'Symptom Collection',
    shortName: 'Symptoms',
    description: 'Patient describes chief complaint and symptoms',
    reached: 9,
    droppedOff: 1,
    dropOffPercent: 11,
    progressedPercent: 89,
    isWorst: false,
    reasons: [
      { reason: 'Stopped responding', count: 1, percent: 100 },
    ],
  },
  {
    name: 'Insurance Step',
    shortName: 'Insurance',
    description: 'Patient provides insurance information',
    reached: 8,
    droppedOff: 3,
    dropOffPercent: 38,
    progressedPercent: 62,
    isWorst: true,
    reasons: [
      { reason: 'Friction', count: 1, percent: 34, examplePhrases: ['how much', 'do you take my insurance', 'not sure'] },
      { reason: 'Escalation', count: 1, percent: 33 },
      { reason: 'Declined', count: 1, percent: 33 },
    ],
  },
  {
    name: 'Scheduling Step',
    shortName: 'Scheduling',
    description: 'Patient selects appointment date and time',
    reached: 5,
    droppedOff: 0,
    dropOffPercent: 0,
    progressedPercent: 100,
    isWorst: false,
    reasons: [],
  },
];

/** Maps funnel stage short names to Behavior Controls stage selector names */
const stageToSliderStage: Record<string, string> = {
  Early: 'Early',
  Symptoms: 'Symptoms',
  Insurance: 'Insurance',
  Scheduling: 'Scheduling',
};

/** Find best-performing stage (lowest non-zero drop-off) */
const bestStage = funnelStages
  .filter((s) => s.dropOffPercent === 0 || s.progressedPercent === 100)
  .length > 0
  ? funnelStages.find((s) => s.progressedPercent === 100)
  : funnelStages.filter((s) => s.dropOffPercent > 0).sort((a, b) => a.dropOffPercent - b.dropOffPercent)[0];

export default function FunnelAnalyticsPage() {
  const navigate = useNavigate();
  const [expandedStage, setExpandedStage] = useState<string | null>(
    funnelStages.find((s) => s.isWorst)?.name ?? null
  );
  const [showDefinitions, setShowDefinitions] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Conversion Funnel</h1>
        <p className="text-sm text-healthcare-muted mt-1">
          Where are patients dropping off and why?
        </p>
      </div>

      {/* ── Stage Flow with Conversion Rates ──────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Stage Flow</h2>
          <div className="flex-1 h-px bg-healthcare-line" />
        </div>

        {/* Stage-to-stage conversion summary */}
        <div className="flex items-center gap-1 mb-4 px-2 py-2 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
          {funnelStages.map((stage, i) => {
            const isWorst = stage.isWorst;
            return (
              <div key={stage.name} className="flex items-center gap-1 shrink-0">
                <div className={`text-center px-2 py-1 rounded ${isWorst ? 'bg-red-50' : ''}`}>
                  <p className={`text-[10px] ${isWorst ? 'text-red-600 font-bold' : 'text-healthcare-muted'}`}>
                    {stage.shortName} {isWorst && '↓'}
                  </p>
                  <p className={`text-sm font-bold ${isWorst ? 'text-red-700' : 'text-gray-800'}`}>{stage.reached}</p>
                </div>
                {i < funnelStages.length - 1 && (
                  <div className="flex flex-col items-center px-1">
                    <ArrowRight className={`w-3.5 h-3.5 ${isWorst ? 'text-red-400' : 'text-gray-300'}`} />
                    <span className={`text-[10px] font-bold ${
                      isWorst ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {stage.progressedPercent}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Horizontal funnel bars */}
        <div className="space-y-1">
          {funnelStages.map((stage, i) => {
            const maxReached = funnelStages[0].reached;
            const barWidth = Math.max((stage.reached / maxReached) * 100, 8);
            const isExpanded = expandedStage === stage.name;
            const topReason = stage.reasons.length > 0 ? stage.reasons.reduce((a, b) => a.percent >= b.percent ? a : b) : null;
            const isBest = bestStage && stage.name === bestStage.name;

            return (
              <div key={stage.name}>
                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage.name)}
                  className="w-full text-left"
                >
                  <div className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
                    stage.isWorst ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                  }`}>
                    <div className="w-40 shrink-0">
                      <p className={`text-xs font-medium ${stage.isWorst ? 'text-red-700 font-bold' : ''}`}>
                        {stage.name}
                      </p>
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-8 bg-gray-100 rounded-md overflow-hidden">
                        <div
                          className={`h-full rounded-md transition-all flex items-center px-2 ${
                            stage.isWorst ? 'bg-red-200' : isBest ? 'bg-emerald-100' : 'bg-gray-200'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-[11px] font-bold text-gray-800">{stage.reached}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-right shrink-0">
                      {stage.dropOffPercent > 0 ? (
                        <span className={`text-xs font-bold ${stage.isWorst ? 'text-red-600' : 'text-gray-400'}`}>
                          -{stage.dropOffPercent}%
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">✓ 100%</span>
                      )}
                    </div>
                    <div className="w-5 shrink-0">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-healthcare-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-healthcare-muted" />}
                    </div>
                  </div>
                </button>

                {/* Drop arrows between stages */}
                {i < funnelStages.length - 1 && !isExpanded && (
                  <div className="flex items-center gap-3 py-0.5 px-3">
                    <div className="w-40" />
                    <div className="flex items-center gap-1 text-[10px] text-gray-300">
                      <ArrowDown className="w-3 h-3" />
                      {stage.droppedOff > 0 && <span>{stage.droppedOff} dropped</span>}
                    </div>
                  </div>
                )}

                {/* Expanded: Drop-off reason breakdown */}
                {isExpanded && stage.reasons.length > 0 && (
                  <div className={`ml-[172px] mr-9 mb-3 p-3 rounded-lg border ${
                    stage.isWorst ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {/* Top reason highlight */}
                    {topReason && (
                      <p className={`text-xs font-bold mb-2 ${stage.isWorst ? 'text-red-800' : 'text-gray-800'}`}>
                        Top reason: {topReason.reason} ({topReason.percent}%)
                      </p>
                    )}

                    {/* Example phrases for top reason */}
                    {topReason?.examplePhrases && topReason.examplePhrases.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {topReason.examplePhrases.map((phrase) => (
                          <span key={phrase} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 italic">
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Other reasons — neutral, compact */}
                    {stage.reasons.filter((r) => r.reason !== topReason?.reason).length > 0 && (
                      <div className="space-y-1 mb-3">
                        {stage.reasons
                          .filter((r) => r.reason !== topReason?.reason)
                          .map((r) => (
                            <div key={r.reason} className="flex items-center gap-3 text-gray-400">
                              <div className="w-28 text-[11px]">{r.reason}</div>
                              <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                                <div className="h-full bg-gray-300 rounded" style={{ width: `${r.percent}%` }} />
                              </div>
                              <div className="w-10 text-right text-[11px]">{r.percent}%</div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Fix CTA — prominent */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/sliders?stage=${encodeURIComponent(stageToSliderStage[stage.shortName] || stage.shortName)}`);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                        stage.isWorst
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-700 text-white hover:bg-gray-800'
                      }`}
                    >
                      <Wrench className="w-3 h-3" />
                      Fix {stage.name} →
                    </button>
                  </div>
                )}
                {isExpanded && stage.reasons.length === 0 && (
                  <div className="ml-[172px] mr-9 mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700">No drop-off at this stage — all patients progressed.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Collapsible Drop-off Definitions ──────── */}
      <div>
        <button
          onClick={() => setShowDefinitions(!showDefinitions)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="font-medium">Drop-off definitions</span>
          {showDefinitions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showDefinitions && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {dropOffDefinitions.map((d) => (
              <div key={d.label} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs font-bold text-gray-700">{d.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
