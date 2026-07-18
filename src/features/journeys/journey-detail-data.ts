import type { AppState, FocusSession, Journey, Milestone, NextStep } from '@/lib/models';
import {
  deriveJourneyProgress,
  getCountableFocusSessions,
  type JourneyProgress,
  POMODORO_MINUTES,
} from '@/lib/progress';

export const POMODOROS_PER_SECTION = 100;
export const RECENT_SESSION_LIMIT = 3;

export interface JourneyBlockContribution {
  sessionId: string;
  date: string;
  focusedMinutes: number;
  contributionMinutes: number;
  nextStepTitle: string | null;
  source: FocusSession['source'];
}

export interface JourneyRecentSession {
  session: FocusSession;
  nextStepTitle: string | null;
}

export interface JourneyDetailData {
  journey: Journey;
  progress: JourneyProgress;
  sortedMilestones: Milestone[];
  currentMilestone: Milestone | null;
  nextMilestone: Milestone | null;
  nextMilestonePercentage: number;
  remainingPomodoros: number;
  currentStep: NextStep | null;
  upcomingSteps: NextStep[];
  recentSessions: JourneyRecentSession[];
  targetBlocks: number;
  totalBlocks: number;
  totalSections: number;
  currentSectionIndex: number;
  currentSectionStart: number;
  currentSectionCount: number;
  milestoneIndexes: number[];
  latestIndex: number | null;
  getBlockContributions(index: number): readonly JourneyBlockContribution[];
}

function compareByPosition(left: NextStep, right: NextStep) {
  return (
    left.position - right.position ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function getSessionDate(session: FocusSession) {
  return session.endedAt ?? session.startedAt;
}

function getSessionTimestamp(session: FocusSession) {
  const timestamp = Date.parse(getSessionDate(session));
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function compareSessionsChronologically(left: FocusSession, right: FocusSession) {
  return (
    getSessionTimestamp(left) - getSessionTimestamp(right) ||
    left.startedAt.localeCompare(right.startedAt) ||
    left.id.localeCompare(right.id)
  );
}

function getDisplayedMilestonePercentage(focusedMinutes: number, targetMinutes: number) {
  if (targetMinutes <= 0) return 0;

  const roundedPercentage = Math.round((focusedMinutes / targetMinutes) * 100);
  return Math.min(focusedMinutes < targetMinutes ? 99 : 100, roundedPercentage);
}

function deriveBlockContributions(
  sessions: readonly FocusSession[],
  nextStepsById: ReadonlyMap<string, NextStep>
) {
  const contributionsByIndex = new Map<number, JourneyBlockContribution[]>();
  let allocatedMinutes = 0;

  for (const session of sessions) {
    let remainingSessionMinutes = session.focusedMinutes;

    while (remainingSessionMinutes > 0) {
      const blockIndex = Math.floor(allocatedMinutes / POMODORO_MINUTES);
      const minutesInBlock = allocatedMinutes % POMODORO_MINUTES;
      const contributionMinutes = Math.min(
        remainingSessionMinutes,
        POMODORO_MINUTES - minutesInBlock
      );
      const contribution: JourneyBlockContribution = {
        sessionId: session.id,
        date: getSessionDate(session),
        focusedMinutes: session.focusedMinutes,
        contributionMinutes,
        nextStepTitle:
          session.nextStepId === null
            ? null
            : (nextStepsById.get(session.nextStepId)?.title ?? null),
        source: session.source,
      };
      const existingContributions = contributionsByIndex.get(blockIndex);

      if (existingContributions === undefined) {
        contributionsByIndex.set(blockIndex, [contribution]);
      } else {
        existingContributions.push(contribution);
      }

      allocatedMinutes += contributionMinutes;
      remainingSessionMinutes -= contributionMinutes;
    }
  }

  return contributionsByIndex;
}

export function deriveJourneyDetailData(
  state: AppState,
  journeyId: string
): JourneyDetailData | null {
  const journey = state.journeys.find((item) => item.id === journeyId);

  if (journey === undefined) {
    return null;
  }

  const progress = deriveJourneyProgress(journey, state.focusSessions);
  const sortedMilestones = state.milestones
    .filter((milestone) => milestone.journeyId === journeyId)
    .sort(
      (left, right) =>
        left.targetFocusedMinutes - right.targetFocusedMinutes || left.id.localeCompare(right.id)
    );
  const milestoneGoals = [...sortedMilestones];

  if (
    journey.targetMinutes > 0 &&
    !milestoneGoals.some(
      ({ targetFocusedMinutes }) => targetFocusedMinutes === journey.targetMinutes
    )
  ) {
    milestoneGoals.push({
      id: `journey-target-${journey.id}`,
      journeyId: journey.id,
      name: 'Journey target',
      targetFocusedMinutes: journey.targetMinutes,
      earnedAt: null,
    });
    milestoneGoals.sort(
      (left, right) =>
        left.targetFocusedMinutes - right.targetFocusedMinutes || left.id.localeCompare(right.id)
    );
  }

  const currentMilestoneIndex = milestoneGoals.findIndex(
    (milestone) => milestone.targetFocusedMinutes > progress.focusedMinutes
  );
  const currentMilestone =
    currentMilestoneIndex === -1
      ? (milestoneGoals.at(-1) ?? null)
      : (milestoneGoals[currentMilestoneIndex] ?? null);
  const nextMilestone =
    currentMilestoneIndex === -1 ? null : (milestoneGoals[currentMilestoneIndex + 1] ?? null);
  const nextMilestonePercentage =
    currentMilestone === null
      ? 0
      : getDisplayedMilestonePercentage(
          progress.focusedMinutes,
          currentMilestone.targetFocusedMinutes
        );
  const remainingPomodoros =
    currentMilestone === null
      ? 0
      : Math.ceil(
          Math.max(0, currentMilestone.targetFocusedMinutes - progress.focusedMinutes) /
            POMODORO_MINUTES
        );
  const journeySteps = state.nextSteps
    .filter((nextStep) => nextStep.journeyId === journeyId)
    .sort(compareByPosition);
  const currentStep = journeySteps.find((nextStep) => nextStep.status === 'current') ?? null;
  const upcomingSteps = journeySteps.filter((nextStep) => nextStep.status === 'upcoming');
  const chronologicalSessions = getCountableFocusSessions(state.focusSessions, journeyId).sort(
    compareSessionsChronologically
  );
  const nextStepsById = new Map(state.nextSteps.map((nextStep) => [nextStep.id, nextStep]));
  const contributionsByIndex = deriveBlockContributions(chronologicalSessions, nextStepsById);
  const recentSessions = [...chronologicalSessions]
    .reverse()
    .slice(0, RECENT_SESSION_LIMIT)
    .map((session) => ({
      session,
      nextStepTitle:
        session.nextStepId === null ? null : (nextStepsById.get(session.nextStepId)?.title ?? null),
    }));
  const targetBlocks = Math.ceil(Math.max(0, journey.targetMinutes) / POMODORO_MINUTES);
  const progressBlocks = Math.ceil(progress.focusedMinutes / POMODORO_MINUTES);
  const totalBlocks = Math.max(targetBlocks, progressBlocks);
  const totalSections = Math.ceil(totalBlocks / POMODOROS_PER_SECTION);
  const latestIndex =
    progress.focusedMinutes > 0 ? Math.ceil(progress.focusedMinutes / POMODORO_MINUTES) - 1 : null;
  const currentSectionIndex =
    totalSections === 0
      ? 0
      : Math.min(totalSections - 1, Math.floor((latestIndex ?? 0) / POMODOROS_PER_SECTION));
  const currentSectionStart = currentSectionIndex * POMODOROS_PER_SECTION;
  const currentSectionCount = Math.min(
    POMODOROS_PER_SECTION,
    Math.max(0, totalBlocks - currentSectionStart)
  );
  const milestoneIndexes = milestoneGoals
    .filter((milestone) => milestone.targetFocusedMinutes > 0)
    .map((milestone) => Math.ceil(milestone.targetFocusedMinutes / POMODORO_MINUTES) - 1);

  return {
    journey,
    progress,
    sortedMilestones,
    currentMilestone,
    nextMilestone,
    nextMilestonePercentage,
    remainingPomodoros,
    currentStep,
    upcomingSteps,
    recentSessions,
    targetBlocks,
    totalBlocks,
    totalSections,
    currentSectionIndex,
    currentSectionStart,
    currentSectionCount,
    milestoneIndexes,
    latestIndex,
    getBlockContributions: (index) => contributionsByIndex.get(index) ?? [],
  };
}
