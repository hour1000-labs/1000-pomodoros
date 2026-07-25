import { createFileRoute, Navigate } from '@tanstack/react-router';

import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { LandingPage } from '@/features/landing/landing-page';

export const Route = createFileRoute('/')({ component: IndexScreen });

function IndexScreen() {
  return (
    <PersistedStateBoundary>
      {(state) => (state.journeys.length > 0 ? <Navigate to="/home" replace /> : <LandingPage />)}
    </PersistedStateBoundary>
  );
}
