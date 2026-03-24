import { Heart } from 'lucide-react';
import MiniSparkline from './MiniSparkline';
import { qualityPanelData } from '../../data/mockDashboardData';

const feelsHumanColor = (ncs: number): string => {
  if (ncs >= 8) return 'text-emerald-600';
  if (ncs >= 6) return 'text-amber-600';
  return 'text-red-600';
};

const feelsHumanLabel = (ncs: number): { text: string; color: string } => {
  if (ncs >= 8) return { text: 'Good', color: 'bg-emerald-100 text-emerald-700' };
  if (ncs >= 6) return { text: 'Watch', color: 'bg-amber-100 text-amber-700' };
  return { text: 'Poor', color: 'bg-red-100 text-red-700' };
};

export default function QualityPanel() {
  const { ncs, earlyDropOffRate, askedForHumanEarly, operatorEditRate, ncsTrend } = qualityPanelData;
  const rating = feelsHumanLabel(ncs);

  // Calculate "Asked for Human Early" as a percentage (out of today's conversations)
  const totalConvos = 7; // matches dashboard conversations metric
  const askedHumanPct = totalConvos > 0 ? ((askedForHumanEarly / totalConvos) * 100).toFixed(1) : '0';

  return (
    <div className="card h-full">
      <div className="card-header flex items-center gap-2">
        <Heart className="w-4 h-4 text-pink-500" />
        <h3 className="text-sm font-semibold">Conversation Quality</h3>
      </div>

      <div className="card-body space-y-4">
        {/* Feels Human Score Hero */}
        <div className="text-center py-2">
          <p className="text-[10px] text-healthcare-muted mb-1">Feels Human Score</p>
          <div className="flex items-center justify-center gap-2">
            <p className={`text-3xl font-bold ${feelsHumanColor(ncs)}`}>{ncs}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${rating.color}`}>
              {rating.text}
            </span>
          </div>
          {/* Threshold guide */}
          <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-healthcare-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              8+ Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              6–8 Watch
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              &lt;6 Poor
            </span>
          </div>
          {ncsTrend && (
            <div className="flex justify-center mt-2">
              <MiniSparkline data={ncsTrend} width={100} height={24} />
            </div>
          )}
        </div>

        {/* Impact context */}
        {ncs < 8 && (
          <p className="text-center text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5 font-medium">
            Lower quality scores correlate with reduced booking conversion
          </p>
        )}

        {/* Metrics Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-healthcare-muted">Early Drop-off Rate</span>
            <span className={`text-xs font-semibold ${earlyDropOffRate > 3 ? 'text-red-600' : earlyDropOffRate > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {earlyDropOffRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-healthcare-muted">Asked for Human Early</span>
            <span className={`text-xs font-semibold ${askedForHumanEarly > 3 ? 'text-red-600' : 'text-healthcare-text'}`}>
              {askedForHumanEarly} ({askedHumanPct}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-healthcare-muted">Operator Edit Rate</span>
            <span className={`text-xs font-semibold ${operatorEditRate > 5 ? 'text-red-600' : operatorEditRate > 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {operatorEditRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
