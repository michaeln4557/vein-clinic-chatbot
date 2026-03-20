import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquareText,
  SlidersHorizontal,
  MapPin,
  MessageCircle,
  ClipboardCheck,
  FlaskConical,
  ScrollText,
  Database,
  BarChart3,
  Shield,
  Activity,
} from 'lucide-react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/playbooks', icon: BookOpen, label: 'Playbooks' },
      { to: '/phrases', icon: MessageSquareText, label: 'Approved Language' },
      { to: '/sms-templates', icon: MessageCircle, label: 'SMS Templates' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/sliders', icon: SlidersHorizontal, label: 'Behavior Controls' },
      { to: '/locations', icon: MapPin, label: 'Locations' },
      { to: '/crm-mapping', icon: Database, label: 'CRM Mapping' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/review-queue', icon: ClipboardCheck, label: 'Review Queue' },
      { to: '/test-qa', icon: FlaskConical, label: 'Test / QA' },
      { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/permissions', icon: Shield, label: 'Permissions' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r border-healthcare-border flex flex-col shrink-0">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-healthcare-border">
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
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
      <div className="px-4 py-3 border-t border-healthcare-border">
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
