import { Navigate, useBlocker, useNavigate, useRouterState } from '@tanstack/react-router';
import { Check, Clock3, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/shared/brand-mark';
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
import { playFocusCompletionSound } from '@/lib/focus-sound';
import {
  canFinishPausedFocusSession,
  DEFAULT_DOCUMENT_TITLE,
  formatFocusDocumentTitle,
  formatRemainingTime,
  getRemainingSeconds,
} from '@/lib/focus-timer';
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

interface CompletionSoundToggleProps {
  className?: string;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
}

function CompletionSoundToggle({
  className,
  onSoundEnabledChange,
  soundEnabled,
}: CompletionSoundToggleProps) {
  const label = soundEnabled ? 'Mute completion sound' : 'Unmute completion sound';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      aria-pressed={!soundEnabled}
      title={label}
      onClick={() => onSoundEnabledChange(!soundEnabled)}
    >
      {soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </Button>
  );
}

function PausedSessionState({
  activeTimer,
  journey,
  nextStep,
  onCancelled,
  onSoundEnabledChange,
  session,
  soundEnabled,
}: {
  activeTimer: ActiveTimer;
  journey: Journey;
  nextStep: NextStep | undefined;
  onCancelled: () => void;
  onSoundEnabledChange: (enabled: boolean) => void;
  session: FocusSession;
  soundEnabled: boolean;
}) {
  const navigate = useNavigate({ from: '/focus/' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('Focus session paused.');
  const actionInFlight = useRef(false);
  const canFinish = canFinishPausedFocusSession(activeTimer);
  const elapsedFraction = Math.max(
    0,
    Math.min(1, activeTimer.accumulatedFocusedSeconds / (session.plannedMinutes * 60))
  );
  const ringStyle = {
    background: `conic-gradient(var(--pomodoro-red) ${elapsedFraction * 100}%, color-mix(in srgb, var(--ink) 12%, var(--paper)) 0)`,
  };

  useEffect(() => {
    document.title = formatFocusDocumentTitle(activeTimer.remainingSeconds);
  }, [activeTimer.remainingSeconds]);

  useEffect(() => {
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, []);

  function resumeSession() {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);

    const result = appRepository.resumeFocusSession(session.id, new Date().toISOString());
    const resumed =
      result.status === 'saved' &&
      result.state.activeTimer?.sessionId === session.id &&
      result.state.activeTimer.status === 'running' &&
      result.state.focusSessions.find(({ id }) => id === session.id)?.status === 'running';

    if (resumed) {
      setAnnouncement('Focus session resumed.');
      return;
    }

    actionInFlight.current = false;
    setActionError("We couldn't resume the timer. It is still paused. Try again.");
  }

  function finishSessionEarly() {
    if (actionInFlight.current || !canFinish) return;
    actionInFlight.current = true;
    setActionError(null);

    const result = appRepository.finishPausedFocusSession(session.id, new Date().toISOString());
    const completed =
      result.status === 'saved' &&
      result.state.activeTimer === null &&
      result.state.lastCompletedSessionId === session.id;

    if (completed) {
      setAnnouncement('Focus session finished early.');
      void navigate({
        to: '/focus/complete',
        search: { sessionId: session.id },
        replace: true,
      });
      return;
    }

    actionInFlight.current = false;
    setActionError("We couldn't save your progress. Keep this screen open and try again.");
  }

  function cancelSession() {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);

    const result = appRepository.cancelFocusSession(session.id, new Date().toISOString());
    const cancelled =
      result.status === 'saved' &&
      result.state.activeTimer === null &&
      result.state.focusSessions.find(({ id }) => id === session.id)?.status === 'cancelled';

    if (cancelled) {
      onCancelled();
      return;
    }

    actionInFlight.current = false;
    setActionError("We couldn't cancel the session. It is still paused. Try again.");
  }

  function requestCancellation() {
    const confirmed = globalThis.confirm(
      'Cancel this focus session? This discards its focused time and adds no Journey progress.'
    );

    if (confirmed) cancelSession();
  }

  return (
    <FocusLayout className="relative overflow-hidden py-5 sm:py-8 [@media(max-height:640px)]:py-4">
      <BrandMark className="absolute top-3 left-4 sm:top-6 sm:left-8 [@media(max-height:640px)]:hidden" />
      <CompletionSoundToggle
        className="absolute top-3 right-3 text-ink/60 hover:text-ink sm:top-6 sm:right-6"
        soundEnabled={soundEnabled}
        onSoundEnabledChange={onSoundEnabledChange}
      />

      <section
        className="grid w-full max-w-xl justify-items-center gap-4 pt-12 text-center sm:gap-5 [@media(max-height:640px)]:gap-3 [@media(max-height:640px)]:pt-0"
        aria-labelledby="active-session-title"
      >
        <div className="min-w-0 max-w-full">
          <p className="mb-1 truncate font-bold text-base sm:text-lg">{journey.name}</p>
          <p className="mb-0 line-clamp-2 max-w-[min(34rem,88vw)] text-ink/60 text-sm sm:text-base">
            {nextStep?.title ?? 'Focused session'}
          </p>
        </div>

        <div
          className="grid size-[clamp(12rem,min(68vw,43dvh),22rem)] place-items-center rounded-full p-2"
          style={ringStyle}
        >
          <div className="grid size-full place-content-center rounded-full border border-ink/15 bg-paper px-3">
            <p className="mb-3 font-bold text-ink/60 text-sm">Paused</p>
            <h1
              className="mb-2 font-bold text-[clamp(3.25rem,14vw,6.5rem)] tabular-nums leading-none tracking-[-0.065em]"
              id="active-session-title"
            >
              {formatRemainingTime(activeTimer.remainingSeconds)}
            </h1>
            <p className="mb-0 text-ink/60 text-sm">Time remaining</p>
          </div>
        </div>

        <div className="grid w-full max-w-md gap-3">
          <PrimaryButton type="button" className="w-full" onClick={resumeSession}>
            <Play aria-hidden="true" />
            Resume
          </PrimaryButton>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full border-ink/50 font-bold"
            aria-describedby={canFinish ? undefined : 'finish-early-guidance'}
            disabled={!canFinish}
            onClick={finishSessionEarly}
          >
            Finish early
          </Button>
          <Button
            type="button"
            variant="link"
            className="h-11 text-ink/60"
            onClick={requestCancellation}
          >
            Cancel session
          </Button>
        </div>

        {!canFinish ? (
          <p className="mb-0 max-w-reading text-ink/60 text-sm" id="finish-early-guidance">
            Finish early becomes available after 5 focused minutes.
          </p>
        ) : null}

        {actionError ? (
          <p className="mb-0 max-w-reading font-bold text-pomodoro-red text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>
    </FocusLayout>
  );
}

function getInitialTimerAnnouncement(activeTimer: ActiveTimer, remainingSeconds: number) {
  if (remainingSeconds <= 60) return '1 minute remaining.';
  if (remainingSeconds <= 300) return '5 minutes remaining.';
  return activeTimer.accumulatedFocusedSeconds > 0
    ? 'Focus session resumed.'
    : 'Focus session running.';
}

function RunningSessionState({
  activeTimer,
  journey,
  nextStep,
  session,
  onSoundEnabledChange,
  soundEnabled,
}: {
  activeTimer: ActiveTimer;
  journey: Journey;
  nextStep: NextStep | undefined;
  session: FocusSession;
  onSoundEnabledChange: (enabled: boolean) => void;
  soundEnabled: boolean;
}) {
  const navigate = useNavigate({ from: '/focus/' });
  const initialRemaining = getRemainingSeconds(activeTimer.targetEndAt);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemaining);
  const [announcement, setAnnouncement] = useState(() =>
    getInitialTimerAnnouncement(activeTimer, initialRemaining)
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const announcedThresholds = useRef(
    new Set([...(initialRemaining <= 300 ? [300] : []), ...(initialRemaining <= 60 ? [60] : [])])
  );
  const completionInFlight = useRef(false);
  const completionSoundPlayed = useRef(false);
  const pauseInFlight = useRef(false);
  const allowNavigation = useRef(false);

  useEffect(() => {
    document.title = formatFocusDocumentTitle(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, []);

  useBlocker({
    enableBeforeUnload: true,
    shouldBlockFn: () => {
      if (allowNavigation.current) return false;

      return !globalThis.confirm(
        'Leave this focus screen? The timer will keep running. You can return anytime.'
      );
    },
  });

  const completeSession = useCallback(
    (completedAt: string) => {
      if (completionInFlight.current) return;
      completionInFlight.current = true;
      setActionError(null);

      const result = appRepository.completeRunningFocusSession(session.id, completedAt);
      const completed =
        result.status === 'saved' &&
        result.state.activeTimer === null &&
        result.state.lastCompletedSessionId === session.id;

      if (!completed) {
        completionInFlight.current = false;
        setActionError(
          "We couldn't save this completed session. Keep this screen open and try again."
        );
        return;
      }

      if (soundEnabled && !completionSoundPlayed.current) {
        completionSoundPlayed.current = true;
        void playFocusCompletionSound().catch(() => undefined);
      }

      allowNavigation.current = true;
      setAnnouncement('Focus session complete.');
      void navigate({
        to: '/focus/complete',
        search: { sessionId: session.id },
        replace: true,
      });
    },
    [navigate, session.id, soundEnabled]
  );

  const refreshTimer = useCallback(() => {
    const now = Date.now();
    const nextRemaining = getRemainingSeconds(activeTimer.targetEndAt, now);

    setRemainingSeconds((previousRemaining) => {
      if (
        previousRemaining > 300 &&
        nextRemaining <= 300 &&
        !announcedThresholds.current.has(300)
      ) {
        announcedThresholds.current.add(300);
        setAnnouncement('5 minutes remaining.');
      }

      if (previousRemaining > 60 && nextRemaining <= 60 && !announcedThresholds.current.has(60)) {
        announcedThresholds.current.add(60);
        setAnnouncement('1 minute remaining.');
      }

      return nextRemaining;
    });

    if (nextRemaining === 0) {
      completeSession(new Date(now).toISOString());
    }
  }, [activeTimer.targetEndAt, completeSession]);

  useEffect(() => {
    refreshTimer();
    const interval = globalThis.setInterval(refreshTimer, 1_000);

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') refreshTimer();
    }

    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      globalThis.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshTimer]);

  useEffect(() => {
    const supported =
      document.fullscreenEnabled === true &&
      typeof document.documentElement.requestFullscreen === 'function';
    setFullscreenSupported(supported);

    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  function pauseSession() {
    if (pauseInFlight.current) return;
    pauseInFlight.current = true;
    setActionError(null);

    const pausedAt = new Date().toISOString();

    if (getRemainingSeconds(activeTimer.targetEndAt, new Date(pausedAt).getTime()) === 0) {
      pauseInFlight.current = false;
      completeSession(pausedAt);
      return;
    }

    const result = appRepository.pauseFocusSession(session.id, pausedAt);
    const paused =
      result.status === 'saved' &&
      result.state.activeTimer?.sessionId === session.id &&
      result.state.activeTimer.status === 'paused';

    if (!paused) {
      pauseInFlight.current = false;
      setActionError("We couldn't pause the timer. It is still running. Try again.");
    }
  }

  async function toggleFullscreen() {
    setActionError(null);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setActionError("We couldn't change fullscreen mode in this browser.");
    }
  }

  const elapsedFraction = Math.max(
    0,
    Math.min(1, 1 - remainingSeconds / (session.plannedMinutes * 60))
  );
  const ringStyle = {
    background: `conic-gradient(var(--pomodoro-red) ${elapsedFraction * 100}%, color-mix(in srgb, var(--ink) 10%, var(--paper)) 0)`,
  };

  return (
    <FocusLayout className="relative overflow-hidden py-5 sm:py-8 [@media(max-height:500px)]:py-4">
      <div className="absolute top-3 right-3 flex items-center gap-1 sm:top-6 sm:right-6">
        <CompletionSoundToggle
          className="text-ink/60 hover:text-ink"
          soundEnabled={soundEnabled}
          onSoundEnabledChange={onSoundEnabledChange}
        />
        {fullscreenSupported ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 px-3 text-ink/60 hover:text-ink"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            <span className="hidden sm:inline [@media(max-height:500px)]:hidden">
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </span>
          </Button>
        ) : null}
      </div>

      <section
        className="grid w-full max-w-3xl justify-items-center gap-4 text-center sm:gap-6 [@media(max-height:500px)]:gap-3"
        aria-labelledby="running-timer-title"
      >
        <div className="min-w-0 max-w-full [@media(max-height:500px)]:max-w-md">
          <p className="mb-1 truncate font-bold text-base sm:text-lg">{journey.name}</p>
          <p className="mb-0 line-clamp-2 max-w-[min(34rem,88vw)] text-ink/60 text-sm sm:text-base">
            {nextStep?.title ?? 'Focused session'}
          </p>
        </div>

        <div
          className="grid size-[clamp(12.5rem,min(70vw,50dvh),25rem)] place-items-center rounded-full p-2"
          style={ringStyle}
        >
          <div className="grid size-full place-content-center rounded-full border border-ink/15 bg-paper px-3 text-ink">
            <p className="mb-2 text-ink/60 text-sm">Time remaining</p>
            <h1
              className="mb-0 font-bold text-[clamp(3.4rem,14vw,7.5rem)] tabular-nums leading-none tracking-[-0.065em]"
              id="running-timer-title"
            >
              {formatRemainingTime(remainingSeconds)}
            </h1>
          </div>
        </div>

        <PrimaryButton type="button" className="min-w-36" onClick={pauseSession}>
          <Pause aria-hidden="true" />
          Pause
        </PrimaryButton>

        {actionError ? (
          <p className="mb-0 max-w-reading font-bold text-pomodoro-red text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>
    </FocusLayout>
  );
}

function ActiveSessionState({ state, onCancelled }: { state: AppState; onCancelled: () => void }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const activeTimer = state.activeTimer;
  const session = activeTimer
    ? state.focusSessions.find(({ id }) => id === activeTimer.sessionId)
    : undefined;
  const journey = session ? state.journeys.find(({ id }) => id === session.journeyId) : undefined;
  const nextStep = session?.nextStepId
    ? state.nextSteps.find(({ id }) => id === session.nextStepId)
    : undefined;

  if (!activeTimer || !session || !journey) return null;

  if (activeTimer.status === 'paused') {
    return (
      <PausedSessionState
        activeTimer={activeTimer}
        journey={journey}
        nextStep={nextStep}
        onCancelled={onCancelled}
        onSoundEnabledChange={setSoundEnabled}
        session={session}
        soundEnabled={soundEnabled}
      />
    );
  }

  return (
    <RunningSessionState
      activeTimer={activeTimer}
      journey={journey}
      nextStep={nextStep}
      session={session}
      onSoundEnabledChange={setSoundEnabled}
      soundEnabled={soundEnabled}
    />
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
        'relative flex min-h-18 cursor-pointer flex-col justify-between rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 [@media(max-height:680px)]:min-h-12 [@media(max-height:680px)]:p-2',
        checked ? 'border-ink bg-ink text-paper' : 'border-ink/50 bg-paper text-ink'
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
      <span className={cn('text-xs', checked ? 'text-paper/65' : 'text-ink/60')}>
        {description}
      </span>
      {checked ? (
        <Check aria-hidden="true" className="absolute top-2 right-2 size-3 text-paper" />
      ) : null}
    </label>
  );
}

function ProgressPreview({ minutes, journeyName }: { minutes: number; journeyName: string }) {
  const previewMinutes = Math.min(minutes, MINUTES_PER_POMODORO);
  const isComplete = previewMinutes === MINUTES_PER_POMODORO;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink/15 p-3">
      <PomodoroBlock
        state={isComplete ? 'complete' : 'partial'}
        fraction={previewMinutes / MINUTES_PER_POMODORO}
        label={`Pomodoro preview: ${Math.round(
          (previewMinutes / MINUTES_PER_POMODORO) * 100
        )}% filled`}
        className="size-6 min-h-6 min-w-6"
      />
      <p className="mb-0 min-w-0 text-ink/65 text-xs leading-relaxed [overflow-wrap:anywhere]">
        <span className="font-bold text-ink">1 Pomodoro is 25 focused minutes.</span> This session
        adds {minutes} focused minutes to {journeyName}.
      </p>
    </div>
  );
}

function TimerSetup({
  state,
  search,
  announcement,
}: {
  state: AppState;
  search: FocusSearch;
  announcement: string | null;
}) {
  const navigate = useNavigate({ from: '/focus/' });
  const startInFlight = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [durationChoice, setDurationChoice] = useState<DurationChoice>('25');
  const [customMinutes, setCustomMinutes] = useState('');
  const [customTouched, setCustomTouched] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selection = resolveFocusSelection(state, search);

  useEffect(() => {
    if (announcement) headingRef.current?.focus();
  }, [announcement]);

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
      setSaveError('Choose a Next step before starting.');
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
        : "We couldn't start your focus session. Nothing was recorded. Try again."
    );
  }

  return (
    <FocusLayout className="items-start py-5 sm:py-8 lg:items-center">
      <div className="mx-auto w-full max-w-2xl">
        <BrandMark className="mb-8 [@media(max-height:680px)]:mb-4" />
        <header className="mb-6 [@media(max-height:680px)]:mb-3">
          <h1
            ref={headingRef}
            tabIndex={announcement ? -1 : undefined}
            className="mb-2 font-bold text-3xl leading-tight tracking-[-0.035em] sm:text-4xl [@media(max-height:680px)]:text-2xl"
          >
            Start a focus session
          </h1>
          <p className="mb-0 text-ink/60 text-sm sm:text-base [@media(max-height:620px)]:hidden">
            Choose what to work on and for how long.
          </p>
        </header>

        <form noValidate onSubmit={handleStart} className="min-w-0">
          <div className="grid gap-3 rounded-xl border border-ink/15 p-4">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 font-bold text-ink/60 text-sm">Journey</p>
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

            <div className="flex min-w-0 items-center justify-between gap-4 border-ink/15 border-t pt-3">
              <div className="min-w-0">
                <p className="mb-1 font-bold text-ink/60 text-sm">Next step</p>
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
            <legend className="mb-2 font-bold text-sm">Duration</legend>
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
                className="h-11 rounded-lg border border-ink/50"
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
            className="mt-4 w-full [@media(max-height:680px)]:mt-2"
            disabled={isStarting || selectedMinutes === null || nextStep === null}
          >
            {isStarting ? <Clock3 aria-hidden="true" /> : <Play aria-hidden="true" />}
            {isStarting ? 'Starting session…' : 'Start focus session'}
          </PrimaryButton>
          {announcement ? (
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {announcement}
            </p>
          ) : null}
        </form>
      </div>
    </FocusLayout>
  );
}

export function FocusSessionScreen({ search }: { search: FocusSearch }) {
  const hydration = useAppState();
  const [setupAnnouncement, setSetupAnnouncement] = useState<string | null>(null);
  const pathname = useRouterState({ select: (routerState) => routerState.location.pathname });

  useEffect(() => {
    if (pathname !== '/focus') document.title = DEFAULT_DOCUMENT_TITLE;
  }, [pathname]);

  if (hydration.status === 'loading') {
    return (
      <FocusLayout>
        <LoadingState label="Loading focus setup" variant="focus" />
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
    return (
      <ActiveSessionState
        state={hydration.state}
        onCancelled={() => setSetupAnnouncement('Focus session cancelled. No progress was added.')}
      />
    );
  }

  return <TimerSetup state={hydration.state} search={search} announcement={setupAnnouncement} />;
}
