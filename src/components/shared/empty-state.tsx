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
        'flex min-h-48 flex-col items-start justify-center rounded-lg border border-ink/12 bg-paper p-5 sm:p-6',
        className
      )}
    >
      {icon ? <div className="mb-4 text-ink/60">{icon}</div> : null}
      <h2 className="mb-2 font-bold text-xl leading-tight">{title}</h2>
      <p className="mb-0 max-w-[52ch] text-ink/65 text-sm leading-relaxed">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
