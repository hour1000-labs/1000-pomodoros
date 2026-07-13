import type { FocusSession, Journey } from './models'

export const MINIMUM_FOCUSED_MINUTES = 5
export const POMODORO_MINUTES = 25

export interface PomodoroProgress {
  focusedMinutes: number
  totalPomodoros: number
  fullPomodoros: number
  partialMinutes: number
  partialPomodoro: number
}

export interface JourneyProgress extends PomodoroProgress {
  targetMinutes: number
  targetPomodoros: number
  targetProgress: number
  targetPercentage: number
}

function normalizeFocusedMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0
  }

  return minutes
}

export function isCountableFocusSession(session: FocusSession) {
  return (
    session.status === 'completed' &&
    normalizeFocusedMinutes(session.focusedMinutes) >=
      MINIMUM_FOCUSED_MINUTES
  )
}

export function getCountableFocusSessions(
  sessions: readonly FocusSession[],
  journeyId?: string,
) {
  return sessions.filter(
    (session) =>
      isCountableFocusSession(session) &&
      (journeyId === undefined || session.journeyId === journeyId),
  )
}

export function getFocusedMinutes(
  sessions: readonly FocusSession[],
  journeyId?: string,
) {
  return getCountableFocusSessions(sessions, journeyId).reduce(
    (total, session) => total + normalizeFocusedMinutes(session.focusedMinutes),
    0,
  )
}

export function getSessionsForLocalDate(
  sessions: readonly FocusSession[],
  date: Date,
) {
  return sessions.filter((session) => {
    if (session.endedAt === null) return false

    const endedAt = new Date(session.endedAt)

    return (
      !Number.isNaN(endedAt.getTime()) &&
      endedAt.getFullYear() === date.getFullYear() &&
      endedAt.getMonth() === date.getMonth() &&
      endedAt.getDate() === date.getDate()
    )
  })
}

export function derivePomodoroProgress(focusedMinutes: number): PomodoroProgress {
  const normalizedMinutes = normalizeFocusedMinutes(focusedMinutes)
  const fullPomodoros = Math.floor(normalizedMinutes / POMODORO_MINUTES)
  const partialMinutes = normalizedMinutes % POMODORO_MINUTES

  return {
    focusedMinutes: normalizedMinutes,
    totalPomodoros: normalizedMinutes / POMODORO_MINUTES,
    fullPomodoros,
    partialMinutes,
    partialPomodoro: partialMinutes / POMODORO_MINUTES,
  }
}

export function deriveProgressFromSessions(
  sessions: readonly FocusSession[],
  journeyId?: string,
) {
  return derivePomodoroProgress(getFocusedMinutes(sessions, journeyId))
}

export function deriveTargetProgress(
  focusedMinutes: number,
  targetMinutes: number,
): JourneyProgress {
  const progress = derivePomodoroProgress(focusedMinutes)
  const normalizedTargetMinutes = Math.max(0, targetMinutes)
  const targetProgress =
    normalizedTargetMinutes === 0
      ? 0
      : Math.min(1, progress.focusedMinutes / normalizedTargetMinutes)

  return {
    ...progress,
    targetMinutes: normalizedTargetMinutes,
    targetPomodoros: normalizedTargetMinutes / POMODORO_MINUTES,
    targetProgress,
    targetPercentage: targetProgress * 100,
  }
}

export function deriveJourneyProgress(
  journey: Journey,
  sessions: readonly FocusSession[],
): JourneyProgress {
  return deriveTargetProgress(
    getFocusedMinutes(sessions, journey.id),
    journey.targetMinutes,
  )
}
