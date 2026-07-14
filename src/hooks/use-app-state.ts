import { useCallback, useEffect, useState } from 'react';

import type { AppState } from '@/lib/models';
import { appRepository, type RepositoryError } from '@/lib/repository';

type AppStateHydration =
  | { status: 'loading'; state: null; error: null }
  | { status: 'ready'; state: AppState; error: null }
  | { status: 'error'; state: null; error: RepositoryError };

const loadingState: AppStateHydration = {
  status: 'loading',
  state: null,
  error: null,
};

export function useAppState() {
  const [hydration, setHydration] = useState<AppStateHydration>(loadingState);

  const load = useCallback(() => {
    const result = appRepository.load();

    if (result.status === 'ready') {
      setHydration({ status: 'ready', state: result.state, error: null });
      return;
    }

    if (result.status === 'error') {
      setHydration({ status: 'error', state: null, error: result.error });
    }
  }, []);

  const reset = useCallback(() => {
    const result = appRepository.reset();

    if (result.status === 'ready') {
      setHydration({ status: 'ready', state: result.state, error: null });
    } else if (result.status === 'error') {
      setHydration({ status: 'error', state: null, error: result.error });
    }
  }, []);

  useEffect(() => {
    load();
    return appRepository.subscribe(load);
  }, [load]);

  return { ...hydration, retry: load, reset };
}
