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
      <p className="mb-1 font-bold text-2xl text-ink tracking-[-0.02em]">{value}</p>
      <p className="mb-0 text-ink/60 text-sm">{label}</p>
    </div>
  );
}
