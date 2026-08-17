import type { ReactNode } from 'react';

import { BrandMark } from '@/components/shared/brand-mark';
import { cn } from '@/lib/utils';

export function OnboardingLayout({
  children,
  className,
  headerAction,
}: Readonly<{
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-30 border-ink/8 border-b bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-3.5 md:px-gutter-desktop">
          <BrandMark />
          {headerAction}
        </div>
      </header>
      <main
        className={cn(
          'mx-auto flex min-h-0 w-full max-w-content flex-1 items-start px-gutter-mobile py-8 md:items-center md:px-gutter-desktop md:py-12',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
