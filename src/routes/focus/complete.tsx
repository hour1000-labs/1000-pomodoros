import { createFileRoute } from '@tanstack/react-router';

import { SessionCompleteScreen } from '@/features/focus/session-complete-screen';

export interface SessionCompleteSearch {
  sessionId?: string;
}

export function validateSessionCompleteSearch(
  search: Record<string, unknown>
): SessionCompleteSearch {
  const sessionId = typeof search.sessionId === 'string' ? search.sessionId.trim() : '';

  return { sessionId: sessionId.length > 0 ? sessionId : undefined };
}

function SessionCompleteRoute() {
  const { sessionId } = Route.useSearch();

  return <SessionCompleteScreen sessionId={sessionId} />;
}

export const Route = createFileRoute('/focus/complete')({
  validateSearch: validateSessionCompleteSearch,
  component: SessionCompleteRoute,
});
