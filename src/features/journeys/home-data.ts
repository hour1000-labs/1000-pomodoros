import type {
  AppState,
  FocusSession,
  Journey,
  Milestone,
  NextStep,
  WeeklyGoal,
} from '@/lib/models';
import {
  deriveJourneyProgress,
  deriveProgressFromSessions,
  getCountableFocusSessions,
  getSessionsForLocalDate,
  type JourneyProgress,
} from '@/lib/progress';

import { deriveJourneyMilestoneData } from './journey-detail-data';

export const HOME_ACTIVE_JOURNEY_LIMIT = 2;
export const HOME_RECENT_SESSION_LIMIT = 3;

export interface HomeJourneySummary {
  journey: Journey;
  currentStep: NextStep | null;
  progress: JourneyProgress;
  currentMilestone: Milestone | null;
  currentMilestonePercentage: number;
}

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
  continueJourney: HomeJourneySummary | null;
  activeJourneys: HomeJourneySummary[];
  today: HomeTodayData;
  weekly: HomeWeeklyData | null;
  recentSessions: HomeRecentSession[];
  hasCompletedActivity: boolean;
}

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareJourneysByRecentActivity(left: Journey, right: Journey) {
  const leftTimestamp = getTimestamp(left.lastActiveAt);
  const rightTimestamp = getTimestamp(right.lastActiveAt);

  if (leftTimestamp !== rightTimestamp) {
    if (leftTimestamp === null) return 1;
    if (rightTimestamp === null) return -1;
    return rightTimestamp - leftTimestamp;
  }

  return left.id.localeCompare(right.id);
}

function getActiveJourneys(state: AppState) {
  const activeJourneys = state.journeys
    .filter((journey) => journey.status === 'active')
    .sort(compareJourneysByRecentActivity);
  const lastActiveIndex = activeJourneys.findIndex(
    (journey) => journey.id === state.lastActiveJourneyId
  );

  if (lastActiveIndex > 0) {
    const [lastActiveJourney] = activeJourneys.splice(lastActiveIndex, 1);

    if (lastActiveJourney !== undefined) {
      activeJourneys.unshift(lastActiveJourney);
    }
  }

  return activeJourneys.slice(0, HOME_ACTIVE_JOURNEY_LIMIT);
}

function compareStepsByPosition(left: NextStep, right: NextStep) {
  return (
    left.position - right.position ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function getCurrentStep(state: AppState, journeyId: string) {
  return (
    state.nextSteps
      .filter((nextStep) => nextStep.journeyId === journeyId && nextStep.status === 'current')
      .sort(compareStepsByPosition)[0] ?? null
  );
}

function deriveJourneySummary(state: AppState, journey: Journey): HomeJourneySummary {
  const progress = deriveJourneyProgress(journey, state.focusSessions);
  const milestoneData = deriveJourneyMilestoneData(
    journey,
    state.milestones,
    progress.focusedMinutes
  );

  return {
    journey,
    currentStep: getCurrentStep(state, journey.id),
    progress,
    currentMilestone: milestoneData.currentMilestone,
    currentMilestonePercentage: milestoneData.nextMilestonePercentage,
  };
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
  const activeJourneys = getActiveJourneys(state).map((journey) =>
    deriveJourneySummary(state, journey)
  );
  const countableSessions = getCountableFocusSessions(state.focusSessions);
  const todayProgress = deriveProgressFromSessions(getSessionsForLocalDate(countableSessions, now));

  return {
    continueJourney: activeJourneys[0] ?? null,
    activeJourneys,
    today: {
      completedPomodoros: todayProgress.fullPomodoros,
      focusedMinutes: todayProgress.focusedMinutes,
    },
    weekly: deriveWeeklyData(countableSessions, state.weeklyGoal, now),
    recentSessions: deriveRecentSessions(state, countableSessions),
    hasCompletedActivity: (activeJourneys[0]?.progress.focusedMinutes ?? 0) > 0,
  };
}
