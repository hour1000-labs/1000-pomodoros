import type { ReactNode } from 'react';

import { type LoadingSkeletonVariant, LoadingState } from '@/components/shared/loading-state';
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';
import type { AppState } from '@/lib/models';

import { ApplicationLayout } from './application-layout';

export function ApplicationStateBoundary({
  children,
  variant = 'home',
}: {
  children: (state: AppState) => ReactNode;
  variant?: LoadingSkeletonVariant;
}) {
  return (
    <PersistedStateBoundary
      loadingFallback={
        <ApplicationLayout journeyId={LEARN_GUITAR_JOURNEY_ID}>
          <LoadingState variant={variant} />
        </ApplicationLayout>
      }
      errorFallback={({ retry, reset }) => (
        <ApplicationLayout journeyId={LEARN_GUITAR_JOURNEY_ID}>
          <RecoverableErrorState onRetry={retry} onReset={reset} />
        </ApplicationLayout>
      )}
    >
      {children}
    </PersistedStateBoundary>
  );
}
