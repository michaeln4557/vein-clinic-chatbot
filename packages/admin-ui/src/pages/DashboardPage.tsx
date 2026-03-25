import { useState } from 'react';
import { BarChart3, Headset, Lightbulb } from 'lucide-react';
import DecisionBar from '../components/dashboard/DecisionBar';
import MetricCard from '../components/dashboard/MetricCard';
import TopFilterBar, { type DashboardView } from '../components/dashboard/TopFilterBar';
import FunnelChart from '../components/dashboard/FunnelChart';
import SourcePerformanceTable from '../components/dashboard/SourcePerformanceTable';
import OperationsPanel from '../components/dashboard/OperationsPanel';
import CallbackPanel from '../components/dashboard/CallbackPanel';
import PlaybookHealthPanel from '../components/dashboard/PlaybookHealthPanel';
import QualityPanel from '../components/dashboard/QualityPanel';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import DrilldownDrawer from '../components/dashboard/DrilldownDrawer';
import {
  decisionBarData,
  kpiOverview,
  kpiConversionPath,
  kpiEscalationRecovery,
  computedMetrics,
  coreFunnelData,
  automationFunnelData,
  handoffFunnelData,
  mcrFunnelData,
  callbackPanelSummary,
  type DrawerContext,
  type FunnelStep,
} from '../data/mockDashboardData';

/* ══════════════════════════════════════════════
   DASHBOARD TABS
   ══════════════════════════════════════════════
   Performance  — "Is the chatbot generating business?"
   Operations   — "What needs action right now?"
   Optimization — "What should we improve?"
   ══════════════════════════════════════════════ */

type DashboardTab = 'performance' | 'operations' | 'optimization';

const tabs: { key: DashboardTab; label: string; icon: typeof BarChart3; description: string }[] = [
  { key: 'performance', label: 'Performance', icon: BarChart3, description: 'Business outcomes & conversions' },
  { key: 'operations', label: 'Operations', icon: Headset, description: 'Live queues & callbacks' },
  { key: 'optimization', label: 'Optimization', icon: Lightbulb, description: 'AI & playbook improvements' },
];

const defaultFilters = {
  dateRange: '14d',
  location: 'all',
  channel: 'all',
  source: 'all',
  playbook: 'all',
};

type FunnelView = 'core' | 'automation' | 'handoff' | 'mcr';

const funnelViews: { key: FunnelView; label: string; data: FunnelStep[] }[] = [
  { key: 'core', label: 'Core Funnel', data: coreFunnelData },
  { key: 'automation', label: 'Bot vs Human', data: automationFunnelData },
  { key: 'handoff', label: 'Handoff', data: handoffFunnelData },
  { key: 'mcr', label: 'Missed Call Recovery', data: mcrFunnelData },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('performance');
  const [dashboardView, setDashboardView] = useState<DashboardView>('overall');

  // Filter state
  const [dateRange, setDateRange] = useState(defaultFilters.dateRange);
  const [location, setLocation] = useState(defaultFilters.location);
  const [channel, setChannel] = useState(defaultFilters.channel);
  const [source, setSource] = useState(defaultFilters.source);
  const [playbook, setPlaybook] = useState(defaultFilters.playbook);
  const [activeFunnel, setActiveFunnel] = useState<FunnelView>('core');

  // Drawer state
  const [drawerContext, setDrawerContext] = useState<DrawerContext | null>(null);

  const resetFilters = () => {
    setDateRange(defaultFilters.dateRange);
    setLocation(defaultFilters.location);
    setChannel(defaultFilters.channel);
    setSource(defaultFilters.source);
    setPlaybook(defaultFilters.playbook);
  };

  // Auto-suggest funnel view based on dashboard perspective
  const suggestedFunnel: FunnelView =
    dashboardView === 'bot' ? 'automation'
    : dashboardView === 'human' ? 'handoff'
    : dashboardView === 'recovery' ? 'mcr'
    : activeFunnel;
  const effectiveFunnel = dashboardView === 'overall' ? activeFunnel : suggestedFunnel;
  const currentFunnel = funnelViews.find((f) => f.key === effectiveFunnel) || funnelViews[0];

  // Operations risk metric: at-risk conversions = pending callbacks * historical callback conversion rate
  const atRiskConversions = Math.round(
    callbackPanelSummary.pendingCount * (callbackPanelSummary.callbackConversionRate / 100) * 10
  ) / 10;

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1>Command Center</h1>
            <p className="text-sm text-healthcare-muted mt-1">
              Real-time overview of chatbot performance, conversions, and operations
            </p>
          </div>
        </div>
        <TopFilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          locationValue={location}
          onLocationChange={setLocation}
          channelValue={channel}
          onChannelChange={setChannel}
          sourceValue={source}
          onSourceChange={setSource}
          playbookValue={playbook}
          onPlaybookChange={setPlaybook}
          onReset={resetFilters}
          dashboardView={dashboardView}
          onDashboardViewChange={setDashboardView}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-healthcare-text shadow-sm'
                  : 'text-healthcare-muted hover:text-healthcare-text hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`hidden sm:inline text-[10px] ${isActive ? 'text-healthcare-muted' : 'text-gray-400'}`}>
                — {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════
         PERFORMANCE TAB (Default Home)
         "Is the chatbot generating business?"
         ════════════════════════════════════════ */}
      {activeTab === 'performance' && (
        <>
          {/* ── View-aware perspective label ───────── */}
          {dashboardView !== 'overall' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
              <span className="text-xs font-medium text-teal-700">
                Viewing: {dashboardView === 'bot' ? 'Bot-Only Performance' : dashboardView === 'human' ? 'Human Handoff Performance' : 'Missed Call Recovery Performance'}
              </span>
              <span className="text-[10px] text-teal-600">
                {dashboardView === 'bot' && '— Automated conversion metrics emphasized'}
                {dashboardView === 'human' && '— Escalation and handoff metrics emphasized'}
                {dashboardView === 'recovery' && '— Recovered demand metrics emphasized'}
              </span>
            </div>
          )}

          {/* ── SECTION 1: Overview ──────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Overview</h2>
              <div className="flex-1 h-px bg-healthcare-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kpiOverview.map((m) => (
                <MetricCard
                  key={m.id}
                  {...m}
                  prominent
                  emphasis={m.id === 'total-conversions'}
                />
              ))}
            </div>
          </div>

          {/* ── SECTION 2: Conversion Path ────────────
               Show in Overall, Bot, Human views.
               Emphasis shifts based on view.
               ────────────────────────────────────────── */}
          {(dashboardView === 'overall' || dashboardView === 'bot' || dashboardView === 'human') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Conversion Path</h2>
                <span className="text-[10px] text-healthcare-muted">(bot-only + human-handoff = total conversions)</span>
                <div className="flex-1 h-px bg-healthcare-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpiConversionPath.map((m) => (
                  <MetricCard
                    key={m.id}
                    {...m}
                    emphasis={
                      (dashboardView === 'bot' && m.id === 'bot-only-conversions') ||
                      (dashboardView === 'human' && m.id === 'human-handoff-conversions')
                    }
                  />
                ))}
              </div>

              {/* Automation vs Human conversion split bar */}
              {(() => {
                const { botOnlyConversions, humanHandoffConversions, automationRate, humanRate, totalConversions } = computedMetrics;
                if (totalConversions === 0) return null;
                return (
                  <div className="flex items-center gap-4 px-4 py-2 mt-3 bg-white/80 rounded-lg border border-healthcare-border/50">
                    <span className="text-[11px] font-medium text-healthcare-muted">Automation vs Human</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${automationRate}%` }} />
                      <div className="h-full bg-teal-400 rounded-r-full transition-all" style={{ width: `${humanRate}%` }} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] shrink-0">
                      <span className={`flex items-center gap-1 ${dashboardView === 'bot' ? 'font-bold' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Bot {automationRate}% ({botOnlyConversions})
                      </span>
                      <span className={`flex items-center gap-1 ${dashboardView === 'human' ? 'font-bold' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        Human {humanRate}% ({humanHandoffConversions})
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── SECTION 3: Escalation & Recovery ──────
               Show in Overall, Human, Recovery views.
               Emphasis shifts based on view.
               ────────────────────────────────────────── */}
          {(dashboardView === 'overall' || dashboardView === 'human' || dashboardView === 'recovery') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-bold text-healthcare-muted uppercase tracking-wider">Escalation & Recovery</h2>
                <div className="flex-1 h-px bg-healthcare-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpiEscalationRecovery.map((m) => (
                  <MetricCard
                    key={m.id}
                    {...m}
                    emphasis={
                      (dashboardView === 'human' && m.id === 'human-handoff-requests') ||
                      (dashboardView === 'recovery' && m.id === 'missed-call-recovery')
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Funnel + Entry Source Performance */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-8">
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-sm font-semibold">Conversion Funnels</h2>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                      {funnelViews.map((fv) => (
                        <button
                          key={fv.key}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                            activeFunnel === fv.key
                              ? 'bg-white text-healthcare-text shadow-sm'
                              : 'text-healthcare-muted hover:text-healthcare-text'
                          }`}
                          onClick={() => setActiveFunnel(fv.key)}
                        >
                          {fv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFunnel === 'core' && (() => {
                    const drops = currentFunnel.data
                      .filter((s) => s.dropOffFromPrev !== null && s.dropOffFromPrev > 0)
                      .sort((a, b) => (b.dropOffFromPrev ?? 0) - (a.dropOffFromPrev ?? 0));
                    const worst = drops[0];
                    if (!worst) return null;
                    return (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md mt-2 w-fit">
                        <span className="font-bold">Biggest drop:</span> {worst.name} (-{worst.dropOffFromPrev}%)
                      </span>
                    );
                  })()}
                </div>
                <div className="card-body">
                  <FunnelChart
                    data={currentFunnel.data}
                    compact
                    onStageClick={(stage) =>
                      setDrawerContext({ type: 'funnel_stage', id: stage.name, label: stage.name })
                    }
                  />
                  {activeFunnel === 'core' && (
                    <div className="mt-3 pt-3 border-t border-healthcare-border flex items-center justify-between text-xs">
                      <span className="text-healthcare-muted">Overall conversion rate</span>
                      <span className="font-semibold text-teal-600">
                        {computedMetrics.totalConversionRate}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-12 xl:col-span-4">
              <SourcePerformanceTable
                onRowClick={(row) =>
                  setDrawerContext({ type: 'source', id: row.source, label: row.source })
                }
                compact
              />
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
         OPERATIONS TAB
         "What needs action right now?"
         ════════════════════════════════════════ */}
      {activeTab === 'operations' && (
        <>
          {/* Decision Bar — urgent operational alert */}
          <DecisionBar data={decisionBarData} />

          {/* At-Risk Banner */}
          {callbackPanelSummary.pendingCount > 0 && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Headset className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800">
                    {callbackPanelSummary.pendingCount} callbacks pending · ~{atRiskConversions} at-risk conversions
                  </p>
                  <p className="text-[10px] text-amber-600">
                    Based on {callbackPanelSummary.callbackConversionRate}% historical callback conversion rate
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-amber-700 hover:text-amber-900 cursor-pointer whitespace-nowrap">
                Assign all →
              </span>
            </div>
          )}

          {/* Operations + Callback panels side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OperationsPanel />
            <CallbackPanel
              onItemClick={(item) =>
                setDrawerContext({ type: 'callback', id: item.id, label: item.source })
              }
            />
          </div>

          {/* Operational Alerts */}
          <AlertsPanel
            onAlertClick={(alert) =>
              setDrawerContext({ type: 'alert', id: alert.id, label: alert.title })
            }
          />
        </>
      )}

      {/* ════════════════════════════════════════
         OPTIMIZATION TAB
         "What should we improve?"
         ════════════════════════════════════════ */}
      {activeTab === 'optimization' && (
        <>
          {/* Playbook Insights + Quality side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <PlaybookHealthPanel
                onPlaybookClick={(pb) =>
                  setDrawerContext({ type: 'playbook', id: pb.playbookId, label: pb.name })
                }
              />
            </div>
            <div className="space-y-6">
              <QualityPanel />
            </div>
          </div>

          {/* Optimization-related alerts */}
          <AlertsPanel
            onAlertClick={(alert) =>
              setDrawerContext({ type: 'alert', id: alert.id, label: alert.title })
            }
          />
        </>
      )}

      {/* Drilldown Drawer (shared across all tabs) */}
      <DrilldownDrawer
        open={!!drawerContext}
        onClose={() => setDrawerContext(null)}
        context={drawerContext}
      />
    </div>
  );
}
