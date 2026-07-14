import type { ReactNode } from 'react';

import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';

export function PublicLayout({
  children,
  className,
  headerAction,
}: Readonly<{
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-4 md:px-gutter-desktop">
        <BrandMark />
        {headerAction}
      </header>
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-12 md:px-gutter-desktop md:py-20',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
