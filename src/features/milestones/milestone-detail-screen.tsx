import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, CalendarDays, Check } from 'lucide-react';

import { BrandMark } from '@/components/shared/brand-mark';
import { EmptyState } from '@/components/shared/empty-state';
import { FocusLayout } from '@/components/shared/focus-layout';
import { LoadingState } from '@/components/shared/loading-state';
import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Card, CardContent } from '@/components/ui/card';
import type { AppState } from '@/lib/models';

import { deriveMilestoneDetailData } from './milestone-detail-data';

function formatMilestoneDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatFocusedTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`;

  if (hours === 0) return `${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return hourLabel;
  return `${hourLabel} ${remainingMinutes} minutes`;
}

function formatPomodoroAmount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function MilestoneNotFoundState() {
  return (
    <FocusLayout className="items-start py-8 sm:py-12">
      <div className="w-full max-w-reading">
        <BrandMark className="mb-10" />
        <h1 className="sr-only">Milestone unavailable</h1>
        <EmptyState
          className="w-full"
          title="Milestone not found"
          description="This milestone is unavailable or has not been earned yet. Return Home to continue from your saved progress."
          action={
            <PrimaryButton asChild>
              <Link to="/home">
                <ArrowLeft aria-hidden="true" />
                Return Home
              </Link>
            </PrimaryButton>
          }
        />
      </div>
    </FocusLayout>
  );
}

function MilestoneContent({ state, milestoneId }: { state: AppState; milestoneId: string }) {
  const detail = deriveMilestoneDetailData(state, milestoneId);

  if (!detail) return <MilestoneNotFoundState />;

  const {
    journey,
    milestone,
    targetPomodoros,
    targetBlockCount,
    milestoneSectionStartIndex,
    milestoneSectionBlockCount,
    nextMilestone,
    nextSectionPercentage,
    remainingMinutes,
  } = detail;
  const pomodoroAmount = formatPomodoroAmount(targetPomodoros);
  const pomodoroLabel = targetPomodoros === 1 ? 'pomodoro' : 'pomodoros';
  const targetMilestoneIndexes = targetBlockCount > 0 ? [targetBlockCount - 1] : [];

  return (
    <FocusLayout className="items-start py-6 sm:py-10 lg:py-14">
      <article
        className="fade-in-0 w-full max-w-6xl animate-in duration-300 motion-reduce:animate-none"
        data-milestone-content="true"
        aria-labelledby="milestone-title"
      >
        <BrandMark className="mb-8 sm:mb-12" />

        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(24rem,1.22fr)] lg:items-start lg:gap-16">
          <header className="min-w-0">
            <p className="mb-7 inline-flex min-h-8 items-center gap-2 border border-ink px-3 font-bold text-[0.68rem] uppercase tracking-[0.16em]">
              <Check aria-hidden="true" className="size-4 text-pomodoro-red" strokeWidth={3} />
              Milestone reached
            </p>

            <p className="mb-5 font-bold text-lg [overflow-wrap:anywhere]">{journey.name}</p>
            <h1
              className="mb-5 max-w-[9ch] font-bold text-[clamp(4rem,20vw,8.5rem)] leading-[0.82] tracking-[-0.075em]"
              id="milestone-title"
            >
              {formatFocusedTime(milestone.targetFocusedMinutes)}
            </h1>
            <p className="mb-7 max-w-[34rem] font-bold text-xl leading-snug sm:text-2xl">
              You showed up for{' '}
              <span className="text-pomodoro-red">
                {pomodoroAmount} {pomodoroLabel}.
              </span>
            </p>
            <p className="mb-8 flex items-center gap-2 text-ink/60">
              <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-pomodoro-red" />
              <time dateTime={milestone.earnedAt}>
                Reached {formatMilestoneDate(milestone.earnedAt)}
              </time>
            </p>

            <PrimaryButton asChild className="w-full shadow-[4px_4px_0_var(--ink)] sm:w-auto">
              <Link to="/journeys/$journeyId" params={{ journeyId: journey.id }}>
                Continue Journey
                <ArrowRight aria-hidden="true" />
              </Link>
            </PrimaryButton>
          </header>

          <div className="min-w-0">
            <Card className="min-w-0 gap-0 border-2 border-ink py-0 shadow-[8px_8px_0_var(--ink)] ring-0">
              <div className="flex items-center justify-between gap-4 border-ink border-b-2 px-4 py-4 sm:px-6">
                <div>
                  <p className="mb-1 font-bold text-[0.68rem] text-ink/60 uppercase tracking-[0.16em]">
                    A record of practice
                  </p>
                  <h2 className="mb-0 font-bold text-xl [overflow-wrap:anywhere]">
                    {milestone.name}
                  </h2>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-paper">
                  <Check aria-hidden="true" className="size-5" strokeWidth={3} />
                </span>
              </div>

              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="mb-0 font-bold text-[0.68rem] text-ink/60 uppercase tracking-[0.15em]">
                    Completed
                  </p>
                  <p className="mb-0 font-bold text-sm tabular-nums">
                    {pomodoroAmount} / {pomodoroAmount}
                  </p>
                </div>

                <PomodoroGrid
                  className="max-w-[23rem]"
                  focusedMinutes={milestone.targetFocusedMinutes}
                  totalPomodoros={targetBlockCount}
                  startIndex={milestoneSectionStartIndex}
                  renderLimit={milestoneSectionBlockCount}
                  milestoneIndexes={targetMilestoneIndexes}
                />

                <p className="mt-5 mb-0 flex items-center gap-2 border-ink border-t pt-4 font-bold text-[0.68rem] text-ink/60 uppercase tracking-[0.13em]">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-pomodoro-red"
                  />
                  {milestoneSectionBlockCount} blocks in this section · 25 minutes each · milestone
                  block identified
                </p>
              </CardContent>
            </Card>

            {nextMilestone ? (
              <section
                className="mt-10 border-pomodoro-red border-l-2 pl-5 sm:pl-7"
                aria-labelledby="next-milestone-heading"
              >
                <p className="mb-2 font-bold text-[0.68rem] text-ink/60 uppercase tracking-[0.16em]">
                  Next milestone
                </p>
                <div className="mb-5">
                  <h2
                    className="mb-0 font-bold text-3xl tracking-[-0.035em] [overflow-wrap:anywhere]"
                    id="next-milestone-heading"
                  >
                    {nextMilestone.name}
                  </h2>
                </div>

                <MilestoneProgress
                  value={nextSectionPercentage}
                  label="Progress from this milestone"
                  detail={
                    remainingMinutes === 0
                      ? 'Reached'
                      : `${formatFocusedTime(remainingMinutes)} remaining`
                  }
                />
                <p className="mt-4 mb-0 max-w-[48ch] text-ink/60 text-sm leading-relaxed">
                  The next focused hours begin the same way: one clear step and one focused session.
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </article>
    </FocusLayout>
  );
}

export function MilestoneDetailScreen({ milestoneId }: { milestoneId: string }) {
  return (
    <PersistedStateBoundary
      loadingFallback={
        <FocusLayout>
          <LoadingState label="Loading milestone" />
        </FocusLayout>
      }
      errorFallback={({ retry, reset }) => (
        <FocusLayout>
          <RecoverableErrorState onRetry={retry} onReset={reset} />
        </FocusLayout>
      )}
    >
      {(state) => <MilestoneContent state={state} milestoneId={milestoneId} />}
    </PersistedStateBoundary>
  );
}
