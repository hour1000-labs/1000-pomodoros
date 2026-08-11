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
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/use-app-state';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import { getLocalDateKeyFromTimestamp } from '@/lib/local-date';
import type { AppState, FocusSession, Journey, Milestone, NextStep } from '@/lib/models';
import { deriveJourneyProgress, getFocusedMinutes, POMODORO_MINUTES } from '@/lib/progress';
import { appRepository, SESSION_REFLECTION_MAX_LENGTH } from '@/lib/repository';
import { deriveStreakSessionImpact, type StreakSessionImpact } from '@/lib/streaks';
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
  streakImpact: StreakSessionImpact | null;
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

function getSessionsAvailableForStreakImpact(
  state: AppState,
  session: FocusSession,
  sessionsCompletedBefore: readonly FocusSession[]
) {
  const sessionDateKey = getLocalDateKeyFromTimestamp(session.endedAt ?? session.startedAt);

  if (sessionDateKey === null) return sessionsCompletedBefore;

  const availableSessions = new Set(sessionsCompletedBefore);

  // Timer rows are created when focus starts, so a manual row saved while a timer runs can
  // appear on either side of it. Without a separate creation timestamp, every same-date manual
  // row must be offered to streak derivation, which still rejects ineligible records itself.
  for (const candidate of state.focusSessions) {
    if (candidate.source !== 'manual' || availableSessions.has(candidate)) {
      continue;
    }

    const candidateDateKey = getLocalDateKeyFromTimestamp(candidate.endedAt ?? candidate.startedAt);
    if (candidateDateKey === sessionDateKey) availableSessions.add(candidate);
  }

  return [...availableSessions];
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
  const sessionsAvailableForStreakImpact = getSessionsAvailableForStreakImpact(
    state,
    session,
    sessionsCompletedBefore
  );
  const hasUniqueSessionId = state.focusSessions.filter(({ id }) => id === session.id).length === 1;
  const streakImpact =
    session.source === 'timer' && hasUniqueSessionId
      ? deriveStreakSessionImpact(
          sessionsAvailableForStreakImpact,
          session,
          state.journeys.map(({ id }) => id),
          new Date(session.endedAt ?? session.startedAt)
        )
      : null;
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
    streakImpact,
  };
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

export function formatPomodoroCount(value: number) {
  return numberFormatter.format(value);
}

function formatSessionStreakFeedback(impact: StreakSessionImpact | null) {
  if (impact === null || !impact.counted) return null;

  const parts = [`${impact.currentStreakAfter}-day streak`, 'Focus day counted'];

  if (impact.freezesEarnedDelta > 0) {
    parts.push(
      `${impact.freezesEarnedDelta} streak ${impact.freezesEarnedDelta === 1 ? 'freeze' : 'freezes'} earned`
    );
  }

  if (impact.newPersonalBest) {
    parts.push('New personal best');
  }

  return `${parts.join(' · ')}.`;
}

function CompletionExperience({ context }: { context: SessionCompletionContext }) {
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflection, setReflection] = useState(context.session.reflection);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const earnedPomodoros = formatPomodoroCount(context.earnedPomodoros);
  const pomodoroLabel = context.earnedPomodoros === 1 ? 'pomodoro' : 'pomodoros';
  const remainingMinutes = Math.max(0, context.milestoneTargetMinutes - context.focusedMinutes);
  const streakFeedback = formatSessionStreakFeedback(context.streakImpact);

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

    setSaveError("We couldn't save your reflection. Try again.");
  }

  return (
    <FocusLayout className="items-start py-6 sm:py-10">
      <div className="w-full max-w-5xl">
        <BrandMark className="mb-10" />

        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,1.2fr)] lg:items-start lg:gap-12">
          <section className="min-w-0" aria-labelledby="session-complete-title">
            <h1
              className="mb-4 max-w-[11ch] font-bold text-[clamp(2.75rem,12vw,5rem)] leading-none tracking-[-0.055em] [overflow-wrap:normal]"
              id="session-complete-title"
            >
              {earnedPomodoros} {pomodoroLabel} complete.
            </h1>
            <p className="mb-8 max-w-[38rem] text-base text-ink/60 leading-relaxed [overflow-wrap:anywhere] sm:text-lg">
              Added{' '}
              <strong className="text-ink">
                {formatFocusedDuration(context.session.focusedMinutes)}
              </strong>{' '}
              of focused time to {context.journey.name}.
            </p>

            {streakFeedback ? (
              <p className="-mt-4 mb-8 font-bold text-ink/65 text-sm">{streakFeedback}</p>
            ) : null}

            <div className="mb-8 border-ink/15 border-y py-5">
              <p className="mb-1 font-bold text-ink/60 text-sm">Next step</p>
              <p className="mb-0 font-bold text-lg [overflow-wrap:anywhere]">
                {context.nextStep.title}
              </p>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryButton asChild>
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
              <Button asChild variant="outline" className="border-ink/50 bg-paper">
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
                  <span className="font-normal text-ink/60">(optional)</span>
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
                    className="field-sizing-fixed min-h-28 min-w-0 max-w-full resize-y border-ink/50 bg-paper"
                    onChange={(event) => {
                      setReflection(event.target.value);
                      setSaveError(null);
                      setSaveStatus(null);
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p
                      className="mb-0 text-ink/60 text-sm tabular-nums"
                      id="session-reflection-count"
                    >
                      {reflection.length} / {SESSION_REFLECTION_MAX_LENGTH}
                    </p>
                    <Button type="submit" variant="outline" className="border-ink/50">
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

          <section
            className="min-w-0 rounded-xl border border-ink/15 p-4 sm:p-6"
            aria-labelledby="session-progress-title"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-ink/15 border-b pb-4">
              <div className="min-w-0">
                <p className="mb-1 font-bold text-ink/60 text-sm">Progress</p>
                <h2
                  className="mb-0 font-bold text-xl [overflow-wrap:anywhere]"
                  id="session-progress-title"
                >
                  {context.milestoneLabel}
                </h2>
              </div>
              <p className="mb-0 font-bold text-lg tabular-nums">
                {Math.round(context.milestonePercentage)}%
              </p>
            </div>

            <p className="mb-4 font-bold text-ink/65 text-sm tabular-nums">
              {formatPomodoroCount(context.totalPomodoros)} of{' '}
              {formatPomodoroCount(context.gridTotalPomodoros)} Pomodoros
            </p>

            <PomodoroGrid
              focusedMinutes={context.focusedMinutes}
              totalPomodoros={context.gridTotalPomodoros}
              startIndex={context.gridStartIndex}
              renderLimit={context.gridRenderLimit}
              milestoneIndexes={context.milestoneIndexes}
              highlightedIndexes={context.highlightedIndexes}
            />

            <MilestoneProgress
              className="mt-6 border-ink/15 border-t pt-5"
              value={context.milestonePercentage}
              label={
                remainingMinutes === 0
                  ? `${context.milestoneLabel} reached`
                  : `${formatFocusedDuration(remainingMinutes)} remaining`
              }
              detail={`${formatFocusedDuration(context.focusedMinutes)} focused`}
            />
            <p className="mt-4 mb-0 text-ink/60 text-sm">
              {context.highlightedIndexes.length === 1
                ? '1 newly earned Pomodoro is outlined.'
                : `${context.highlightedIndexes.length} newly earned Pomodoros are outlined.`}
            </p>
          </section>
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
        <LoadingState label="Loading completed session" variant="complete" />
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
