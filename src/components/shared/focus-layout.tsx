import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function FocusLayout({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
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
