import { Link, Navigate } from '@tanstack/react-router';

import { EmptyState } from '@/components/shared/empty-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import { useCurrentLocalDate } from '@/hooks/use-current-local-date';
import type { AppState } from '@/lib/models';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';
import { ContinueCard } from './components/continue-card';
import { HomeRecentSessions } from './components/home-recent-sessions';
import { HomeWeeklyProgress } from './components/home-weekly-progress';
import { JourneyCard } from './components/journey-card';
import { StatItem } from './components/stat-item';
import { formatFocusedTime } from './format-focused-time';
import { deriveHomeData } from './home-data';

function HomeContent({ now, state }: { now: Date; state: AppState }) {
  if (state.journeys.length === 0) {
    return <Navigate to="/onboarding/journey" replace />;
  }

  const home = deriveHomeData(state, now);
  const navigationJourney =
    state.journeys.find(({ id }) => id === state.lastActiveJourneyId) ?? state.journeys[0];
  const continueJourney = home.continueJourney;

  if (continueJourney === null) {
    return (
      <ApplicationLayout journeyId={navigationJourney.id}>
        <h1 className="sr-only">Home</h1>
        <EmptyState
          title="No active Journeys"
          description="Open a Journey to choose what comes next."
          action={
            <div className="flex flex-wrap gap-3">
              <PrimaryButton asChild>
                <Link
                  to="/journeys/$journeyId"
                  params={{ journeyId: navigationJourney.id }}
                  aria-label={`Review ${navigationJourney.name} Journey`}
                >
                  Review Journey
                </Link>
              </PrimaryButton>
              <Button asChild variant="outline">
                <Link to="/onboarding/journey" search={{ fresh: true }}>
                  Add Journey
                </Link>
              </Button>
            </div>
          }
        />
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout journeyId={continueJourney.journey.id}>
      <section aria-labelledby="home-continue-heading">
        <ContinueCard
          hasCompletedActivity={home.hasCompletedActivity}
          journeyId={continueJourney.journey.id}
          journeyName={continueJourney.journey.name}
          nextStep={continueJourney.currentStep}
        />
      </section>

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section
          aria-labelledby="home-today-heading"
          className="rounded-xl border border-ink/15 p-6"
        >
          <h2 id="home-today-heading" className="mb-7 font-bold text-2xl tracking-[-0.025em]">
            Today
          </h2>
          <dl className="grid grid-cols-2 gap-6">
            <StatItem value={String(home.today.completedPomodoros)} label="Pomodoros" />
            <StatItem value={String(home.today.focusedMinutes)} label="Focused minutes" />
          </dl>
        </section>

        <HomeWeeklyProgress weekly={home.weekly} />
      </div>

      <section className="mt-16" aria-labelledby="active-journeys-heading">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-ink/15 border-b pb-4">
          <h2 id="active-journeys-heading" className="mb-0 font-bold text-3xl tracking-[-0.03em]">
            Active Journeys
          </h2>
          <Button asChild variant="outline">
            <Link to="/onboarding/journey" search={{ fresh: true }}>
              Add Journey
            </Link>
          </Button>
        </div>
        <div className="grid gap-7 lg:grid-cols-2">
          {home.activeJourneys.map((summary) => (
            <JourneyCard
              key={summary.journey.id}
              journeyId={summary.journey.id}
              name={summary.journey.name}
              focusedTime={formatFocusedTime(summary.progress.focusedMinutes)}
              milestoneLabel={`Current milestone: ${
                summary.currentMilestone?.name ?? 'Journey target'
              }`}
              milestonePercent={summary.currentMilestonePercentage}
              nextStep={summary.currentStep}
            />
          ))}
        </div>
      </section>

      <div className="mt-16">
        <HomeRecentSessions now={now} sessions={home.recentSessions} />
      </div>
    </ApplicationLayout>
  );
}

export function HomeScreen() {
  const now = useCurrentLocalDate();

  return (
    <ApplicationStateBoundary>
      {(state) => <HomeContent now={now} state={state} />}
    </ApplicationStateBoundary>
  );
}
