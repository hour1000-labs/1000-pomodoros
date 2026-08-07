import { createFileRoute, Navigate } from '@tanstack/react-router';

import { LoadingState } from '@/components/shared/loading-state';
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { PublicLayout } from '@/features/landing/components/public-layout';
import { LandingPage } from '@/features/landing/landing-page';

export const Route = createFileRoute('/')({ component: IndexScreen });

function IndexScreen() {
  return (
    <PersistedStateBoundary
      loadingFallback={
        <PublicLayout>
          <LoadingState variant="landing" />
        </PublicLayout>
      }
    >
      {(state) => (state.journeys.length > 0 ? <Navigate to="/home" replace /> : <LandingPage />)}
    </PersistedStateBoundary>
  );
}
