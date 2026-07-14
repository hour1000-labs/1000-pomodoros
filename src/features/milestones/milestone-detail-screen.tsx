import { Check } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { EmptyState } from '@/components/shared/empty-state'
import { FocusLayout } from '@/components/shared/focus-layout'
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary'
import { PomodoroGrid } from '@/components/shared/pomodoro-grid'
import { PrimaryButton } from '@/components/shared/primary-button'
import { ScreenHeader } from '@/components/shared/screen-header'
import { Card, CardContent } from '@/components/ui/card'
import type { AppState } from '@/lib/models'

function MilestoneContent({
  state,
  milestoneId,
}: {
  state: AppState
  milestoneId: string
}) {
  const milestone = state.milestones.find((item) => item.id === milestoneId)
  const journey = milestone
    ? state.journeys.find((item) => item.id === milestone.journeyId)
    : undefined

  if (!milestone || !journey || !milestone.earnedAt) {
    return (
      <FocusLayout>
        <EmptyState
          className="w-full max-w-reading"
          title="Milestone not found"
          description="This milestone is unavailable or has not been earned yet."
          action={
            <PrimaryButton asChild>
              <Link to="/home">Return Home</Link>
            </PrimaryButton>
          }
        />
      </FocusLayout>
    )
  }

  const targetPomodoros = milestone.targetFocusedMinutes / 25

  return (
    <FocusLayout>
      <div className="grid w-full max-w-4xl gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
        <ScreenHeader
          eyebrow={journey.name}
          title={`${milestone.targetFocusedMinutes / 60} hours`}
          description={`A milestone built from ${targetPomodoros} focused pomodoros.`}
          actions={
            <PrimaryButton asChild>
              <Link
                to="/journeys/$journeyId"
                params={{ journeyId: journey.id }}
              >
                Continue Journey
              </Link>
            </PrimaryButton>
          }
        />
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3 text-sm font-bold">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-paper">
                <Check aria-hidden="true" className="size-4" />
              </span>
              Milestone section
            </div>
            <PomodoroGrid
              focusedMinutes={milestone.targetFocusedMinutes}
              totalPomodoros={Math.min(100, targetPomodoros)}
              renderLimit={100}
              milestoneIndexes={[Math.min(99, targetPomodoros - 1)]}
            />
          </CardContent>
        </Card>
      </div>
    </FocusLayout>
  )
}

export function MilestoneDetailScreen({
  milestoneId,
}: {
  milestoneId: string
}) {
  return (
    <PersistedStateBoundary>
      {(state) => (
        <MilestoneContent state={state} milestoneId={milestoneId} />
      )}
    </PersistedStateBoundary>
  )
}
