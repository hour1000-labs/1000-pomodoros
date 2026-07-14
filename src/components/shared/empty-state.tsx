import { CircleDashed } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-h-52 flex-col items-start justify-center rounded-lg border border-dashed border-ink/20 bg-ink/[0.02] p-6',
        className
      )}
    >
      <div className="mb-4 grid size-11 place-items-center rounded-full bg-ink/5 text-ink/60">
        {icon ?? <CircleDashed aria-hidden="true" className="size-5" />}
      </div>
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      <p className="mb-0 max-w-[52ch] text-sm leading-relaxed text-ink/60">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
