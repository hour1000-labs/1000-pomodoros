import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { AppNavigation } from './app-navigation';

export function ApplicationLayout({
  children,
  journeyId,
  className,
  mobileDock,
}: Readonly<{
  children: ReactNode;
  journeyId: string;
  className?: string;
  mobileDock?: ReactNode;
}>) {
  return (
    <div
      className={cn(
        'min-h-dvh bg-paper text-ink',
        mobileDock && 'max-md:h-dvh max-md:overflow-hidden'
      )}
    >
      <AppNavigation journeyId={journeyId} />
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-10 pb-28 md:px-gutter-desktop md:py-16 md:pb-16',
          mobileDock &&
            'max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:bottom-[calc(8.75rem+env(safe-area-inset-bottom))] max-md:overflow-y-auto max-md:overscroll-contain',
          className
        )}
      >
        {children}
      </main>
      {mobileDock}
    </div>
  );
}
