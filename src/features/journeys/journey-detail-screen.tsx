import { Link } from '@tanstack/react-router'

import { EmptyState } from '@/components/shared/empty-state'
import { MilestoneProgress } from '@/components/shared/milestone-progress'
import { PomodoroGrid } from '@/components/shared/pomodoro-grid'
import { PrimaryButton } from '@/components/shared/primary-button'
import { ScreenHeader } from '@/components/shared/screen-header'
import { Card, CardContent } from '@/components/ui/card'
import { getJourneyContext } from '@/lib/journey-context'
import type { AppState } from '@/lib/models'
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data'

import { ApplicationLayout } from './components/application-layout'
import { ApplicationStateBoundary } from './components/application-state-boundary'
import { formatFocusedTime } from './format-focused-time'

function JourneyNotFoundState({ state }: { state: AppState }) {
  const navigationJourneyId =
    state.journeys.find(
      (journey) => journey.id === state.lastActiveJourneyId,
    )?.id ??
    state.journeys[0]?.id ??
    LEARN_GUITAR_JOURNEY_ID

  return (
    <ApplicationLayout journeyId={navigationJourneyId}>
      <EmptyState
        className="w-full"
        title="Journey not found"
        description="This Journey is unavailable or may have been removed."
        action={
          <PrimaryButton asChild>
            <Link to="/home">Return Home</Link>
          </PrimaryButton>
        }
      />
    </ApplicationLayout>
  )
}

function JourneyContent({
  state,
  journeyId,
}: {
  state: AppState
  journeyId: string
}) {
  const context = getJourneyContext(state, journeyId)

  if (!context) return <JourneyNotFoundState state={state} />

  const { journey, nextStep, progress } = context

  return (
    <ApplicationLayout journeyId={journey.id}>
      <ScreenHeader
        eyebrow="Journey"
        title={journey.name}
        description={journey.reason || 'A visible record of your focused work.'}
        actions={
          <PrimaryButton asChild>
            <Link to="/focus">Start 25:00</Link>
          </PrimaryButton>
        }
      />
      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-3xl font-bold tracking-[-0.03em]">
                  {progress.totalPomodoros.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </p>
                <p className="mb-0 text-sm text-ink/60">
                  Pomodoros completed
                </p>
              </div>
              <p className="mb-0 text-sm text-ink/60">
                {formatFocusedTime(progress.focusedMinutes)} focused
              </p>
            </div>
            <PomodoroGrid
              focusedMinutes={progress.focusedMinutes}
              totalPomodoros={Math.min(100, progress.targetPomodoros)}
              latestIndex={
                progress.fullPomodoros > 0
                  ? progress.fullPomodoros - 1
                  : undefined
              }
              milestoneIndexes={[9, 24, 49, 99]}
            />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="mb-2 text-sm font-bold text-ink/60">Next step</p>
              <p className="mb-0 text-lg font-bold">
                {nextStep?.title ?? 'Choose your next action'}
              </p>
            </CardContent>
          </Card>
          <MilestoneProgress
            value={(progress.focusedMinutes / (25 * 60)) * 100}
            label="25-hour milestone"
          />
        </div>
      </section>
    </ApplicationLayout>
  )
}

export function JourneyDetailScreen({ journeyId }: { journeyId: string }) {
  return (
    <ApplicationStateBoundary>
      {(state) => <JourneyContent state={state} journeyId={journeyId} />}
    </ApplicationStateBoundary>
  )
}
