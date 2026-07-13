import { cn } from '@/lib/utils'

export function StatItem({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="mb-1 text-2xl font-bold tracking-[-0.02em] text-ink">{value}</p>
      <p className="mb-0 text-sm text-ink/60">{label}</p>
    </div>
  )
}
