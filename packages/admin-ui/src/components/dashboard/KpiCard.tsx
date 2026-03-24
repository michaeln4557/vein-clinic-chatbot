import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MiniSparkline from './MiniSparkline';

interface KpiCardProps {
  label: string;
  description?: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: LucideIcon;
  color: string;
  sparkline?: number[];
}

export default function KpiCard({ label, description, value, change, trend, icon: Icon, color, sparkline }: KpiCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="card card-body relative">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs text-healthcare-muted truncate">{label}</p>
            {description && (
              <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Info className="w-3 h-3 text-gray-400 cursor-help shrink-0" />
                {showTooltip && (
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg">
                    {description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {change ? (
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
            {trend === 'flat' && <Minus className="w-3.5 h-3.5 text-gray-400" />}
            <span className={trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
              {change}
            </span>
            <span className="text-healthcare-muted">vs last period</span>
          </div>
        ) : <div />}
        {sparkline && <MiniSparkline data={sparkline} />}
      </div>
    </div>
  );
}
