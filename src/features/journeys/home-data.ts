import type { AppState, FocusSession, WeeklyGoal } from '@/lib/models';
import {
  deriveProgressFromSessions,
  getCountableFocusSessions,
  getSessionsForLocalDate,
} from '@/lib/progress';

import {
  deriveJourneySummary,
  getOrderedJourneyGroups,
  type JourneySummary,
} from './journey-summary-data';

export const HOME_ACTIVE_JOURNEY_LIMIT = 2;
export const HOME_RECENT_SESSION_LIMIT = 3;

export interface HomeTodayData {
  completedPomodoros: number;
  focusedMinutes: number;
}

export interface HomeWeeklyData {
  completedPomodoros: number;
  focusedMinutes: number;
  targetPomodoros: number;
  remainingPomodoros: number;
  activeDays: number;
}

export interface HomeRecentSession {
  session: FocusSession;
  journeyName: string | null;
  nextStepTitle: string | null;
}

export interface HomeData {
  continueJourney: JourneySummary | null;
  activeJourneys: JourneySummary[];
  hasJourneyOutsidePreview: boolean;
  today: HomeTodayData;
  weekly: HomeWeeklyData | null;
  recentSessions: HomeRecentSession[];
  hasCompletedActivity: boolean;
}

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getCurrentWeekRange(now: Date, weekStartsOn: WeeklyGoal['weekStartsOn']) {
  const start = new Date(now.getTime());
  start.setHours(0, 0, 0, 0);
  const daysSinceWeekStart = (start.getDay() - weekStartsOn + 7) % 7;
  start.setDate(start.getDate() - daysSinceWeekStart);

  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 7);

  return { start, end };
}

function deriveWeeklyData(
  countableSessions: readonly FocusSession[],
  weeklyGoal: WeeklyGoal | null,
  now: Date
): HomeWeeklyData | null {
  if (weeklyGoal === null) return null;

  const { start, end } = getCurrentWeekRange(now, weeklyGoal.weekStartsOn);
  const weekStartTimestamp = start.getTime();
  const nextWeekStartTimestamp = end.getTime();
  const activeDateKeys = new Set<string>();
  const weeklySessions = countableSessions.filter((session) => {
    if (weeklyGoal.journeyId !== null && session.journeyId !== weeklyGoal.journeyId) {
      return false;
    }

    if (session.endedAt === null) return false;

    const endedAt = new Date(session.endedAt);
    const endedAtTimestamp = endedAt.getTime();

    if (
      Number.isNaN(endedAtTimestamp) ||
      endedAtTimestamp < weekStartTimestamp ||
      endedAtTimestamp >= nextWeekStartTimestamp
    ) {
      return false;
    }

    activeDateKeys.add(getLocalDateKey(endedAt));
    return true;
  });
  const progress = deriveProgressFromSessions(weeklySessions);

  return {
    completedPomodoros: progress.fullPomodoros,
    focusedMinutes: progress.focusedMinutes,
    targetPomodoros: weeklyGoal.targetPomodoros,
    remainingPomodoros: Math.max(0, weeklyGoal.targetPomodoros - progress.fullPomodoros),
    activeDays: activeDateKeys.size,
  };
}

function getRecentSessionDate(session: FocusSession) {
  return session.endedAt ?? session.startedAt;
}

function compareRecentSessions(left: FocusSession, right: FocusSession) {
  const leftTimestamp = getTimestamp(getRecentSessionDate(left));
  const rightTimestamp = getTimestamp(getRecentSessionDate(right));

  if (leftTimestamp === null || rightTimestamp === null) {
    return 0;
  }

  return (
    rightTimestamp - leftTimestamp ||
    right.startedAt.localeCompare(left.startedAt) ||
    right.id.localeCompare(left.id)
  );
}

function deriveRecentSessions(
  state: AppState,
  countableSessions: readonly FocusSession[]
): HomeRecentSession[] {
  const journeysById = new Map(state.journeys.map((journey) => [journey.id, journey]));
  const nextStepsById = new Map(state.nextSteps.map((nextStep) => [nextStep.id, nextStep]));

  return countableSessions
    .filter((session) => getTimestamp(getRecentSessionDate(session)) !== null)
    .sort(compareRecentSessions)
    .slice(0, HOME_RECENT_SESSION_LIMIT)
    .map((session) => {
      const nextStep =
        session.nextStepId === null ? null : (nextStepsById.get(session.nextStepId) ?? null);

      return {
        session,
        journeyName: journeysById.get(session.journeyId)?.name ?? null,
        nextStepTitle: nextStep?.journeyId === session.journeyId ? nextStep.title : null,
      };
    });
}

export function deriveHomeData(state: AppState, now: Date): HomeData {
  const journeyGroups = getOrderedJourneyGroups(state);
  const activeJourneys = journeyGroups.active
    .slice(0, HOME_ACTIVE_JOURNEY_LIMIT)
    .map((journey) => deriveJourneySummary(state, journey));
  const countableSessions = getCountableFocusSessions(state.focusSessions);
  const todayProgress = deriveProgressFromSessions(getSessionsForLocalDate(countableSessions, now));

  return {
    continueJourney: activeJourneys[0] ?? null,
    activeJourneys,
    hasJourneyOutsidePreview: state.journeys.length > activeJourneys.length,
    today: {
      completedPomodoros: todayProgress.fullPomodoros,
      focusedMinutes: todayProgress.focusedMinutes,
    },
    weekly: deriveWeeklyData(countableSessions, state.weeklyGoal, now),
    recentSessions: deriveRecentSessions(state, countableSessions),
    hasCompletedActivity: (activeJourneys[0]?.progress.focusedMinutes ?? 0) > 0,
  };
}
