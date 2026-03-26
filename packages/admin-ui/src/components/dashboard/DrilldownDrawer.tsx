import { useState } from 'react';
import { X, FileText, MessageSquare, TrendingUp, Lightbulb } from 'lucide-react';
import TabNav from './TabNav';
import type { DrawerContext } from '../../data/mockDashboardData';

const drawerTabs = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'trend', label: 'Trend', icon: TrendingUp },
  { id: 'actions', label: 'Recommended Actions', icon: Lightbulb },
];

interface DrilldownDrawerProps {
  open: boolean;
  onClose: () => void;
  context: DrawerContext | null;
}

export default function DrilldownDrawer({ open, onClose, context }: DrilldownDrawerProps) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!context) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-healthcare-line">
          <div>
            <p className="text-[10px] text-healthcare-muted uppercase tracking-wider">{context.type.replace('_', ' ')}</p>
            <h2 className="text-base font-semibold mt-0.5">{context.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <TabNav tabs={drawerTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="card card-body">
                <h3 className="text-xs font-semibold mb-2">Overview</h3>
                <p className="text-xs text-healthcare-muted">
                  Detailed metrics and breakdown for <strong>{context.label}</strong>.
                  This panel will show key performance indicators specific to this {context.type.replace('_', ' ')}.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="card card-body text-center">
                  <p className="text-[10px] text-healthcare-muted">Volume</p>
                  <p className="text-lg font-bold">5</p>
                </div>
                <div className="card card-body text-center">
                  <p className="text-[10px] text-healthcare-muted">Conversion</p>
                  <p className="text-lg font-bold text-teal-600">3.2%</p>
                </div>
                <div className="card card-body text-center">
                  <p className="text-[10px] text-healthcare-muted">NCS</p>
                  <p className="text-lg font-bold text-amber-600">7</p>
                </div>
                <div className="card card-body text-center">
                  <p className="text-[10px] text-healthcare-muted">Drop-off</p>
                  <p className="text-lg font-bold text-red-600">1.8%</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="space-y-2">
              <p className="text-xs text-healthcare-muted mb-3">Recent conversations related to this {context.type.replace('_', ' ')}</p>
              {['CONV-2901', 'CONV-2899', 'CONV-2897'].map((id) => (
                <div key={id} className="card card-body flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-healthcare-muted">{id}</span>
                    <p className="text-xs font-medium mt-0.5">New Patient Intake</p>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-700">completed</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="space-y-4">
              <p className="text-xs text-healthcare-muted">7-day trend for this {context.type.replace('_', ' ')}</p>
              <div className="card card-body">
                <div className="h-32 flex items-end justify-around gap-1">
                  {[3, 5, 4, 6, 5, 8, 7].map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-6 bg-teal-400 rounded-t"
                        style={{ height: `${(v / 8) * 100}%` }}
                      />
                      <span className="text-[9px] text-healthcare-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3">
              <p className="text-xs text-healthcare-muted mb-3">Suggested next steps</p>
              {[
                { action: 'Review playbook responses for clarity', priority: 'high' },
                { action: 'Check tone guidelines for SMS channel', priority: 'medium' },
                { action: 'Compare A/B test variants', priority: 'low' },
              ].map((item) => (
                <div key={item.action} className="card card-body flex items-center justify-between">
                  <span className="text-xs">{item.action}</span>
                  <span className={`badge text-[10px] ${
                    item.priority === 'high' ? 'bg-red-100 text-red-700' :
                    item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{item.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
