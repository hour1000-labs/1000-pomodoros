import { Link } from '@tanstack/react-router';

import { EmptyState } from '@/components/shared/empty-state';
import { FocusLayout } from '@/components/shared/focus-layout';
import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardContent } from '@/components/ui/card';
import { getJourneyContext } from '@/lib/journey-context';
import type { AppState } from '@/lib/models';

function CompletionContent({ state }: { state: AppState }) {
  const latestSession = state.focusSessions.find(
    (session) => session.id === state.lastCompletedSessionId
  );

  if (latestSession?.status !== 'completed') {
    return (
      <FocusLayout>
        <EmptyState
          className="w-full max-w-reading"
          title="Session not found"
          description="There is no completed focus session to show yet."
          action={
            <PrimaryButton asChild>
              <Link to="/home">Return Home</Link>
            </PrimaryButton>
          }
        />
      </FocusLayout>
    );
  }

  const context = getJourneyContext(state, latestSession.journeyId);

  if (!context) {
    return (
      <FocusLayout>
        <EmptyState
          className="w-full max-w-reading"
          title="Journey not found"
          description="The Journey for this completed session is unavailable."
          action={
            <PrimaryButton asChild>
              <Link to="/home">Return Home</Link>
            </PrimaryButton>
          }
        />
      </FocusLayout>
    );
  }

  const minutes = latestSession.focusedMinutes;

  return (
    <FocusLayout>
      <div className="grid w-full max-w-4xl gap-10 md:grid-cols-[1fr_0.8fr] md:items-center">
        <p className="sr-only" role="status" aria-live="polite">
          Focus session complete.
        </p>
        <ScreenHeader
          eyebrow="Focus session complete"
          title={`${minutes / 25} pomodoro${minutes === 25 ? '' : 's'} complete.`}
          description={`You added ${minutes} focused minutes to ${context.journey.name}.`}
          actions={
            <PrimaryButton asChild>
              <Link to="/journeys/$journeyId" params={{ journeyId: context.journey.id }}>
                View progress
              </Link>
            </PrimaryButton>
          }
        />
        <Card>
          <CardContent className="p-6">
            <PomodoroGrid
              focusedMinutes={context.progress.focusedMinutes}
              totalPomodoros={100}
              startIndex={0}
              renderLimit={100}
              latestIndex={
                context.progress.fullPomodoros > 0 ? context.progress.fullPomodoros - 1 : undefined
              }
            />
          </CardContent>
        </Card>
      </div>
    </FocusLayout>
  );
}

export function SessionCompleteScreen() {
  return (
    <PersistedStateBoundary>
      {(state) => <CompletionContent state={state} />}
    </PersistedStateBoundary>
  );
}
