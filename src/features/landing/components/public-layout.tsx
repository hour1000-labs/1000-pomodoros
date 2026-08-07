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
      <header className="border-ink/12 border-b">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-3 md:px-gutter-desktop">
          <BrandMark />
          {headerAction}
        </div>
      </header>
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-8 md:px-gutter-desktop md:py-12 lg:py-14',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
