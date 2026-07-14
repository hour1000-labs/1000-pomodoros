import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { AppNavigation } from './app-navigation'

export function ApplicationLayout({
  children,
  journeyId,
  className,
}: Readonly<{
  children: ReactNode
  journeyId: string
  className?: string
}>) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <AppNavigation journeyId={journeyId} />
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-10 pb-28 md:px-gutter-desktop md:py-16 md:pb-16',
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}
