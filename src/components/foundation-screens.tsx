import { ArrowRight, Check, Clock3, Play } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import {
  ApplicationLayout,
  FocusLayout,
  OnboardingLayout,
  PublicLayout,
} from '@/components/layouts'
import { ContinueCard } from '@/components/continue-card'
import { EmptyState } from '@/components/empty-state'
import { JourneyCard } from '@/components/journey-card'
import { LoadingState } from '@/components/loading-state'
import { MilestoneProgress } from '@/components/milestone-progress'
import { PersistedStateBoundary } from '@/components/persisted-state-boundary'
import { PomodoroGrid } from '@/components/pomodoro-grid'
import { PrimaryButton } from '@/components/primary-button'
import { RecoverableErrorState } from '@/components/recoverable-error-state'
import { ScreenHeader } from '@/components/screen-header'
import { StatItem } from '@/components/stat-item'
import { Card, CardContent } from '@/components/ui/card'
import type { AppState, Journey } from '@/lib/models'
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data'
import {
  deriveJourneyProgress,
  deriveProgressFromSessions,
  getSessionsForLocalDate,
} from '@/lib/progress'

function formatFocusedTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`

  if (hours === 0) return `${remainder} minutes`
  if (remainder === 0) return hourLabel
  return `${hourLabel} ${remainder} minutes`
}

function getJourneyContext(state: AppState, journeyId?: string) {
  const journey = journeyId === undefined
    ? state.journeys.find((item) => item.id === state.lastActiveJourneyId) ??
      state.journeys[0]
    : state.journeys.find((item) => item.id === journeyId)

  if (!journey) return null

  const nextStep = state.nextSteps
    .filter((item) => item.journeyId === journey.id && item.status === 'current')
    .sort((left, right) => left.position - right.position)[0]
  const progress = deriveJourneyProgress(journey, state.focusSessions)

  return { journey, nextStep, progress }
}

function EmptyJourneyState() {
  return (
    <EmptyState
      className="w-full"
      title="Your next pomodoro starts here"
      description="Create a Journey to give your focused work a place to grow."
      action={
        <PrimaryButton asChild>
          <Link to="/onboarding/journey">Create a Journey</Link>
        </PrimaryButton>
      }
    />
  )
}

function ApplicationEmptyState() {
  return (
    <ApplicationLayout journeyId={LEARN_GUITAR_JOURNEY_ID}>
      <EmptyJourneyState />
    </ApplicationLayout>
  )
}

function JourneyNotFoundState({ state }: { state: AppState }) {
  const navigationJourneyId =
    state.journeys.find((journey) => journey.id === state.lastActiveJourneyId)?.id ??
    state.journeys[0]?.id ??
    LEARN_GUITAR_JOURNEY_ID

  return (
    <ApplicationLayout journeyId={navigationJourneyId}>
      <EmptyState
        className="w-full"
        title="Journey not found"
        description="This Journey is unavailable or may have been removed."
        action={<PrimaryButton asChild><Link to="/home">Return Home</Link></PrimaryButton>}
      />
    </ApplicationLayout>
  )
}

function FocusEmptyState() {
  return <FocusLayout><EmptyJourneyState /></FocusLayout>
}

function ApplicationStateBoundary({
  children,
}: {
  children: (state: AppState) => ReactNode
}) {
  return (
    <PersistedStateBoundary
      loadingFallback={<ApplicationLayout journeyId={LEARN_GUITAR_JOURNEY_ID}><LoadingState /></ApplicationLayout>}
      errorFallback={({ retry, reset }) => (
        <ApplicationLayout journeyId={LEARN_GUITAR_JOURNEY_ID}>
          <RecoverableErrorState onRetry={retry} onReset={reset} />
        </ApplicationLayout>
      )}
    >
      {children}
    </PersistedStateBoundary>
  )
}

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
              <p className="mb-2 text-xs font-bold text-ink/60">Current Journey</p>
              <p className="mb-6 text-2xl leading-tight font-bold tracking-[-0.025em]">
                Learn guitar
              </p>
              <div className="border-y border-ink/20 py-4">
                <p className="mb-1 text-xs font-bold text-ink/60">Next step</p>
                <p className="mb-0 text-sm font-bold">Practice the F chord transition</p>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold text-ink/60">Focused time</p>
                  <p className="mb-0 text-xl font-bold">17h 55m</p>
                </div>
                <span className="grid size-11 place-items-center rounded-full bg-pomodoro-red text-paper">
                  <Check aria-hidden="true" className="size-5" />
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-1 text-xs font-bold text-ink/60">Focus session</p>
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

const onboardingCopy = {
  journey: {
    step: '1 of 4',
    title: 'What do you want to make progress on?',
    description: 'Start with one skill, project, or goal that matters to you.',
  },
  motivation: {
    step: '2 of 4',
    title: 'Why does this matter to you?',
    description: 'A short reason can help your Journey stay meaningful.',
  },
  target: {
    step: '3 of 4',
    title: 'How much focused time are you aiming for?',
    description: 'You will see the next milestone first, not all 2,400 pomodoros.',
  },
  nextStep: {
    step: '4 of 4',
    title: 'What is the next thing you can work on?',
    description: 'Choose one action you can make progress on in your next session.',
  },
} as const

export function OnboardingFoundationScreen({
  screen,
}: {
  screen: keyof typeof onboardingCopy
}) {
  const copy = onboardingCopy[screen]

  return (
    <OnboardingLayout>
      <div className="w-full space-y-8">
        <ScreenHeader
          eyebrow={copy.step}
          title={copy.title}
          description={copy.description}
        />
        <Card>
          <CardContent className="p-6">
            <p className="mb-0 text-sm text-ink/60">
              This route is ready for its screen-specific onboarding feature.
            </p>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  )
}

function HomeContent({ state }: { state: AppState }) {
  const context = getJourneyContext(state)

  if (!context) return <ApplicationEmptyState />

  const { journey, nextStep, progress } = context
  const todayProgress = deriveProgressFromSessions(
    getSessionsForLocalDate(state.focusSessions, new Date()),
    journey.id,
  )

  return (
    <ApplicationLayout journeyId={journey.id}>
      <ScreenHeader
        eyebrow="Home"
        title="Keep your momentum"
        description="One clear next action, then the progress that proves your effort is adding up."
      />
      <section className="mt-8">
        <ContinueCard
          journeyId={journey.id}
          journeyName={journey.name}
          nextStep={nextStep?.title}
        />
      </section>
      <section className="mt-10 grid grid-cols-2 gap-6 sm:max-w-md" aria-label="Today">
        <StatItem value={String(todayProgress.fullPomodoros)} label="Pomodoros today" />
        <StatItem value={String(todayProgress.focusedMinutes)} label="Focused minutes" />
      </section>
      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-bold">Active Journey</h2>
        <JourneyCard
          journeyId={journey.id}
          name={journey.name}
          focusedTime={formatFocusedTime(progress.focusedMinutes)}
          milestoneLabel="Next milestone: 25 hours"
          milestonePercent={(progress.focusedMinutes / (25 * 60)) * 100}
          nextStep={nextStep?.title}
        />
      </section>
    </ApplicationLayout>
  )
}

export function HomeFoundationScreen() {
  return <ApplicationStateBoundary>{(state) => <HomeContent state={state} />}</ApplicationStateBoundary>
}

function JourneyContent({ state, journeyId }: { state: AppState; journeyId: string }) {
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
                <p className="mb-0 text-sm text-ink/60">Pomodoros completed</p>
              </div>
              <p className="mb-0 text-sm text-ink/60">
                {formatFocusedTime(progress.focusedMinutes)} focused
              </p>
            </div>
            <PomodoroGrid
              focusedMinutes={progress.focusedMinutes}
              totalPomodoros={Math.min(100, progress.targetPomodoros)}
              latestIndex={progress.fullPomodoros > 0 ? progress.fullPomodoros - 1 : undefined}
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

export function JourneyFoundationScreen({ journeyId }: { journeyId: string }) {
  return (
    <ApplicationStateBoundary>
      {(state) => <JourneyContent state={state} journeyId={journeyId} />}
    </ApplicationStateBoundary>
  )
}

function FocusContent({ state }: { state: AppState }) {
  const context = getJourneyContext(state)

  if (!context) return <FocusEmptyState />

  return (
    <FocusLayout>
      <div className="w-full max-w-reading text-center">
        <ScreenHeader
          align="center"
          eyebrow={context.journey.name}
          title="25:00"
          description={context.nextStep?.title ?? 'Choose a Next step before focusing.'}
        />
        <PrimaryButton className="mt-8 w-full sm:w-auto">
          <Clock3 aria-hidden="true" className="size-4" />
          Start focus session
        </PrimaryButton>
      </div>
    </FocusLayout>
  )
}

export function FocusFoundationScreen() {
  return <PersistedStateBoundary>{(state) => <FocusContent state={state} />}</PersistedStateBoundary>
}

function CompletionContent({ state }: { state: AppState }) {
  const latestSession = state.focusSessions.find(
    (session) => session.id === state.lastCompletedSessionId,
  )
  if (!latestSession || latestSession.status !== 'completed') {
    return (
      <FocusLayout>
        <EmptyState
          className="w-full max-w-reading"
          title="Session not found"
          description="There is no completed focus session to show yet."
          action={<PrimaryButton asChild><Link to="/home">Return Home</Link></PrimaryButton>}
        />
      </FocusLayout>
    )
  }

  const context = getJourneyContext(state, latestSession.journeyId)

  if (!context) {
    return (
      <FocusLayout>
        <EmptyState
          className="w-full max-w-reading"
          title="Journey not found"
          description="The Journey for this completed session is unavailable."
          action={<PrimaryButton asChild><Link to="/home">Return Home</Link></PrimaryButton>}
        />
      </FocusLayout>
    )
  }

  const minutes = latestSession.focusedMinutes

  return (
    <FocusLayout>
      <div className="grid w-full max-w-4xl gap-10 md:grid-cols-[1fr_0.8fr] md:items-center">
        <ScreenHeader
          eyebrow="Focus session complete"
          title={`${minutes / 25} pomodoro${minutes === 25 ? '' : 's'} complete.`}
          description={`You added ${minutes} focused minutes to ${context.journey.name}.`}
          actions={
            <PrimaryButton asChild>
              <Link to="/journeys/$journeyId" params={{ journeyId: context.journey.id }}>
                View progress
              </Link>
            </PrimaryButton>
          }
        />
        <Card>
          <CardContent className="p-6">
            <PomodoroGrid
              focusedMinutes={context.progress.focusedMinutes}
              totalPomodoros={100}
              startIndex={0}
              renderLimit={100}
              latestIndex={context.progress.fullPomodoros > 0 ? context.progress.fullPomodoros - 1 : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </FocusLayout>
  )
}

export function CompletionFoundationScreen() {
  return (
    <PersistedStateBoundary>
      {(state) => <CompletionContent state={state} />}
    </PersistedStateBoundary>
  )
}

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
              <Link to="/journeys/$journeyId" params={{ journeyId: journey.id }}>
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

export function MilestoneFoundationScreen({ milestoneId }: { milestoneId: string }) {
  return (
    <PersistedStateBoundary>
      {(state) => <MilestoneContent state={state} milestoneId={milestoneId} />}
    </PersistedStateBoundary>
  )
}

export function FullTargetFoundationDemo({ journey }: { journey: Journey }) {
  return (
    <PomodoroGrid
      focusedMinutes={0}
      totalPomodoros={journey.targetMinutes / 25}
      renderLimit={100}
    />
  )
}
