import type { ActiveTimer, FocusSession } from './models';

const MILLISECONDS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
export const MINIMUM_COUNTED_FOCUS_SECONDS = 5 * SECONDS_PER_MINUTE;
export const DEFAULT_DOCUMENT_TITLE = '1000 Pomodoros';

export function getRemainingSeconds(targetEndAt: string | null, now = Date.now()) {
  if (targetEndAt === null) return 0;

  const targetTime = new Date(targetEndAt).getTime();
  if (!Number.isFinite(targetTime)) return 0;

  return Math.max(0, Math.ceil((targetTime - now) / MILLISECONDS_PER_SECOND));
}

export function formatRemainingTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function formatFocusDocumentTitle(remainingSeconds: number) {
  return `${formatRemainingTime(remainingSeconds)} — ${DEFAULT_DOCUMENT_TITLE}`;
}

export function pauseRunningFocusSession(
  session: FocusSession,
  activeTimer: ActiveTimer,
  pausedAt: string
): { session: FocusSession; activeTimer: ActiveTimer } {
  const remainingSeconds = getRemainingSeconds(
    activeTimer.targetEndAt,
    new Date(pausedAt).getTime()
  );
  const elapsedSeconds = Math.max(
    0,
    Math.min(activeTimer.remainingSeconds, activeTimer.remainingSeconds - remainingSeconds)
  );

  return {
    session: { ...session, status: 'paused' },
    activeTimer: {
      ...activeTimer,
      status: 'paused',
      remainingSeconds,
      accumulatedFocusedSeconds: activeTimer.accumulatedFocusedSeconds + elapsedSeconds,
      targetEndAt: null,
      pausedAt,
    },
  };
}

export function resumePausedFocusSession(
  session: FocusSession,
  activeTimer: ActiveTimer,
  resumedAt: string
): { session: FocusSession; activeTimer: ActiveTimer } {
  const resumedAtTime = new Date(resumedAt).getTime();
  const safeResumedAtTime = Number.isFinite(resumedAtTime) ? resumedAtTime : Date.now();

  return {
    session: { ...session, status: 'running' },
    activeTimer: {
      ...activeTimer,
      status: 'running',
      targetEndAt: new Date(
        safeResumedAtTime + activeTimer.remainingSeconds * MILLISECONDS_PER_SECOND
      ).toISOString(),
      pausedAt: null,
    },
  };
}

export function canFinishPausedFocusSession(activeTimer: ActiveTimer) {
  return activeTimer.accumulatedFocusedSeconds >= MINIMUM_COUNTED_FOCUS_SECONDS;
}

export function completePausedFocusSession(
  session: FocusSession,
  activeTimer: ActiveTimer,
  completedAt: string
): FocusSession {
  const focusedSeconds = Math.min(
    session.plannedMinutes * SECONDS_PER_MINUTE,
    activeTimer.accumulatedFocusedSeconds
  );

  return {
    ...session,
    focusedMinutes: focusedSeconds / SECONDS_PER_MINUTE,
    status: 'completed',
    endedAt: completedAt,
  };
}

export function cancelPausedFocusSession(session: FocusSession, cancelledAt: string): FocusSession {
  return {
    ...session,
    focusedMinutes: 0,
    status: 'cancelled',
    endedAt: cancelledAt,
  };
}

export function completeRunningFocusSession(
  session: FocusSession,
  activeTimer: ActiveTimer,
  completedAt: string
): FocusSession {
  const focusedSeconds = Math.min(
    session.plannedMinutes * SECONDS_PER_MINUTE,
    activeTimer.accumulatedFocusedSeconds + activeTimer.remainingSeconds
  );

  return {
    ...session,
    focusedMinutes: focusedSeconds / SECONDS_PER_MINUTE,
    status: 'completed',
    endedAt: activeTimer.targetEndAt ?? completedAt,
  };
}
