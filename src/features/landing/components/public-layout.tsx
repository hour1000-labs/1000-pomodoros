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
    <div className="min-h-dvh bg-paper text-ink selection:bg-ink selection:text-paper">
      <header className="sticky top-0 z-30 border-ink/8 border-b bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-3.5 md:px-gutter-desktop">
          <BrandMark />
          {headerAction}
        </div>
      </header>
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-10 md:px-gutter-desktop md:py-16 lg:py-20',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
