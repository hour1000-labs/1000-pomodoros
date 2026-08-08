import type { ReactNode } from 'react';

import { type LoadingSkeletonVariant, LoadingState } from '@/components/shared/loading-state';
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
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
        <ApplicationLayout>
          <LoadingState variant={variant} />
        </ApplicationLayout>
      }
      errorFallback={({ retry, reset }) => (
        <ApplicationLayout>
          <RecoverableErrorState onRetry={retry} onReset={reset} />
        </ApplicationLayout>
      )}
    >
      {children}
    </PersistedStateBoundary>
  );
}
