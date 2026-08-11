import {
  addLocalDays,
  compareLocalDateKeys,
  getLocalDateKey,
  getLocalMonthDateKeys,
  type LocalDateKey,
  normalizeLocalMonth,
  parseCanonicalTimestamp,
} from './local-date';
import type { FocusSession } from './models';
import { isCountableFocusSession } from './progress';

export const QUALIFYING_DAYS_PER_FREEZE = 7;

export type StreakDayState = 'practiced' | 'freeze-used' | 'missed';
export type StreakTodayState = 'practiced' | 'open' | 'not-started';

export interface StreakDay {
  dateKey: LocalDateKey;
  state: StreakDayState;
  focusedMinutes: number;
  qualifyingSessionCount: number;
  freezeAwarded: boolean;
  currentStreakAfterDay: number;
  freezesAvailableAfterDay: number;
  qualifyingDaysTowardNextFreezeAfterDay: number;
}

export interface StreakSummary {
  asOfDateKey: LocalDateKey | null;
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  qualifyingDaysTowardNextFreeze: number;
  qualifyingDaysUntilNextFreeze: number;
  totalPracticedDays: number;
  totalFreezesEarned: number;
  totalFreezesUsed: number;
  firstPracticedDateKey: LocalDateKey | null;
  todayState: StreakTodayState;
  days: StreakDay[];
  daysByDate: Readonly<Partial<Record<LocalDateKey, StreakDay>>>;
}

export interface StreakMonth {
  year: number;
  monthIndex: number;
  dateKeys: LocalDateKey[];
  practicedDays: number;
  freezesUsed: number;
  focusedMinutes: number;
  daysByDate: Readonly<Partial<Record<LocalDateKey, StreakDay>>>;
}

export type StreakSessionImpactState = 'not-eligible' | 'already-counted' | 'counted' | 'restored';

export interface StreakSessionImpact {
  state: StreakSessionImpactState;
  counted: boolean;
  alreadyCounted: boolean;
  restored: boolean;
  currentStreakBefore: number;
  currentStreakAfter: number;
  longestStreakBefore: number;
  longestStreakAfter: number;
  freezesAvailableBefore: number;
  freezesAvailableAfter: number;
  freezesAvailableDelta: number;
  freezesEarnedDelta: number;
  freezesUsedDelta: number;
  newPersonalBest: boolean;
}

interface PracticedDate {
  focusedMinutes: number;
  qualifyingSessionCount: number;
}

function createEmptySummary(asOfDateKey: LocalDateKey | null): StreakSummary {
  return {
    asOfDateKey,
    currentStreak: 0,
    longestStreak: 0,
    freezesAvailable: 0,
    qualifyingDaysTowardNextFreeze: 0,
    qualifyingDaysUntilNextFreeze: QUALIFYING_DAYS_PER_FREEZE,
    totalPracticedDays: 0,
    totalFreezesEarned: 0,
    totalFreezesUsed: 0,
    firstPracticedDateKey: null,
    todayState: 'not-started',
    days: [],
    daysByDate: {},
  };
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

function getPersistedJourneyIdSet(persistedJourneyIds: readonly string[]) {
  const journeyIds = new Set<string>();

  for (const journeyId of persistedJourneyIds) {
    if (typeof journeyId === 'string' && journeyId.trim().length > 0) {
      journeyIds.add(journeyId);
    }
  }

  return journeyIds;
}

function getEligibleSessionDateKey(
  session: FocusSession,
  persistedJourneyIds: ReadonlySet<string>,
  duplicatedSessionIds: ReadonlySet<string>,
  asOfDateKey: LocalDateKey,
  now: Date
) {
  if (
    typeof session.id !== 'string' ||
    session.id.trim().length === 0 ||
    duplicatedSessionIds.has(session.id) ||
    typeof session.journeyId !== 'string' ||
    session.journeyId.trim().length === 0 ||
    !persistedJourneyIds.has(session.journeyId) ||
    (session.source !== 'timer' && session.source !== 'manual') ||
    !isCountableFocusSession(session)
  ) {
    return null;
  }

  const startedAt = parseCanonicalTimestamp(session.startedAt);
  const endedAt = parseCanonicalTimestamp(session.endedAt);
  if (startedAt === null || endedAt === null || startedAt.getTime() > endedAt.getTime()) {
    return null;
  }

  const dateKey = getLocalDateKey(endedAt);
  if (dateKey === null || compareLocalDateKeys(dateKey, asOfDateKey) > 0) {
    return null;
  }

  if (session.source === 'timer' && endedAt.getTime() > now.getTime()) return null;

  return dateKey;
}

function aggregatePracticedDates(
  sessions: readonly FocusSession[],
  persistedJourneyIds: readonly string[],
  asOfDateKey: LocalDateKey,
  now: Date
) {
  const practicedDates = new Map<LocalDateKey, PracticedDate>();
  const journeyIds = getPersistedJourneyIdSet(persistedJourneyIds);
  const duplicatedSessionIds = getDuplicatedSessionIds(sessions);

  for (const session of sessions) {
    const dateKey = getEligibleSessionDateKey(
      session,
      journeyIds,
      duplicatedSessionIds,
      asOfDateKey,
      now
    );
    if (dateKey === null) continue;

    const previous = practicedDates.get(dateKey);
    practicedDates.set(dateKey, {
      focusedMinutes: (previous?.focusedMinutes ?? 0) + session.focusedMinutes,
      qualifyingSessionCount: (previous?.qualifyingSessionCount ?? 0) + 1,
    });
  }

  return practicedDates;
}

export function deriveStreakSummary(
  sessions: readonly FocusSession[],
  persistedJourneyIds: readonly string[],
  now: Date = new Date()
): StreakSummary {
  const asOfDateKey = getLocalDateKey(now);
  if (asOfDateKey === null) return createEmptySummary(null);

  const practicedDates = aggregatePracticedDates(sessions, persistedJourneyIds, asOfDateKey, now);
  const practicedDateKeys = [...practicedDates.keys()].sort(compareLocalDateKeys);
  const firstPracticedDateKey = practicedDateKeys[0];
  if (firstPracticedDateKey === undefined) return createEmptySummary(asOfDateKey);

  const days: StreakDay[] = [];
  const daysByDate: Partial<Record<LocalDateKey, StreakDay>> = {};
  let currentStreak = 0;
  let longestStreak = 0;
  let freezesAvailable = 0;
  let qualifyingDaysTowardNextFreeze = 0;
  let totalFreezesEarned = 0;
  let totalFreezesUsed = 0;
  let active = false;
  function recordDay(day: StreakDay) {
    days.push(day);
    daysByDate[day.dateKey] = day;
  }

  function closeMissingDatesBefore(previousPracticedDateKey: LocalDateKey, boundary: LocalDateKey) {
    if (!active) return;

    let missingDateKey = addLocalDays(previousPracticedDateKey, 1);

    while (
      missingDateKey !== null &&
      compareLocalDateKeys(missingDateKey, boundary) < 0 &&
      active
    ) {
      if (freezesAvailable > 0) {
        freezesAvailable -= 1;
        totalFreezesUsed += 1;
        recordDay({
          dateKey: missingDateKey,
          state: 'freeze-used',
          focusedMinutes: 0,
          qualifyingSessionCount: 0,
          freezeAwarded: false,
          currentStreakAfterDay: currentStreak,
          freezesAvailableAfterDay: freezesAvailable,
          qualifyingDaysTowardNextFreezeAfterDay: qualifyingDaysTowardNextFreeze,
        });
        missingDateKey = addLocalDays(missingDateKey, 1);
        continue;
      }

      recordDay({
        dateKey: missingDateKey,
        state: 'missed',
        focusedMinutes: 0,
        qualifyingSessionCount: 0,
        freezeAwarded: false,
        currentStreakAfterDay: 0,
        freezesAvailableAfterDay: freezesAvailable,
        qualifyingDaysTowardNextFreezeAfterDay: 0,
      });
      active = false;
      currentStreak = 0;
      qualifyingDaysTowardNextFreeze = 0;
    }
  }

  let previousPracticedDateKey: LocalDateKey | null = null;

  for (const dateKey of practicedDateKeys) {
    if (previousPracticedDateKey !== null) {
      closeMissingDatesBefore(previousPracticedDateKey, dateKey);
    }

    const practiced = practicedDates.get(dateKey);
    if (practiced === undefined) continue;

    if (!active) {
      active = true;
      currentStreak = 0;
      qualifyingDaysTowardNextFreeze = 0;
    }

    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    qualifyingDaysTowardNextFreeze += 1;

    const freezeAwarded = qualifyingDaysTowardNextFreeze === QUALIFYING_DAYS_PER_FREEZE;
    if (freezeAwarded) {
      freezesAvailable += 1;
      totalFreezesEarned += 1;
      qualifyingDaysTowardNextFreeze = 0;
    }

    recordDay({
      dateKey,
      state: 'practiced',
      focusedMinutes: practiced.focusedMinutes,
      qualifyingSessionCount: practiced.qualifyingSessionCount,
      freezeAwarded,
      currentStreakAfterDay: currentStreak,
      freezesAvailableAfterDay: freezesAvailable,
      qualifyingDaysTowardNextFreezeAfterDay: qualifyingDaysTowardNextFreeze,
    });
    previousPracticedDateKey = dateKey;
  }

  if (previousPracticedDateKey !== null) {
    closeMissingDatesBefore(previousPracticedDateKey, asOfDateKey);
  }

  const todayState: StreakTodayState = practicedDates.has(asOfDateKey)
    ? 'practiced'
    : active
      ? 'open'
      : 'not-started';

  return {
    asOfDateKey,
    currentStreak: active ? currentStreak : 0,
    longestStreak,
    freezesAvailable,
    qualifyingDaysTowardNextFreeze: active ? qualifyingDaysTowardNextFreeze : 0,
    qualifyingDaysUntilNextFreeze: active
      ? QUALIFYING_DAYS_PER_FREEZE - qualifyingDaysTowardNextFreeze
      : QUALIFYING_DAYS_PER_FREEZE,
    totalPracticedDays: practicedDates.size,
    totalFreezesEarned,
    totalFreezesUsed,
    firstPracticedDateKey,
    todayState,
    days,
    daysByDate,
  };
}

export function deriveStreakMonth(
  summary: StreakSummary,
  year: number,
  monthIndex: number
): StreakMonth | null {
  const month = normalizeLocalMonth(year, monthIndex);
  if (month === null) return null;

  const dateKeys = getLocalMonthDateKeys(month.year, month.monthIndex);
  const daysByDate: Partial<Record<LocalDateKey, StreakDay>> = {};
  let practicedDays = 0;
  let freezesUsed = 0;
  let focusedMinutes = 0;

  for (const dateKey of dateKeys) {
    const day = summary.daysByDate[dateKey];
    if (day === undefined) continue;

    daysByDate[dateKey] = day;
    if (day.state === 'practiced') {
      practicedDays += 1;
      focusedMinutes += day.focusedMinutes;
    } else if (day.state === 'freeze-used') {
      freezesUsed += 1;
    }
  }

  return {
    year: month.year,
    monthIndex: month.monthIndex,
    dateKeys,
    practicedDays,
    freezesUsed,
    focusedMinutes,
    daysByDate,
  };
}

export function deriveStreakSessionImpact(
  beforeSessions: readonly FocusSession[],
  session: FocusSession,
  persistedJourneyIds: readonly string[],
  now: Date = new Date()
): StreakSessionImpact {
  const before = deriveStreakSummary(beforeSessions, persistedJourneyIds, now);
  const sessionsAfter = [...beforeSessions, session];
  const asOfDateKey = before.asOfDateKey;
  const sessionDateKey =
    asOfDateKey === null
      ? null
      : getEligibleSessionDateKey(
          session,
          getPersistedJourneyIdSet(persistedJourneyIds),
          getDuplicatedSessionIds(sessionsAfter),
          asOfDateKey,
          now
        );
  const eligible = sessionDateKey !== null;
  const alreadyCounted = eligible && before.daysByDate[sessionDateKey]?.state === 'practiced';
  const after = eligible ? deriveStreakSummary(sessionsAfter, persistedJourneyIds, now) : before;
  const counted = eligible && !alreadyCounted;
  const restored =
    counted && sessionDateKey !== before.asOfDateKey && after.currentStreak > before.currentStreak;

  return {
    state: !eligible
      ? 'not-eligible'
      : alreadyCounted
        ? 'already-counted'
        : restored
          ? 'restored'
          : 'counted',
    counted,
    alreadyCounted,
    restored,
    currentStreakBefore: before.currentStreak,
    currentStreakAfter: after.currentStreak,
    longestStreakBefore: before.longestStreak,
    longestStreakAfter: after.longestStreak,
    freezesAvailableBefore: before.freezesAvailable,
    freezesAvailableAfter: after.freezesAvailable,
    freezesAvailableDelta: after.freezesAvailable - before.freezesAvailable,
    freezesEarnedDelta: after.totalFreezesEarned - before.totalFreezesEarned,
    freezesUsedDelta: after.totalFreezesUsed - before.totalFreezesUsed,
    newPersonalBest: after.longestStreak > before.longestStreak,
  };
}
