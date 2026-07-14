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
    <div className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-4 md:px-gutter-desktop">
        <BrandMark />
        {headerAction}
      </header>
      <main
        className={cn(
          'mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-content items-start px-gutter-mobile py-8 md:items-center md:px-gutter-desktop md:py-12',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
