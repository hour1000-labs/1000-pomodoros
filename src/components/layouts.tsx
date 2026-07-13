import type { ReactNode } from 'react'

import { AppNavigation } from '@/components/app-navigation'
import { BrandMark } from '@/components/brand-mark'
import { cn } from '@/lib/utils'

type LayoutProps = Readonly<{
  children: ReactNode
  className?: string
}>

export function PublicLayout({
  children,
  className,
  headerAction,
}: LayoutProps & { headerAction?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-4 md:px-gutter-desktop">
        <BrandMark />
        {headerAction}
      </header>
      <main
        className={cn(
          'mx-auto w-full max-w-content px-gutter-mobile py-12 md:px-gutter-desktop md:py-20',
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}

export function OnboardingLayout({
  children,
  className,
  headerAction,
}: LayoutProps & { headerAction?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-gutter-mobile py-4 md:px-gutter-desktop">
        <BrandMark />
        {headerAction}
      </header>
      <main
        className={cn(
          'mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-content items-start px-gutter-mobile py-8 md:items-center md:px-gutter-desktop md:py-12',
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}

export function ApplicationLayout({
  children,
  journeyId,
  className,
}: LayoutProps & { journeyId: string }) {
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

export function FocusLayout({ children, className }: LayoutProps) {
  return (
    <main
      className={cn(
        'flex min-h-dvh w-full items-center justify-center bg-paper px-gutter-mobile py-10 text-ink md:px-gutter-desktop',
        className,
      )}
    >
      {children}
    </main>
  )
}
