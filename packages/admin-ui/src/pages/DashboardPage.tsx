import { useState } from 'react';
import DecisionBar from '../components/dashboard/DecisionBar';
import MetricCard from '../components/dashboard/MetricCard';
import TopFilterBar from '../components/dashboard/TopFilterBar';
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
  kpiRow1,
  kpiRow2,
  dashboardFunnelData,
  type DrawerContext,
} from '../data/mockDashboardData';

const defaultFilters = {
  dateRange: '14d',
  location: 'all',
  channel: 'all',
  source: 'all',
  playbook: 'all',
};

export default function DashboardPage() {
  // Filter state
  const [dateRange, setDateRange] = useState(defaultFilters.dateRange);
  const [location, setLocation] = useState(defaultFilters.location);
  const [channel, setChannel] = useState(defaultFilters.channel);
  const [source, setSource] = useState(defaultFilters.source);
  const [playbook, setPlaybook] = useState(defaultFilters.playbook);
  const [funnelMode, setFunnelMode] = useState<'sms' | 'web' | 'combined'>('combined');

  // Drawer state
  const [drawerContext, setDrawerContext] = useState<DrawerContext | null>(null);

  const resetFilters = () => {
    setDateRange(defaultFilters.dateRange);
    setLocation(defaultFilters.location);
    setChannel(defaultFilters.channel);
    setSource(defaultFilters.source);
    setPlaybook(defaultFilters.playbook);
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Header + Filters */}
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
        />
      </div>

      {/* Row 2: Decision Bar */}
      <DecisionBar data={decisionBarData} />

      {/* Row 3a: PRIMARY PERFORMANCE LINE — Conversations, First Response, Total Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiRow1.map((m) => (
          <MetricCard
            key={m.id}
            {...m}
            prominent
            emphasis={m.id === 'total-conversion-rate'}
          />
        ))}
      </div>

      {/* Row 3b: CONVERSION PATH + OPERATIONS — Bot Bookings, Missed Call Recovery, Callback Requests, Callback Booked */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiRow2.map((m) => (
          <MetricCard key={m.id} {...m} />
        ))}
      </div>

      {/* Row 3c: Automation vs Human booking split */}
      {(() => {
        const botBookings = Number(kpiRow2.find((m) => m.id === 'bot-bookings')?.value) || 0;
        const callbackBooked = Number(kpiRow2.find((m) => m.id === 'callback-booked')?.value) || 0;
        const total = botBookings + callbackBooked;
        if (total === 0) return null;
        const botPct = Math.round((botBookings / total) * 100);
        const humanPct = 100 - botPct;
        return (
          <div className="flex items-center gap-4 px-4 py-2 bg-white/80 rounded-lg border border-healthcare-border/50">
            <span className="text-[11px] font-medium text-healthcare-muted">Automation vs Human</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${botPct}%` }} />
              <div className="h-full bg-teal-400 rounded-r-full transition-all" style={{ width: `${humanPct}%` }} />
            </div>
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Bot {botPct}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Human {humanPct}%
              </span>
            </div>
          </div>
        );
      })()}

      {/* Row 4: Conversion Funnel (8 cols) + Source Performance compact (4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold">Conversion Funnel</h2>
              {/* Biggest drop indicator */}
              {(() => {
                const drops = dashboardFunnelData
                  .filter((s) => s.dropOffFromPrev !== null && s.dropOffFromPrev > 0)
                  .sort((a, b) => (b.dropOffFromPrev ?? 0) - (a.dropOffFromPrev ?? 0));
                const worst = drops[0];
                if (!worst) return null;
                return (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    <span className="font-bold">Biggest drop:</span> {worst.name} (-{worst.dropOffFromPrev}%)
                  </span>
                );
              })()}
            </div>
            <div className="card-body">
              <FunnelChart
                data={dashboardFunnelData}
                compact
                mode={funnelMode}
                onModeChange={setFunnelMode}
                onStageClick={(stage) =>
                  setDrawerContext({ type: 'funnel_stage', id: stage.name, label: stage.name })
                }
              />
              <div className="mt-3 pt-3 border-t border-healthcare-border flex items-center justify-between text-xs">
                <span className="text-healthcare-muted">Overall recovery rate</span>
                <span className="font-semibold text-teal-600">
                  {((dashboardFunnelData[dashboardFunnelData.length - 1].value / dashboardFunnelData[0].value) * 100).toFixed(1)}%
                </span>
              </div>
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

      {/* Row 5: Operations (4 cols) + Callbacks (4 cols) + Playbook Health (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <OperationsPanel />
        <CallbackPanel
          onItemClick={(item) =>
            setDrawerContext({ type: 'callback', id: item.id, label: item.source })
          }
        />
        <PlaybookHealthPanel
          onPlaybookClick={(pb) =>
            setDrawerContext({ type: 'playbook', id: pb.playbookId, label: pb.name })
          }
        />
      </div>

      {/* Row 6: Quality (4 cols) + Alerts (8 cols) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4">
          <QualityPanel />
        </div>
        <div className="col-span-12 xl:col-span-8">
          <AlertsPanel
            onAlertClick={(alert) =>
              setDrawerContext({ type: 'alert', id: alert.id, label: alert.title })
            }
          />
        </div>
      </div>

      {/* Drilldown Drawer */}
      <DrilldownDrawer
        open={!!drawerContext}
        onClose={() => setDrawerContext(null)}
        context={drawerContext}
      />
    </div>
  );
}
