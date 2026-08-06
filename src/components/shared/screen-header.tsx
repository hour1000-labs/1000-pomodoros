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
        'flex max-w-reading flex-col gap-2.5',
        align === 'center' && 'mx-auto items-center text-center',
        className
      )}
    >
      {eyebrow ? <p className="mb-0 text-ink/65 text-sm">{eyebrow}</p> : null}
      <h1 className="mb-0 font-bold text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mb-0 max-w-[65ch] text-base text-ink/65 leading-relaxed">{description}</p>
      ) : null}
      {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
