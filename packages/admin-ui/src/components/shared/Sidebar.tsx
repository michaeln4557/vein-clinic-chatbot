import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  SlidersHorizontal,
  MapPin,
  MessageCircle,
  FlaskConical,
  ScrollText,
  Database,
  Shield,
  Activity,
  TrendingDown,
  MessagesSquare,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Wrench,
  ClipboardCheck,
  MessageSquareText,
} from 'lucide-react';

/* ══════════════════════════════════════════════
   SIDEBAR — Dual Mode Navigation
   ══════════════════════════════════════════════
   OPERATOR MODE (clean):
     Performance → Dashboard, Conversion Funnel, Conversations, Source Performance
     Controls    → Behavior Controls
     Human Recovery → Follow-Ups (Live Queue)

   ADMIN / BUILDER MODE (separate):
     Settings / Advanced → CRM Mapping, Voice & Language, Playbook Builder
     Operations          → Test / QA, Audit Log
     Admin               → Permissions
   ══════════════════════════════════════════════ */

/* ── Operator sections ─────────────────────── */
const operatorSections = [
  {
    label: 'Performance',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/funnel', icon: TrendingDown, label: 'Conversion Funnel' },
      { to: '/conversations', icon: MessagesSquare, label: 'Conversations' },
      { to: '/sources', icon: BarChart3, label: 'Source Performance' },
    ],
  },
  {
    label: 'Controls',
    items: [
      { to: '/sliders', icon: SlidersHorizontal, label: 'Behavior Controls' },
    ],
  },
  {
    label: 'Human Recovery',
    items: [
      { to: '/review-queue', icon: ClipboardCheck, label: 'Follow-Ups' },
    ],
  },
];

/* ── Admin / Builder sections ─────────────── */
const adminSections = [
  {
    label: 'Settings / Advanced',
    items: [
      { to: '/crm-mapping', icon: Database, label: 'CRM Mapping' },
      { to: '/phrases', icon: MessageSquareText, label: 'Voice & Language' },
      { to: '/playbooks', icon: BookOpen, label: 'Playbook Builder' },
      { to: '/sms-templates', icon: MessageCircle, label: 'SMS Templates' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/test-qa', icon: FlaskConical, label: 'Test / QA' },
      { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/permissions', icon: Shield, label: 'Permissions' },
      { to: '/locations', icon: MapPin, label: 'Locations' },
    ],
  },
];

type SidebarMode = 'operator' | 'admin';

export default function Sidebar() {
  const [mode, setMode] = useState<SidebarMode>('operator');

  const sections = mode === 'operator' ? operatorSections : adminSections;

  return (
    <aside className="w-64 h-screen bg-white border-r border-healthcare-line flex flex-col shrink-0">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-healthcare-line">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-healthcare-text leading-tight">
              Vein Clinic
            </h1>
            <p className="text-xs text-healthcare-muted">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex rounded-lg border border-healthcare-line overflow-hidden">
          <button
            onClick={() => setMode('operator')}
            className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
              mode === 'operator'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-healthcare-muted hover:bg-gray-50'
            }`}
          >
            Operator
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
              mode === 'admin'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-healthcare-muted hover:bg-gray-50'
            }`}
          >
            Admin / Builder
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-xs font-semibold text-healthcare-muted uppercase tracking-wider">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-link-active' : 'sidebar-link'
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-healthcare-line">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-sm font-medium text-brand-700">JG</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Dr. J. Garcia</p>
            <p className="text-xs text-healthcare-muted">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
