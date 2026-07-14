import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ScreenHeader({
  eyebrow,
  title,
  description,
  actions,
  align = 'start',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex max-w-reading flex-col gap-3',
        align === 'center' && 'mx-auto items-center text-center',
        className
      )}
    >
      {eyebrow ? <p className="mb-0 text-[0.8125rem] font-bold text-ink/60">{eyebrow}</p> : null}
      <h1 className="mb-0 text-4xl leading-[1.08] font-bold tracking-[-0.035em] sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mb-0 max-w-[65ch] text-base leading-relaxed text-ink/60 sm:text-lg">
          {description}
        </p>
      ) : null}
      {actions ? <div className="mt-3 flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
