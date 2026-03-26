import type { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="flex overflow-x-auto border-b border-healthcare-line -mb-px">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-healthcare-muted hover:text-healthcare-text hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
