import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { AppNavigation } from './app-navigation';

export function ApplicationLayout({
  children,
  className,
  mobileDock,
  showNavigationItems = true,
}: Readonly<{
  children: ReactNode;
  className?: string;
  mobileDock?: ReactNode;
  showNavigationItems?: boolean;
}>) {
  return (
    <div
      className={cn(
        'min-h-dvh bg-paper text-ink',
        mobileDock && 'max-md:h-dvh max-md:overflow-hidden'
      )}
    >
      <AppNavigation showNavigationItems={showNavigationItems} />
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-8 pb-28 md:px-gutter-desktop md:py-12 md:pb-12',
          !showNavigationItems && 'pb-12',
          mobileDock &&
            'max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:bottom-[calc(8.75rem+env(safe-area-inset-bottom))] max-md:z-40 max-md:overflow-y-auto max-md:overscroll-contain',
          className
        )}
      >
        {children}
      </main>
      {mobileDock}
    </div>
  );
}
