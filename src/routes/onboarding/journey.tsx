import { createFileRoute } from '@tanstack/react-router';

import { OnboardingCreateJourney } from '@/features/onboarding/onboarding-create-journey';

export interface CreateJourneySearch {
  fresh?: boolean;
}

export function validateCreateJourneySearch(search: Record<string, unknown>): CreateJourneySearch {
  return {
    fresh: search.fresh === true || search.fresh === 'true',
  };
}

function CreateJourneyRoute() {
  const { fresh } = Route.useSearch();

  return <OnboardingCreateJourney startFresh={fresh} />;
}

export const Route = createFileRoute('/onboarding/journey')({
  validateSearch: validateCreateJourneySearch,
  component: CreateJourneyRoute,
});
