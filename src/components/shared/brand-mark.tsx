import { TimerReset } from 'lucide-react';

import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex min-h-11 items-center gap-2 font-bold text-sm', className)}>
      <span className="grid size-8 place-items-center rounded-md bg-ink text-paper">
        <TimerReset aria-hidden="true" className="size-4" strokeWidth={2.5} />
      </span>
      <span>1000 Pomodoros</span>
    </span>
  );
}
