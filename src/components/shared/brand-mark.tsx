import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-11 items-center font-bold text-base tracking-[-0.02em]',
        className
      )}
    >
      1000 Pomodoros
    </span>
  );
}
