import type { AppState } from './models';
import { deriveJourneyProgress } from './progress';

export function getJourneyContext(state: AppState, journeyId?: string) {
  const journey =
    journeyId === undefined
      ? (state.journeys.find((item) => item.id === state.lastActiveJourneyId) ?? state.journeys[0])
      : state.journeys.find((item) => item.id === journeyId);

  if (!journey) return null;

  const nextStep = state.nextSteps
    .filter((item) => item.journeyId === journey.id && item.status === 'current')
    .sort((left, right) => left.position - right.position)[0];
  const progress = deriveJourneyProgress(journey, state.focusSessions);

  return { journey, nextStep, progress };
}
