import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MiniSparkline from './MiniSparkline';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  helpText?: string;
  helperText?: string;
  status?: 'default' | 'success' | 'warning' | 'critical';
  icon: LucideIcon;
  color: string;
  sparkline?: number[];
  /** Row 1 cards get a slightly larger, more prominent treatment */
  prominent?: boolean;
  /** Extra visual emphasis for the primary business metric */
  emphasis?: boolean;
  /** Click handler for drill-down navigation */
  onClick?: () => void;
}

const statusBorder: Record<string, string> = {
  default: 'border-l-transparent',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  critical: 'border-l-red-500',
};

export default function MetricCard({
  label, value, delta, deltaDirection, helpText, helperText, status = 'default',
  icon: Icon, color, sparkline, prominent = false, emphasis = false, onClick,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`card card-body border-l-2 ${statusBorder[status]} ${prominent ? 'py-5' : ''} ${emphasis ? 'ring-1 ring-teal-200 shadow-sm' : ''} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className={`text-healthcare-muted leading-tight ${prominent ? 'text-sm font-medium' : 'text-xs'}`}>
              {label}
            </p>
            {helpText && (
              <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Info className="w-3 h-3 text-gray-400 cursor-help shrink-0" />
                {showTooltip && (
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg pointer-events-none">
                    {helpText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </div>
                )}
              </div>
            )}
          </div>
          <p className={`font-bold mt-1 ${prominent ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
          {helperText && (() => {
            // Split helperText by " · " separator for multi-part context
            const parts = helperText.split(' · ');
            return (
              <div className="mt-1 space-y-0.5">
                {parts.map((part, i) => (
                  <p key={i} className={`text-[10px] ${i === 0 ? 'text-healthcare-text font-medium' : 'text-healthcare-muted'}`}>
                    {part}
                  </p>
                ))}
              </div>
            );
          })()}
        </div>
        <div className={`rounded-lg shrink-0 ${color} ${prominent ? 'p-2.5' : 'p-2'}`}>
          <Icon className={prominent ? 'w-5 h-5' : 'w-4 h-4'} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {delta ? (
          <div className="flex items-center gap-1 text-xs">
            {deltaDirection === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
            {deltaDirection === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
            {deltaDirection === 'flat' && <Minus className="w-3.5 h-3.5 text-gray-400" />}
            <span className={deltaDirection === 'up' ? 'text-emerald-600' : deltaDirection === 'down' ? 'text-red-600' : 'text-gray-500'}>
              {delta}
            </span>
            <span className="text-healthcare-muted">vs last period</span>
          </div>
        ) : <div />}
        {sparkline && <MiniSparkline data={sparkline} />}
      </div>
    </div>
  );
}
