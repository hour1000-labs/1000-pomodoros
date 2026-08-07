import { Link } from '@tanstack/react-router';

import { BrandMark } from '@/components/shared/brand-mark';
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
        <section className="rounded-lg border border-ink/15 p-6">
          <h1 className="mb-2 font-bold text-2xl">Milestone unavailable</h1>
          <p className="mb-6 max-w-[52ch] text-ink/60 text-sm leading-relaxed">
            This milestone has not been earned yet or is no longer available.
          </p>
          <PrimaryButton asChild>
            <Link to="/home">Go home</Link>
          </PrimaryButton>
        </section>
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
  const pomodoroLabel = targetPomodoros === 1 ? 'Pomodoro' : 'Pomodoros';
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
            <p className="mb-4 font-bold text-ink/60 text-sm">Milestone reached</p>
            <p className="mb-4 font-bold text-lg [overflow-wrap:anywhere]">{journey.name}</p>
            <h1
              className="mb-5 max-w-[10ch] font-bold text-[clamp(3.5rem,18vw,7rem)] leading-[0.88] tracking-[-0.06em]"
              id="milestone-title"
            >
              {formatFocusedTime(milestone.targetFocusedMinutes)}
            </h1>
            <p className="mb-8 text-ink/60">
              <time dateTime={milestone.earnedAt}>
                Reached {formatMilestoneDate(milestone.earnedAt)}
              </time>
            </p>

            <PrimaryButton asChild className="w-full sm:w-auto">
              <Link to="/journeys/$journeyId" params={{ journeyId: journey.id }}>
                Continue Journey
              </Link>
            </PrimaryButton>
          </header>

          <div className="min-w-0">
            <Card className="min-w-0 gap-0 py-0">
              <CardContent className="p-4 sm:p-6">
                <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="mb-0 font-bold text-xl [overflow-wrap:anywhere]">
                    {milestone.name}
                  </h2>
                  <p className="mb-0 font-bold text-sm tabular-nums">
                    {pomodoroAmount} of {pomodoroAmount} {pomodoroLabel}
                  </p>
                </header>

                <PomodoroGrid
                  className="max-w-[23rem]"
                  focusedMinutes={milestone.targetFocusedMinutes}
                  totalPomodoros={targetBlockCount}
                  startIndex={milestoneSectionStartIndex}
                  renderLimit={milestoneSectionBlockCount}
                  milestoneIndexes={targetMilestoneIndexes}
                />

                <p className="mt-5 mb-0 border-ink/15 border-t pt-4 text-ink/60 text-sm leading-relaxed">
                  Each Pomodoro is 25 minutes. The milestone Pomodoro is marked.
                </p>
              </CardContent>
            </Card>

            {nextMilestone ? (
              <section className="mt-10" aria-labelledby="next-milestone-heading">
                <p className="mb-2 font-bold text-ink/60 text-sm">Next milestone</p>
                <h2
                  className="mb-5 font-bold text-3xl tracking-[-0.035em] [overflow-wrap:anywhere]"
                  id="next-milestone-heading"
                >
                  {nextMilestone.name}
                </h2>

                <MilestoneProgress
                  value={nextSectionPercentage}
                  label="Progress to next milestone"
                  detail={
                    remainingMinutes === 0
                      ? 'Reached'
                      : `${formatFocusedTime(remainingMinutes)} remaining`
                  }
                />
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
          <LoadingState label="Loading milestone" variant="milestone" />
        </FocusLayout>
      }
      errorFallback={({ retry, reset }) => (
        <FocusLayout>
          <RecoverableErrorState
            title="Could not load milestone"
            description="Your saved progress is unchanged. Try again."
            onRetry={retry}
            onReset={reset}
          />
        </FocusLayout>
      )}
    >
      {(state) => <MilestoneContent state={state} milestoneId={milestoneId} />}
    </PersistedStateBoundary>
  );
}
