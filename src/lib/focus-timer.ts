import type { ActiveTimer, FocusSession } from './models';

const MILLISECONDS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

export function getRemainingSeconds(targetEndAt: string | null, now = Date.now()) {
  if (targetEndAt === null) return 0;

  const targetTime = new Date(targetEndAt).getTime();
  if (!Number.isFinite(targetTime)) return 0;

  return Math.max(0, Math.ceil((targetTime - now) / MILLISECONDS_PER_SECOND));
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
