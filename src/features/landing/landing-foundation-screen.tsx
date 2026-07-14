import { ArrowRight, Check, Clock3, Play } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { PomodoroGrid } from '@/components/shared/pomodoro-grid'
import { PrimaryButton } from '@/components/shared/primary-button'
import { ScreenHeader } from '@/components/shared/screen-header'
import { Card, CardContent } from '@/components/ui/card'

import { PublicLayout } from './components/public-layout'

export function LandingFoundationScreen() {
  return (
    <PublicLayout>
      <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] md:gap-16">
        <ScreenHeader
          eyebrow="Visible progress, one session at a time"
          title="Turn focused work into visible progress"
          description="Choose what matters, start a focused session, and watch every 25 minutes become part of something bigger."
          actions={
            <PrimaryButton asChild>
              <Link to="/onboarding/journey">
                Start first pomodoro
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </PrimaryButton>
          }
        />
        <Card className="gap-0 border-2 border-ink py-0 ring-0">
          <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4 text-xs font-bold">
            <span>1000 Pomodoros</span>
            <span className="text-ink/60">Journey 01</span>
          </div>
          <CardContent className="grid p-0 sm:grid-cols-2">
            <div className="border-b-2 border-ink p-5 sm:border-r-2 sm:border-b-0">
              <p className="mb-2 text-xs font-bold text-ink/60">
                Current Journey
              </p>
              <p className="mb-6 text-2xl leading-tight font-bold tracking-[-0.025em]">
                Learn guitar
              </p>
              <div className="border-y border-ink/20 py-4">
                <p className="mb-1 text-xs font-bold text-ink/60">Next step</p>
                <p className="mb-0 text-sm font-bold">
                  Practice the F chord transition
                </p>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold text-ink/60">
                    Focused time
                  </p>
                  <p className="mb-0 text-xl font-bold">17h 55m</p>
                </div>
                <span className="grid size-11 place-items-center rounded-full bg-pomodoro-red text-paper">
                  <Check aria-hidden="true" className="size-5" />
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-1 text-xs font-bold text-ink/60">
                Focus session
              </p>
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-ink/20 pb-4">
                <p className="mb-0 text-4xl font-bold tracking-[-0.04em] tabular-nums">
                  25:00
                </p>
                <span className="grid size-11 place-items-center rounded-full bg-ink text-paper">
                  <Play aria-hidden="true" className="size-4 fill-current" />
                </span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold">
                <span className="text-ink/60">Your visible effort</span>
                <span>43 / 50</span>
              </div>
              <PomodoroGrid
                focusedMinutes={43 * 25}
                totalPomodoros={50}
                latestIndex={42}
              />
              <div className="mt-5 flex items-center gap-3 rounded-md bg-ink p-3 text-paper">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pomodoro-red">
                  <Clock3 aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="mb-0 text-xs text-paper/65">Next milestone</p>
                  <p className="mb-0 text-sm font-bold">50 pomodoros</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
