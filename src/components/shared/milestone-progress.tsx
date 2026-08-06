import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function MilestoneProgress({
  value,
  label,
  detail,
  className,
}: {
  value: number;
  label: string;
  detail?: string;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-bold">{label}</span>
        <span className="text-ink/65 tabular-nums">{detail ?? `${Math.round(safeValue)}%`}</span>
      </div>
      <Progress value={safeValue} aria-label={`${label}: ${Math.round(safeValue)}%`} />
    </div>
  );
}
