import { ShieldCheck } from 'lucide-react';

const SAFEGUARDS = [
  'Required intake enforced',
  'Insurance flow enforced',
  'Booking rules enforced',
  'Script order protected',
];

export default function SafeguardsBanner() {
  return (
    <div className="flex flex-wrap gap-2">
      {SAFEGUARDS.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                     bg-teal-50 text-teal-700 border border-teal-200"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {label}
        </span>
      ))}
    </div>
  );
}
