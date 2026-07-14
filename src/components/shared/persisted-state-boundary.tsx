import type { ReactNode } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { useAppState } from '@/hooks/use-app-state';
import type { AppState } from '@/lib/models';

export function PersistedStateBoundary({
  children,
  loadingFallback,
  errorFallback,
}: {
  children: (state: AppState) => ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: (actions: { retry: () => void; reset: () => void }) => ReactNode;
}) {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return loadingFallback ?? <LoadingState />;
  }

  if (hydration.status === 'error') {
    return (
      errorFallback?.({ retry: hydration.retry, reset: hydration.reset }) ?? (
        <RecoverableErrorState onRetry={hydration.retry} onReset={hydration.reset} />
      )
    );
  }

  return children(hydration.state);
}
