import type { AppState, Journey, Milestone, NextStep } from '@/lib/models';
import { deriveJourneyProgress, type JourneyProgress } from '@/lib/progress';

import { deriveJourneyMilestoneData } from './journey-detail-data';

export interface JourneySummary {
  journey: Journey;
  currentStep: NextStep | null;
  progress: JourneyProgress;
  currentMilestone: Milestone | null;
  currentMilestonePercentage: number;
}

export interface OrderedJourneyGroups {
  active: Journey[];
  inactive: Journey[];
}

export interface JourneySummaryGroups {
  active: JourneySummary[];
  inactive: JourneySummary[];
}

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function compareJourneysByRecentActivity(left: Journey, right: Journey) {
  const leftTimestamp = getTimestamp(left.lastActiveAt);
  const rightTimestamp = getTimestamp(right.lastActiveAt);

  if (leftTimestamp !== rightTimestamp) {
    if (leftTimestamp === null) return 1;
    if (rightTimestamp === null) return -1;
    return rightTimestamp - leftTimestamp;
  }

  return left.id.localeCompare(right.id);
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

export function getOrderedJourneyGroups(state: AppState): OrderedJourneyGroups {
  const active = state.journeys
    .filter((journey) => journey.status === 'active')
    .sort(compareJourneysByRecentActivity);
  const inactive = state.journeys
    .filter((journey) => journey.status !== 'active')
    .sort(compareJourneysByRecentActivity);
  const lastActiveIndex = active.findIndex((journey) => journey.id === state.lastActiveJourneyId);

  if (lastActiveIndex > 0) {
    const [lastActiveJourney] = active.splice(lastActiveIndex, 1);

    if (lastActiveJourney !== undefined) {
      active.unshift(lastActiveJourney);
    }
  }

  return { active, inactive };
}

export function deriveJourneySummary(state: AppState, journey: Journey): JourneySummary {
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

export function deriveJourneySummaryGroups(state: AppState): JourneySummaryGroups {
  const groups = getOrderedJourneyGroups(state);

  return {
    active: groups.active.map((journey) => deriveJourneySummary(state, journey)),
    inactive: groups.inactive.map((journey) => deriveJourneySummary(state, journey)),
  };
}
