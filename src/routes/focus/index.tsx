import { createFileRoute } from '@tanstack/react-router';

import { FocusSessionScreen } from '@/features/focus/focus-session-screen';

export interface FocusSearch {
  journeyId?: string;
  nextStepId?: string;
}

export function validateFocusSearch(search: Record<string, unknown>): FocusSearch {
  return {
    journeyId: typeof search.journeyId === 'string' ? search.journeyId : undefined,
    nextStepId: typeof search.nextStepId === 'string' ? search.nextStepId : undefined,
  };
}

function FocusRoute() {
  const search = Route.useSearch();

  return <FocusSessionScreen search={search} />;
}

export const Route = createFileRoute('/focus/')({
  validateSearch: validateFocusSearch,
  component: FocusRoute,
});
