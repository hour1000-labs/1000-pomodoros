import { Navigate, useNavigate } from '@tanstack/react-router';
import { Check, Clock3, Play } from 'lucide-react';
import { type FormEvent, type ReactNode, useRef, useState } from 'react';

import { FocusLayout } from '@/components/shared/focus-layout';
import { LoadingState } from '@/components/shared/loading-state';
import { PomodoroBlock } from '@/components/shared/pomodoro-block';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/hooks/use-app-state';
import type { ActiveTimer, AppState, FocusSession, Journey, NextStep } from '@/lib/models';
import { appRepository } from '@/lib/repository';
import { cn } from '@/lib/utils';

const MIN_CUSTOM_MINUTES = 5;
const MAX_CUSTOM_MINUTES = 240;
const MINUTES_PER_POMODORO = 25;

type DurationChoice = '25' | '50' | 'custom';

interface FocusSearch {
  journeyId?: string;
  nextStepId?: string;
}

interface FocusSelection {
  journey: Journey;
  nextStep: NextStep | null;
}

function getSelectableNextSteps(state: AppState, journeyId: string) {
  return state.nextSteps
    .filter(
      (nextStep) =>
        nextStep.journeyId === journeyId &&
        (nextStep.status === 'current' || nextStep.status === 'upcoming')
    )
    .sort((left, right) => left.position - right.position);
}

export function resolveFocusSelection(state: AppState, search: FocusSearch): FocusSelection | null {
  const searchedJourney = state.journeys.find(
    (journey) => journey.id === search.journeyId && journey.status === 'active'
  );
  const journey =
    searchedJourney ??
    state.journeys.find(
      (candidate) => candidate.id === state.lastActiveJourneyId && candidate.status === 'active'
    ) ??
    state.journeys.find((candidate) => candidate.status === 'active') ??
    null;

  if (!journey) return null;

  const selectableNextSteps = getSelectableNextSteps(state, journey.id);
  const searchedNextStep = selectableNextSteps.find(
    (nextStep) => nextStep.id === search.nextStepId
  );
  const nextStep =
    searchedNextStep ??
    selectableNextSteps.find((candidate) => candidate.status === 'current') ??
    selectableNextSteps[0] ??
    null;

  return { journey, nextStep };
}

export function getCustomDurationError(value: string) {
  if (value.trim().length === 0) {
    return 'Enter a duration from 5 to 240 minutes.';
  }

  const minutes = Number(value);

  if (!Number.isInteger(minutes)) {
    return 'Use a whole number of minutes.';
  }

  if (minutes < MIN_CUSTOM_MINUTES || minutes > MAX_CUSTOM_MINUTES) {
    return 'Choose a duration from 5 to 240 minutes.';
  }

  return null;
}

export function createFocusSessionRecords({
  journeyId,
  nextStepId,
  plannedMinutes,
  sessionId,
  startedAt,
}: {
  journeyId: string;
  nextStepId: string;
  plannedMinutes: number;
  sessionId: string;
  startedAt: string;
}): { session: FocusSession; activeTimer: ActiveTimer } {
  return {
    session: {
      id: sessionId,
      journeyId,
      nextStepId,
      plannedMinutes,
      focusedMinutes: 0,
      status: 'running',
      source: 'timer',
      startedAt,
      endedAt: null,
      reflection: '',
    },
    activeTimer: {
      sessionId,
      status: 'running',
      remainingSeconds: plannedMinutes * 60,
      accumulatedFocusedSeconds: 0,
      targetEndAt: new Date(
        new Date(startedAt).getTime() + plannedMinutes * 60 * 1_000
      ).toISOString(),
      pausedAt: null,
    },
  };
}

function formatRemainingTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function ActiveSessionState({ state }: { state: AppState }) {
  const activeTimer = state.activeTimer;
  const session = activeTimer
    ? state.focusSessions.find(({ id }) => id === activeTimer.sessionId)
    : undefined;
  const journey = session ? state.journeys.find(({ id }) => id === session.journeyId) : undefined;
  const nextStep = session?.nextStepId
    ? state.nextSteps.find(({ id }) => id === session.nextStepId)
    : undefined;

  if (!activeTimer || !session || !journey) return null;

  const isPaused = activeTimer.status === 'paused';

  return (
    <FocusLayout className="items-start py-6 sm:items-center">
      <section className="w-full max-w-reading text-center" aria-labelledby="active-session-title">
        <p className="mb-3 font-bold text-pomodoro-red text-xs uppercase tracking-[0.18em]">
          {isPaused ? 'Paused' : 'Focus session running'}
        </p>
        <h1
          className="mb-3 font-bold text-6xl tabular-nums leading-none tracking-[-0.055em] sm:text-8xl"
          id="active-session-title"
        >
          {formatRemainingTime(activeTimer.remainingSeconds)}
        </h1>
        <p className="mb-1 font-bold text-lg">{journey.name}</p>
        <p className="mb-0 text-ink/65">{nextStep?.title ?? 'Focused session'}</p>
        <p className="sr-only" role="status">
          {isPaused ? 'Focus session paused' : 'Focus session running'}
        </p>
      </section>
    </FocusLayout>
  );
}

export function SelectionDialog({
  description,
  label,
  title,
  children,
}: {
  description: string;
  label: string;
  title: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="link" className="h-11 px-0 text-ink/60">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-ink/20 shadow-[0_16px_48px_rgba(25,24,22,0.16)]">
        <DialogHeader>
          <DialogTitle className="pr-10 font-bold text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">{children(() => setOpen(false))}</div>
      </DialogContent>
    </Dialog>
  );
}

function DurationOption({
  checked,
  description,
  label,
  value,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  value: DurationChoice;
  onChange: (value: DurationChoice) => void;
}) {
  return (
    <label
      className={cn(
        'relative flex min-h-18 cursor-pointer flex-col justify-between border-2 p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 [@media(max-height:680px)]:min-h-12 [@media(max-height:680px)]:p-2',
        checked ? 'border-ink bg-ink text-paper' : 'border-ink/25 bg-paper text-ink'
      )}
    >
      <input
        type="radio"
        name="duration"
        value={value}
        checked={checked}
        className="sr-only"
        onChange={() => onChange(value)}
      />
      <span className="font-bold text-base leading-none sm:text-xl">{label}</span>
      <span className={cn('text-xs', checked ? 'text-paper/65' : 'text-ink/55')}>
        {description}
      </span>
      {checked ? (
        <Check aria-hidden="true" className="absolute top-2 right-2 size-3 text-pomodoro-red" />
      ) : null}
    </label>
  );
}

function ProgressPreview({ minutes, journeyName }: { minutes: number; journeyName: string }) {
  const previewMinutes = Math.min(minutes, MINUTES_PER_POMODORO);
  const isComplete = previewMinutes === MINUTES_PER_POMODORO;

  return (
    <div className="flex items-center gap-3 border-pomodoro-red border-l-2 pl-3">
      <PomodoroBlock
        state={isComplete ? 'complete' : 'partial'}
        fraction={previewMinutes / MINUTES_PER_POMODORO}
        label={`${previewMinutes} focused minutes preview`}
        className="size-6 min-h-6 min-w-6"
      />
      <p className="mb-0 text-ink/65 text-xs leading-relaxed">
        <span className="font-bold text-ink">25 focused minutes fills one pomodoro block.</span>{' '}
        This session adds {minutes} minutes to {journeyName}.
      </p>
    </div>
  );
}

function TimerSetup({ state, search }: { state: AppState; search: FocusSearch }) {
  const navigate = useNavigate({ from: '/focus/' });
  const startInFlight = useRef(false);
  const [durationChoice, setDurationChoice] = useState<DurationChoice>('25');
  const [customMinutes, setCustomMinutes] = useState('');
  const [customTouched, setCustomTouched] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selection = resolveFocusSelection(state, search);

  if (!selection) return <Navigate to="/onboarding/journey" replace />;

  const { journey, nextStep } = selection;
  const selectableJourneys = state.journeys.filter(({ status }) => status === 'active');
  const selectableNextSteps = getSelectableNextSteps(state, journey.id);
  const customError = getCustomDurationError(customMinutes);
  const selectedMinutes =
    durationChoice === 'custom'
      ? customError === null
        ? Number(customMinutes)
        : null
      : Number(durationChoice);
  const visibleCustomError = durationChoice === 'custom' && customTouched ? customError : null;

  function chooseJourney(selectedJourney: Journey) {
    const selectedNextStep = getSelectableNextSteps(state, selectedJourney.id).find(
      ({ status }) => status === 'current'
    );

    setSaveError(null);
    void navigate({
      replace: true,
      search: {
        journeyId: selectedJourney.id,
        nextStepId: selectedNextStep?.id,
      },
    });
  }

  function chooseNextStep(selectedNextStep: NextStep) {
    setSaveError(null);
    void navigate({
      replace: true,
      search: { journeyId: journey.id, nextStepId: selectedNextStep.id },
    });
  }

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCustomTouched(true);
    setSaveError(null);

    if (startInFlight.current || selectedMinutes === null) return;

    if (!nextStep) {
      setSaveError('Choose an existing Next step before starting a focus session.');
      return;
    }

    startInFlight.current = true;
    setIsStarting(true);

    const startedAt = new Date().toISOString();
    const randomId = globalThis.crypto?.randomUUID?.() ?? startedAt.replace(/[^0-9]/g, '');
    const records = createFocusSessionRecords({
      journeyId: journey.id,
      nextStepId: nextStep.id,
      plannedMinutes: selectedMinutes,
      sessionId: `session-${randomId}`,
      startedAt,
    });
    const result = appRepository.startFocusSession(records.session, records.activeTimer);

    if (result.status === 'saved' && result.state.activeTimer?.sessionId === records.session.id) {
      return;
    }

    startInFlight.current = false;
    setIsStarting(false);
    setSaveError(
      result.status === 'saved'
        ? 'Another focus session is already active. Reload to restore it.'
        : 'Your focus session could not be started. Nothing was recorded. Try again.'
    );
  }

  return (
    <FocusLayout className="items-start py-4 sm:py-6 lg:items-center">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14 [@media(max-height:680px)]:gap-2">
        <aside className="border-ink border-b pb-4 lg:border-r lg:border-b-0 lg:pr-12 lg:pb-0 [@media(max-height:680px)]:pb-2">
          <p className="mb-2 font-bold text-pomodoro-red text-xs uppercase tracking-[0.18em]">
            Ready when you are
          </p>
          <h1 className="mb-2 max-w-[13ch] font-bold text-3xl leading-[1.02] tracking-[-0.045em] sm:text-4xl lg:text-6xl [@media(max-height:680px)]:mb-0 [@media(max-height:680px)]:max-w-none [@media(max-height:680px)]:text-xl">
            Start with one focused session.
          </h1>
          <p className="mb-0 text-ink/60 text-sm [@media(max-height:620px)]:hidden">
            Everything is set. Review it once, then begin.
          </p>
        </aside>

        <form noValidate onSubmit={handleStart} className="min-w-0">
          <div className="grid gap-2 border-ink border-y py-2">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-0 font-bold text-[0.65rem] text-ink/50 uppercase tracking-[0.14em]">
                  Journey
                </p>
                <p className="mb-0 truncate font-bold text-base">{journey.name}</p>
              </div>
              <SelectionDialog
                label="Change Journey"
                title="Choose a Journey"
                description="Select where this focus session should add progress."
              >
                {(close) =>
                  selectableJourneys.map((candidate) => (
                    <Button
                      key={candidate.id}
                      type="button"
                      variant="outline"
                      className="h-auto min-h-11 justify-between whitespace-normal px-3 py-2 text-left"
                      aria-pressed={candidate.id === journey.id}
                      onClick={() => {
                        close();
                        chooseJourney(candidate);
                      }}
                    >
                      <span>{candidate.name}</span>
                      {candidate.id === journey.id ? <Check aria-hidden="true" /> : null}
                    </Button>
                  ))
                }
              </SelectionDialog>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-4 border-ink/15 border-t pt-2">
              <div className="min-w-0">
                <p className="mb-0 font-bold text-[0.65rem] text-ink/50 uppercase tracking-[0.14em]">
                  Current Next step
                </p>
                <p className="mb-0 line-clamp-2 font-bold text-sm">
                  {nextStep?.title ?? 'No current Next step'}
                </p>
              </div>
              <SelectionDialog
                label="Change Next step"
                title="Choose a Next step"
                description="Select an existing action for this session."
              >
                {(close) =>
                  selectableNextSteps.length > 0 ? (
                    selectableNextSteps.map((candidate) => (
                      <Button
                        key={candidate.id}
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 justify-between whitespace-normal px-3 py-2 text-left"
                        aria-pressed={candidate.id === nextStep?.id}
                        onClick={() => {
                          close();
                          chooseNextStep(candidate);
                        }}
                      >
                        <span>{candidate.title}</span>
                        {candidate.id === nextStep?.id ? <Check aria-hidden="true" /> : null}
                      </Button>
                    ))
                  ) : (
                    <p className="mb-0 text-ink/60 text-sm">
                      This Journey has no available Next steps.
                    </p>
                  )
                }
              </SelectionDialog>
            </div>
          </div>

          <fieldset className="mt-4 [@media(max-height:680px)]:mt-2">
            <legend className="mb-2 font-bold text-xs uppercase tracking-[0.14em]">Duration</legend>
            <div className="grid grid-cols-3 gap-2">
              <DurationOption
                value="25"
                label="25"
                description="minutes"
                checked={durationChoice === '25'}
                onChange={setDurationChoice}
              />
              <DurationOption
                value="50"
                label="50"
                description="minutes"
                checked={durationChoice === '50'}
                onChange={setDurationChoice}
              />
              <DurationOption
                value="custom"
                label="Custom"
                description="duration"
                checked={durationChoice === 'custom'}
                onChange={setDurationChoice}
              />
            </div>
          </fieldset>

          {durationChoice === 'custom' ? (
            <div className="mt-3">
              <label className="mb-1 block font-bold text-xs" htmlFor="custom-duration">
                Minutes
              </label>
              <Input
                id="custom-duration"
                name="customDuration"
                type="number"
                inputMode="numeric"
                min={MIN_CUSTOM_MINUTES}
                max={MAX_CUSTOM_MINUTES}
                step="1"
                value={customMinutes}
                aria-invalid={visibleCustomError !== null}
                aria-describedby={visibleCustomError ? 'custom-duration-error' : undefined}
                className="h-11 rounded-none border-2 border-ink"
                onBlur={() => setCustomTouched(true)}
                onChange={(event) => {
                  setCustomMinutes(event.target.value);
                  setSaveError(null);
                }}
              />
              {visibleCustomError ? (
                <p
                  className="mt-1 mb-0 font-bold text-pomodoro-red text-xs"
                  id="custom-duration-error"
                  role="alert"
                >
                  {visibleCustomError}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 [@media(max-height:680px)]:mt-2">
            <ProgressPreview minutes={selectedMinutes ?? 25} journeyName={journey.name} />
          </div>

          {saveError ? (
            <p className="mt-3 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
              {saveError}
            </p>
          ) : null}

          <PrimaryButton
            type="submit"
            className="mt-4 w-full shadow-[4px_4px_0_var(--ink)] [@media(max-height:680px)]:mt-2"
            disabled={isStarting || selectedMinutes === null || nextStep === null}
          >
            {isStarting ? <Clock3 aria-hidden="true" /> : <Play aria-hidden="true" />}
            {isStarting ? 'Starting session…' : 'Start focus session'}
          </PrimaryButton>
          <p className="mt-2 mb-0 text-center font-bold text-[0.65rem] text-ink/45 uppercase tracking-[0.13em] [@media(max-height:680px)]:hidden">
            {selectedMinutes ?? 'Custom'} minutes · {journey.name}
          </p>
        </form>
      </div>
    </FocusLayout>
  );
}

export function FocusSessionScreen({ search }: { search: FocusSearch }) {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <FocusLayout>
        <LoadingState label="Loading focus setup" />
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

  if (hydration.state.activeTimer !== null) {
    return <ActiveSessionState state={hydration.state} />;
  }

  return <TimerSetup state={hydration.state} search={search} />;
}
