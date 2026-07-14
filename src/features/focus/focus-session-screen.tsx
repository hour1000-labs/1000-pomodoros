import { Clock3 } from 'lucide-react';

import { EmptyJourneyState } from '@/components/shared/empty-journey-state';
import { FocusLayout } from '@/components/shared/focus-layout';
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { PrimaryButton } from '@/components/shared/primary-button';
import { ScreenHeader } from '@/components/shared/screen-header';
import { getJourneyContext } from '@/lib/journey-context';
import type { AppState } from '@/lib/models';

function FocusEmptyState() {
  return (
    <FocusLayout>
      <EmptyJourneyState />
    </FocusLayout>
  );
}

function FocusContent({ state }: { state: AppState }) {
  const context = getJourneyContext(state);

  if (!context) return <FocusEmptyState />;

  return (
    <FocusLayout>
      <div className="w-full max-w-reading text-center">
        <ScreenHeader
          align="center"
          eyebrow={context.journey.name}
          title="25:00"
          description={context.nextStep?.title ?? 'Choose a Next step before focusing.'}
        />
        <PrimaryButton className="mt-8 w-full sm:w-auto">
          <Clock3 aria-hidden="true" className="size-4" />
          Start focus session
        </PrimaryButton>
      </div>
    </FocusLayout>
  );
}

export function FocusSessionScreen() {
  return (
    <PersistedStateBoundary>{(state) => <FocusContent state={state} />}</PersistedStateBoundary>
  );
}
