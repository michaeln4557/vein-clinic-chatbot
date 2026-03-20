import StatusBadge from './StatusBadge';

type ExtractionStatus = 'extracted' | 'missing' | 'partial' | 'confirmed' | 'conflicting';

interface FieldExtractionCardProps {
  fieldName: string;
  value: string | null;
  status: ExtractionStatus;
  confidence: number;
  sourceSnippet?: string;
}

const statusToVariant: Record<ExtractionStatus, 'success' | 'error' | 'warning' | 'info' | 'review'> = {
  extracted: 'success',
  missing: 'error',
  partial: 'warning',
  confirmed: 'info',
  conflicting: 'review',
};

export default function FieldExtractionCard({
  fieldName,
  value,
  status,
  confidence,
  sourceSnippet,
}: FieldExtractionCardProps) {
  const confidenceColor =
    confidence >= 0.8 ? 'bg-emerald-500' : confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="border border-healthcare-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-healthcare-text">{fieldName}</span>
        <StatusBadge
          variant={statusToVariant[status]}
          label={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      </div>

      <div className="text-sm">
        {value ? (
          <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
            {value}
          </span>
        ) : (
          <span className="text-healthcare-muted italic">Not yet captured</span>
        )}
      </div>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-healthcare-muted">
          <span>Confidence</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${confidenceColor}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {sourceSnippet && (
        <div className="text-xs text-healthcare-muted bg-gray-50 rounded p-2 border-l-2 border-brand-300">
          <span className="font-medium text-healthcare-text">Source: </span>
          &ldquo;{sourceSnippet}&rdquo;
        </div>
      )}
    </div>
  );
}
