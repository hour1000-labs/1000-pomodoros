import { cn } from '@/lib/utils';

export function StatItem({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="mb-2 font-bold text-ink/60 text-sm">{label}</dt>
      <dd className="mb-0 font-bold text-4xl text-ink tabular-nums tracking-[-0.04em]">{value}</dd>
    </div>
  );
}
