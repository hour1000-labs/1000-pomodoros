import { EmptyJourneyState } from '@/components/shared/empty-journey-state';
import { ScreenHeader } from '@/components/shared/screen-header';
import { getJourneyContext } from '@/lib/journey-context';
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';
import type { AppState } from '@/lib/models';
import { deriveProgressFromSessions, getSessionsForLocalDate } from '@/lib/progress';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';
import { ContinueCard } from './components/continue-card';
import { JourneyCard } from './components/journey-card';
import { StatItem } from './components/stat-item';
import { formatFocusedTime } from './format-focused-time';

function ApplicationEmptyState() {
  return (
    <ApplicationLayout journeyId={LEARN_GUITAR_JOURNEY_ID}>
      <EmptyJourneyState />
    </ApplicationLayout>
  );
}

function HomeContent({ state }: { state: AppState }) {
  const context = getJourneyContext(state);

  if (!context) return <ApplicationEmptyState />;

  const { journey, nextStep, progress } = context;
  const todayProgress = deriveProgressFromSessions(
    getSessionsForLocalDate(state.focusSessions, new Date()),
    journey.id
  );

  return (
    <ApplicationLayout journeyId={journey.id}>
      <ScreenHeader
        eyebrow="Home"
        title="Keep your momentum"
        description="One clear next action, then the progress that proves your effort is adding up."
      />
      <section className="mt-8">
        <ContinueCard
          journeyId={journey.id}
          journeyName={journey.name}
          nextStep={nextStep?.title}
        />
      </section>
      <section className="mt-10 grid grid-cols-2 gap-6 sm:max-w-md" aria-label="Today">
        <StatItem value={String(todayProgress.fullPomodoros)} label="Pomodoros today" />
        <StatItem value={String(todayProgress.focusedMinutes)} label="Focused minutes" />
      </section>
      <section className="mt-12">
        <h2 className="mb-5 font-bold text-2xl">Active Journey</h2>
        <JourneyCard
          journeyId={journey.id}
          name={journey.name}
          focusedTime={formatFocusedTime(progress.focusedMinutes)}
          milestoneLabel="Next milestone: 25 hours"
          milestonePercent={(progress.focusedMinutes / (25 * 60)) * 100}
          nextStep={nextStep?.title}
        />
      </section>
    </ApplicationLayout>
  );
}

export function HomeScreen() {
  return (
    <ApplicationStateBoundary>{(state) => <HomeContent state={state} />}</ApplicationStateBoundary>
  );
}
