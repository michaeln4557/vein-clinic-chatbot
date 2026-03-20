type BadgeVariant =
  | 'draft'
  | 'review'
  | 'published'
  | 'archived'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-amber-50 text-amber-700',
  published: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

const dotStyles: Record<BadgeVariant, string> = {
  draft: 'bg-gray-400',
  review: 'bg-amber-500',
  published: 'bg-emerald-500',
  archived: 'bg-slate-400',
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  pending: 'bg-amber-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  showDot?: boolean;
}

export default function StatusBadge({ variant, label, showDot = true }: StatusBadgeProps) {
  return (
    <span className={`badge ${variantStyles[variant]}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles[variant]}`} />
      )}
      {label}
    </span>
  );
}
