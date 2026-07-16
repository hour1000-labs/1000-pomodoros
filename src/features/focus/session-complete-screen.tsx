import { Link, Navigate } from '@tanstack/react-router';
import { ArrowRight, ChevronDown, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { BrandMark } from '@/components/shared/brand-mark';
import { FocusLayout } from '@/components/shared/focus-layout';
import { LoadingState } from '@/components/shared/loading-state';
import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/use-app-state';
import type { AppState, FocusSession, Journey, Milestone, NextStep } from '@/lib/models';
import { deriveJourneyProgress, getFocusedMinutes, POMODORO_MINUTES } from '@/lib/progress';
import { appRepository, SESSION_REFLECTION_MAX_LENGTH } from '@/lib/repository';
import { cn } from '@/lib/utils';

const GRID_SECTION_SIZE = 100;

export interface SessionCompletionContext {
  session: FocusSession;
  journey: Journey;
  nextStep: NextStep;
  focusedMinutes: number;
  previousFocusedMinutes: number;
  earnedPomodoros: number;
  totalPomodoros: number;
  milestoneLabel: string;
  milestoneTargetMinutes: number;
  milestonePercentage: number;
  crossedMilestone: Milestone | null;
  gridTotalPomodoros: number;
  gridStartIndex: number;
  gridRenderLimit: number;
  milestoneIndexes: number[];
  highlightedIndexes: number[];
}

function findCompletedSession(state: AppState, sessionId: string | null | undefined) {
  if (!sessionId) return undefined;

  return state.focusSessions.find(
    (session) => session.id === sessionId && session.status === 'completed'
  );
}

function getSessionsCompletedBefore(state: AppState, session: FocusSession) {
  const sessionIndex = state.focusSessions.findIndex(({ id }) => id === session.id);
  const sessionEndTime = new Date(session.endedAt ?? session.startedAt).getTime();

  return state.focusSessions.filter((candidate, candidateIndex) => {
    if (candidate.id === session.id) return false;

    const candidateEndTime = new Date(candidate.endedAt ?? candidate.startedAt).getTime();

    if (Number.isFinite(sessionEndTime) && Number.isFinite(candidateEndTime)) {
      return (
        candidateEndTime < sessionEndTime ||
        (candidateEndTime === sessionEndTime && candidateIndex < sessionIndex)
      );
    }

    return candidateIndex < sessionIndex;
  });
}

export function resolveSessionCompletion(
  state: AppState,
  requestedSessionId?: string
): SessionCompletionContext | null {
  const session =
    findCompletedSession(state, requestedSessionId) ??
    findCompletedSession(state, state.lastCompletedSessionId);

  if (!session) return null;

  const journey = state.journeys.find(({ id }) => id === session.journeyId);
  const nextStep = session.nextStepId
    ? state.nextSteps.find(
        ({ id, journeyId }) => id === session.nextStepId && journeyId === session.journeyId
      )
    : undefined;

  if (!journey || !nextStep) return null;

  const progress = deriveJourneyProgress(journey, state.focusSessions);
  const sessionsCompletedBefore = getSessionsCompletedBefore(state, session);
  const previousFocusedMinutes = getFocusedMinutes(sessionsCompletedBefore, journey.id);
  const focusedMinutesAfterSession = getFocusedMinutes(
    [...sessionsCompletedBefore, session],
    journey.id
  );
  const journeyMilestones = state.milestones
    .filter((milestone) => milestone.journeyId === journey.id)
    .sort((left, right) => left.targetFocusedMinutes - right.targetFocusedMinutes);
  const crossedMilestone =
    journeyMilestones
      .filter(
        (milestone) =>
          milestone.earnedAt !== null &&
          previousFocusedMinutes < milestone.targetFocusedMinutes &&
          focusedMinutesAfterSession >= milestone.targetFocusedMinutes
      )
      .at(-1) ?? null;
  const nextMilestone = journeyMilestones.find(
    (milestone) => milestone.targetFocusedMinutes > progress.focusedMinutes
  );
  const displayedMilestone = crossedMilestone ?? nextMilestone ?? null;
  const milestoneTargetMinutes = Math.max(
    progress.focusedMinutes,
    displayedMilestone?.targetFocusedMinutes ?? journey.targetMinutes
  );
  const gridTotalPomodoros = Math.max(1, Math.ceil(milestoneTargetMinutes / POMODORO_MINUTES));
  const highlightedStart = Math.floor(previousFocusedMinutes / POMODORO_MINUTES);
  const highlightedEnd = Math.ceil(focusedMinutesAfterSession / POMODORO_MINUTES);
  const latestProgressIndex = Math.max(0, Math.ceil(progress.totalPomodoros) - 1);
  const maximumGridStart = Math.max(0, gridTotalPomodoros - GRID_SECTION_SIZE);
  const gridStartIndex =
    gridTotalPomodoros <= GRID_SECTION_SIZE
      ? 0
      : highlightedEnd > highlightedStart
        ? Math.min(highlightedStart, maximumGridStart)
        : Math.min(
            Math.floor(latestProgressIndex / GRID_SECTION_SIZE) * GRID_SECTION_SIZE,
            maximumGridStart
          );

  return {
    session,
    journey,
    nextStep,
    focusedMinutes: progress.focusedMinutes,
    previousFocusedMinutes,
    earnedPomodoros: session.focusedMinutes / POMODORO_MINUTES,
    totalPomodoros: progress.totalPomodoros,
    milestoneLabel: displayedMilestone?.name ?? 'Journey target',
    milestoneTargetMinutes,
    milestonePercentage:
      milestoneTargetMinutes === 0
        ? 0
        : Math.min(100, (progress.focusedMinutes / milestoneTargetMinutes) * 100),
    crossedMilestone,
    gridTotalPomodoros,
    gridStartIndex,
    gridRenderLimit: Math.min(GRID_SECTION_SIZE, gridTotalPomodoros - gridStartIndex),
    milestoneIndexes: journeyMilestones
      .filter(
        (milestone) =>
          milestone.targetFocusedMinutes % POMODORO_MINUTES === 0 &&
          milestone.targetFocusedMinutes <= milestoneTargetMinutes
      )
      .map((milestone) => milestone.targetFocusedMinutes / POMODORO_MINUTES - 1),
    highlightedIndexes: Array.from(
      { length: Math.max(0, highlightedEnd - highlightedStart) },
      (_, index) => highlightedStart + index
    ),
  };
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

export function formatPomodoroCount(value: number) {
  return numberFormatter.format(value);
}

function formatMinutes(value: number) {
  return numberFormatter.format(value);
}

function formatFocusedDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes - hours * 60;

  if (hours === 0) return `${formatMinutes(remainder)} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${formatMinutes(remainder)}m`;
}

function CompletionExperience({ context }: { context: SessionCompletionContext }) {
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflection, setReflection] = useState(context.session.reflection);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const earnedPomodoros = formatPomodoroCount(context.earnedPomodoros);
  const pomodoroLabel = context.earnedPomodoros === 1 ? 'pomodoro' : 'pomodoros';
  const remainingMinutes = Math.max(0, context.milestoneTargetMinutes - context.focusedMinutes);

  function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaveStatus(null);

    if (reflection.length > SESSION_REFLECTION_MAX_LENGTH) {
      setSaveError(`Keep your reflection to ${SESSION_REFLECTION_MAX_LENGTH} characters or fewer.`);
      return;
    }

    const result = appRepository.updateSessionReflection(context.session.id, reflection);
    const saved =
      result.status === 'saved' &&
      result.state.focusSessions.find(({ id }) => id === context.session.id)?.reflection ===
        reflection;

    if (saved) {
      setSaveStatus(reflection.length === 0 ? 'Reflection cleared.' : 'Reflection saved.');
      return;
    }

    setSaveError('Your reflection could not be saved. Try again.');
  }

  return (
    <FocusLayout className="items-start py-5 sm:py-8 lg:items-center lg:py-12">
      <div className="w-full max-w-6xl">
        <BrandMark className="mb-8 sm:mb-12" />

        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1.2fr)] lg:items-center lg:gap-16">
          <section className="min-w-0" aria-labelledby="session-complete-title">
            <p className="mb-5 inline-flex min-h-8 items-center gap-2 rounded-full border border-ink px-3 font-bold text-[0.7rem] uppercase tracking-[0.16em]">
              <span className="size-1.5 rounded-full bg-pomodoro-red" aria-hidden="true" />
              Session complete
            </p>
            <h1
              className="mb-4 max-w-[10ch] font-bold text-[clamp(3rem,12vw,5.5rem)] leading-[0.95] tracking-[-0.065em]"
              id="session-complete-title"
            >
              {earnedPomodoros} {pomodoroLabel} complete.
            </h1>
            <p className="mb-8 max-w-[38rem] text-base text-ink/60 leading-relaxed sm:text-lg">
              You added{' '}
              <strong className="text-ink">
                {formatMinutes(context.session.focusedMinutes)} focused minutes
              </strong>{' '}
              to {context.journey.name}.
            </p>

            <div className="mb-7 border-ink border-y py-5">
              <p className="mb-1 font-bold text-[0.68rem] text-ink/50 uppercase tracking-[0.15em]">
                Next step
              </p>
              <p className="mb-0 font-bold text-lg [overflow-wrap:anywhere]">
                {context.nextStep.title}
              </p>
            </div>

            <dl className="mb-8 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="mb-1 font-bold text-[0.68rem] text-ink/50 uppercase tracking-[0.14em]">
                  Journey
                </dt>
                <dd className="m-0 font-bold [overflow-wrap:anywhere]">{context.journey.name}</dd>
              </div>
              <div>
                <dt className="mb-1 font-bold text-[0.68rem] text-ink/50 uppercase tracking-[0.14em]">
                  Session
                </dt>
                <dd className="m-0 font-bold tabular-nums">
                  {formatFocusedDuration(context.session.focusedMinutes)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-bold text-[0.68rem] text-ink/50 uppercase tracking-[0.14em]">
                  New total
                </dt>
                <dd className="m-0 font-bold tabular-nums">
                  {formatPomodoroCount(context.totalPomodoros)} pomodoros
                </dd>
              </div>
            </dl>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryButton asChild className="shadow-[4px_4px_0_var(--ink)]">
                {context.crossedMilestone ? (
                  <Link
                    to="/milestones/$milestoneId"
                    params={{ milestoneId: context.crossedMilestone.id }}
                  >
                    View milestone
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ) : (
                  <Link to="/journeys/$journeyId" params={{ journeyId: context.journey.id }}>
                    View progress
                    <ArrowRight aria-hidden="true" />
                  </Link>
                )}
              </PrimaryButton>
              <Button asChild variant="outline" className="border-ink/30 bg-paper">
                <Link
                  to="/focus"
                  search={{
                    journeyId: context.journey.id,
                    nextStepId: context.nextStep.id,
                  }}
                >
                  Start another pomodoro
                  <Plus aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="border-ink/15 border-t pt-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between px-0 text-ink/65 hover:bg-transparent hover:text-ink"
                aria-expanded={reflectionOpen}
                aria-controls="session-reflection-panel"
                onClick={() => setReflectionOpen((open) => !open)}
              >
                <span>
                  {context.session.reflection ? 'Edit reflection' : 'Add a short reflection'}{' '}
                  <span className="font-normal text-ink/45">(optional)</span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn('transition-transform', reflectionOpen && 'rotate-180')}
                />
              </Button>

              {reflectionOpen ? (
                <form
                  className="mt-3 grid gap-3"
                  id="session-reflection-panel"
                  onSubmit={saveReflection}
                >
                  <label className="font-bold text-sm" htmlFor="session-reflection">
                    What did you accomplish?
                  </label>
                  <Textarea
                    id="session-reflection"
                    value={reflection}
                    maxLength={SESSION_REFLECTION_MAX_LENGTH}
                    rows={4}
                    aria-describedby="session-reflection-count"
                    className="field-sizing-fixed min-h-28 min-w-0 max-w-full resize-y border-ink/25 bg-paper"
                    onChange={(event) => {
                      setReflection(event.target.value);
                      setSaveError(null);
                      setSaveStatus(null);
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p
                      className="mb-0 text-ink/55 text-sm tabular-nums"
                      id="session-reflection-count"
                    >
                      {reflection.length} / {SESSION_REFLECTION_MAX_LENGTH}
                    </p>
                    <Button type="submit" variant="outline" className="border-ink/30">
                      Save reflection
                    </Button>
                  </div>
                  {saveError ? (
                    <p className="mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                      {saveError}
                    </p>
                  ) : null}
                  {saveStatus ? (
                    <p className="mb-0 text-ink/65 text-sm" role="status" aria-live="polite">
                      {saveStatus}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </div>
          </section>

          <Card className="min-w-0 border-2 border-ink shadow-[8px_8px_0_var(--ink)]">
            <CardContent className="p-4 sm:p-7">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-ink border-b pb-4">
                <div>
                  <p className="mb-1 font-bold text-[0.68rem] text-ink/50 uppercase tracking-[0.15em]">
                    Current milestone
                  </p>
                  <h2 className="mb-0 font-bold text-xl [overflow-wrap:anywhere]">
                    {context.milestoneLabel}
                  </h2>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 font-bold text-paper text-sm tabular-nums">
                  {Math.round(context.milestonePercentage)}%
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="mb-0 font-bold text-[0.7rem] text-ink/55 uppercase tracking-[0.15em]">
                  Your visible effort
                </p>
                <p className="mb-0 font-bold text-sm tabular-nums">
                  {formatPomodoroCount(context.totalPomodoros)} /{' '}
                  {formatPomodoroCount(context.gridTotalPomodoros)}
                </p>
              </div>

              <PomodoroGrid
                focusedMinutes={context.focusedMinutes}
                totalPomodoros={context.gridTotalPomodoros}
                startIndex={context.gridStartIndex}
                renderLimit={context.gridRenderLimit}
                milestoneIndexes={context.milestoneIndexes}
                highlightedIndexes={context.highlightedIndexes}
              />

              <MilestoneProgress
                className="mt-6 border-ink border-t pt-5"
                value={context.milestonePercentage}
                label={
                  remainingMinutes === 0
                    ? `${context.milestoneLabel} reached`
                    : `${formatFocusedDuration(remainingMinutes)} remaining`
                }
                detail={`${formatFocusedDuration(context.focusedMinutes)} focused`}
              />
              <p className="mt-4 mb-0 flex items-center gap-2 font-bold text-[0.68rem] text-ink/50 uppercase tracking-[0.13em]">
                <span
                  className="size-1.5 shrink-0 rounded-full bg-pomodoro-red"
                  aria-hidden="true"
                />
                {context.highlightedIndexes.length === 1
                  ? 'Newly earned block identified'
                  : `${context.highlightedIndexes.length} newly earned blocks identified`}
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Focus session complete. {earnedPomodoros} {pomodoroLabel} added to {context.journey.name}.
        </p>
      </div>
    </FocusLayout>
  );
}

export function SessionCompleteScreen({ sessionId }: { sessionId?: string }) {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <FocusLayout>
        <LoadingState label="Loading completed session" />
      </FocusLayout>
    );
  }

  if (hydration.status === 'error') {
    return (
      <FocusLayout>
        <RecoverableErrorState onRetry={hydration.retry} onReset={hydration.reset} />
      </FocusLayout>
    );
  }

  const context = resolveSessionCompletion(hydration.state, sessionId);

  if (!context) return <Navigate to="/home" replace />;

  return <CompletionExperience key={context.session.id} context={context} />;
}
