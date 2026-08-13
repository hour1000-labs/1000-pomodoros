import {
  compareLocalDateKeys,
  getLocalDateKey,
  type LocalDateKey,
  normalizeLocalMonth,
  parseCanonicalTimestamp,
} from '@/lib/local-date';
import type { AppState, FocusSession } from '@/lib/models';
import { derivePomodoroProgress, isCountableFocusSession, POMODORO_MINUTES } from '@/lib/progress';

export interface MonthlyPomodoroActivityDay {
  dateKey: LocalDateKey;
  focusedMinutes: number;
  totalPomodoros: number;
  fullPomodoros: number;
  partialPomodoro: number;
}

export interface MonthlyPomodoroActivityData {
  year: number;
  monthIndex: number;
  focusedMinutes: number;
  totalPomodoros: number;
  days: MonthlyPomodoroActivityDay[];
}

function getDuplicatedSessionIds(sessions: readonly FocusSession[]) {
  const seenIds = new Set<string>();
  const duplicatedIds = new Set<string>();

  for (const session of sessions) {
    if (typeof session.id !== 'string' || session.id.trim().length === 0) continue;

    if (seenIds.has(session.id)) {
      duplicatedIds.add(session.id);
    } else {
      seenIds.add(session.id);
    }
  }

  return duplicatedIds;
}

function getExistingJourneyIds(state: AppState) {
  const journeyIds = new Set<string>();

  for (const journey of state.journeys) {
    if (typeof journey.id === 'string' && journey.id.trim().length > 0) {
      journeyIds.add(journey.id);
    }
  }

  return journeyIds;
}

function createEmptyActivityData(year: number, monthIndex: number): MonthlyPomodoroActivityData {
  return {
    year,
    monthIndex,
    focusedMinutes: 0,
    totalPomodoros: 0,
    days: [],
  };
}

export function deriveMonthlyPomodoroActivity(
  state: AppState,
  options: { year: number; monthIndex: number; now: Date; journeyId?: string }
): MonthlyPomodoroActivityData {
  const month = normalizeLocalMonth(options.year, options.monthIndex);
  if (month === null) {
    return createEmptyActivityData(options.year, options.monthIndex);
  }

  const emptyActivity = createEmptyActivityData(month.year, month.monthIndex);
  const todayDateKey = getLocalDateKey(options.now);
  if (todayDateKey === null) return emptyActivity;

  const existingJourneyIds = getExistingJourneyIds(state);
  if (options.journeyId !== undefined && !existingJourneyIds.has(options.journeyId)) {
    return emptyActivity;
  }

  const duplicatedSessionIds = getDuplicatedSessionIds(state.focusSessions);
  const focusedMinutesByDate = new Map<LocalDateKey, number>();

  for (const session of state.focusSessions) {
    if (
      typeof session.id !== 'string' ||
      session.id.trim().length === 0 ||
      duplicatedSessionIds.has(session.id) ||
      !existingJourneyIds.has(session.journeyId) ||
      (options.journeyId !== undefined && session.journeyId !== options.journeyId) ||
      (session.source !== 'timer' && session.source !== 'manual') ||
      !isCountableFocusSession(session)
    ) {
      continue;
    }

    const endedAt = parseCanonicalTimestamp(session.endedAt);
    if (endedAt === null) continue;

    const dateKey = getLocalDateKey(endedAt);
    if (
      dateKey === null ||
      compareLocalDateKeys(dateKey, todayDateKey) > 0 ||
      endedAt.getFullYear() !== month.year ||
      endedAt.getMonth() !== month.monthIndex
    ) {
      continue;
    }

    focusedMinutesByDate.set(
      dateKey,
      (focusedMinutesByDate.get(dateKey) ?? 0) + session.focusedMinutes
    );
  }

  const days = [...focusedMinutesByDate.entries()]
    .sort(([leftDateKey], [rightDateKey]) => compareLocalDateKeys(leftDateKey, rightDateKey))
    .map(([dateKey, focusedMinutes]): MonthlyPomodoroActivityDay => {
      const progress = derivePomodoroProgress(focusedMinutes);

      return {
        dateKey,
        focusedMinutes: progress.focusedMinutes,
        totalPomodoros: progress.totalPomodoros,
        fullPomodoros: progress.fullPomodoros,
        partialPomodoro: progress.partialPomodoro,
      };
    });
  const focusedMinutes = days.reduce((total, day) => total + day.focusedMinutes, 0);

  return {
    year: month.year,
    monthIndex: month.monthIndex,
    focusedMinutes,
    totalPomodoros: focusedMinutes / POMODORO_MINUTES,
    days,
  };
}
