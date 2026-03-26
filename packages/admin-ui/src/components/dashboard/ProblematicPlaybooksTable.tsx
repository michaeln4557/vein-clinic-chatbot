import { problematicPlaybooks } from '../../data/mockDashboardData';

function ncsColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 65) return 'text-amber-600';
  return 'text-red-600';
}

function dropOffColor(rate: number): string {
  if (rate <= 10) return 'text-emerald-600';
  if (rate <= 20) return 'text-amber-600';
  return 'text-red-600';
}

export default function ProblematicPlaybooksTable() {
  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold">Playbooks Needing Attention</h3>
        <span className="badge bg-amber-100 text-amber-700">{problematicPlaybooks.length}</span>
      </div>
      <div className="divide-y divide-healthcare-line">
        {problematicPlaybooks.map((pb) => (
          <div key={pb.name} className="px-4 py-3">
            <p className="text-xs font-medium mb-1">{pb.name}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-healthcare-muted">
                NCS: <span className={`font-semibold ${ncsColor(pb.ncsScore)}`}>{pb.ncsScore}</span>
              </span>
              <span className="text-healthcare-muted">
                Drop-off: <span className={`font-semibold ${dropOffColor(pb.dropOffRate)}`}>{pb.dropOffRate}%</span>
              </span>
              <span className="text-healthcare-muted">
                {pb.conversations} convos
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
