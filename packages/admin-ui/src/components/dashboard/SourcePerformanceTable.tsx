import { useState } from 'react';
import { ChevronUp, ChevronDown, Trophy } from 'lucide-react';
import MiniSparkline from './MiniSparkline';
import { sourceComparisonData, type SourceRow } from '../../data/mockDashboardData';

type SortKey = 'source' | 'conversations' | 'bookings' | 'rate' | 'callbackRate' | 'ncs' | 'costPerBooking';

interface SourcePerformanceTableProps {
  onRowClick?: (row: SourceRow) => void;
  /** Compact mode: show top 3 sources, fewer columns */
  compact?: boolean;
}

/** Color-code conversion rate for visual comparison */
function conversionColor(rate: number, best: number, worst: number): string {
  if (rate === best && best > 0) return 'text-emerald-700 bg-emerald-50';
  if (rate === worst) return 'text-red-700 bg-red-50';
  if (rate >= 4) return 'text-emerald-600';
  if (rate >= 2) return 'text-teal-600';
  return 'text-red-600';
}

export default function SourcePerformanceTable({ onRowClick, compact = false }: SourcePerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rate');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...sourceComparisonData].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const displayRows = compact ? sorted.slice(0, 3) : sorted;

  // Find best/worst by conversion rate
  const rates = sourceComparisonData.map((r) => r.rate);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const th = (label: string, key: SortKey, align = 'text-right') => (
    <th
      className={`table-header ${align} cursor-pointer hover:text-healthcare-text select-none`}
      onClick={() => handleSort(key)}
    >
      {label}<SortIcon col={key} />
    </th>
  );

  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {compact ? 'Entry Source Performance' : 'Source Performance'}
        </h2>
        {compact && (
          <span className="text-[10px] text-healthcare-muted">by conversion</span>
        )}
      </div>
      <div className="card-body overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {th('Source', 'source', 'text-left')}
              {th('Convos', 'conversations')}
              {!compact && th('Bookings', 'bookings')}
              {th('Conv %', 'rate')}
              {!compact && th('Callback %', 'callbackRate')}
              {!compact && <th className="table-header text-right">Trend</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-healthcare-line">
            {displayRows.map((row) => {
              const isBest = row.rate === maxRate && maxRate > 0;
              const isWorst = row.rate === minRate && sorted.length > 1;
              const rowBg = isBest ? 'bg-emerald-50/50' : isWorst ? 'bg-red-50/30' : '';
              const convColor = conversionColor(row.rate, maxRate, minRate);
              return (
                <tr
                  key={row.source}
                  className={`${rowBg} ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  <td className="table-cell text-xs font-medium">
                    <span className="flex items-center gap-1">
                      {isBest && <Trophy className="w-3 h-3 text-emerald-500" />}
                      {row.source}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-right text-healthcare-muted">{row.conversations}</td>
                  {!compact && <td className="table-cell text-xs text-right font-medium">{row.bookings}</td>}
                  <td className="table-cell text-xs text-right">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${convColor}`}>
                      {row.rate}%
                    </span>
                  </td>
                  {!compact && <td className="table-cell text-xs text-right text-healthcare-muted">{row.callbackRate}%</td>}
                  {!compact && (
                    <td className="table-cell text-right">
                      <div className="flex justify-end">
                        <MiniSparkline data={row.sparkline} width={50} height={18} />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {compact && sorted.length > 3 && (
          <p className="text-center text-[10px] text-healthcare-muted mt-2 pt-2 border-t border-healthcare-line">
            {sorted.length - 3} more sources
          </p>
        )}
      </div>
    </div>
  );
}
