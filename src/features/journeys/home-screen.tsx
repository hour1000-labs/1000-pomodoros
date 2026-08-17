import { Link, Navigate } from '@tanstack/react-router';

import { EmptyState } from '@/components/shared/empty-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import { useCurrentLocalDate } from '@/hooks/use-current-local-date';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import type { AppState } from '@/lib/models';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';
import { ContinueCard } from './components/continue-card';
import { HomeRecentSessions } from './components/home-recent-sessions';
import { HomeStreakLink } from './components/home-streak-link';
import { JourneyCard } from './components/journey-card';
import { MonthlyPomodoroActivity } from './components/monthly-pomodoro-activity';
import { StatItem } from './components/stat-item';
import { deriveHomeData, type HomeData } from './home-data';

function HomeActivityOverview({
  home,
  now,
  state,
}: {
  home: HomeData;
  now: Date;
  state: AppState;
}) {
  return (
    <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section
        aria-labelledby="home-today-heading"
        className="self-start rounded-2xl border border-ink/8 bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] sm:p-7"
      >
        <h2
          id="home-today-heading"
          className="mb-6 font-extrabold text-2xl text-ink tracking-tight"
        >
          Today
        </h2>
        <dl className="grid grid-cols-2 gap-6">
          <StatItem value={String(home.today.completedPomodoros)} label="Pomodoros" />
          <StatItem
            value={formatFocusedDuration(home.today.focusedMinutes)}
            label="Focused time"
            className="[&_dd]:text-lg [&_dd]:leading-snug [&_dd]:tracking-normal [&_dd]:[overflow-wrap:normal] sm:[&_dd]:text-2xl"
          />
        </dl>
        <HomeStreakLink streak={home.streak} />
      </section>

      <MonthlyPomodoroActivity
        initialVisibleDays={3}
        state={state}
        now={now}
        scopeLabel="All Journeys"
      />
    </div>
  );
}

function HomeContent({ now, state }: { now: Date; state: AppState }) {
  if (state.journeys.length === 0) {
    return <Navigate to="/onboarding/journey" replace />;
  }

  const home = deriveHomeData(state, now);
  const continueJourney = home.continueJourney;

  if (continueJourney === null) {
    return (
      <ApplicationLayout>
        <h1 className="sr-only">Home</h1>
        <EmptyState
          title="No active Journeys"
          description="Review your saved Journeys or create a new one."
          action={
            <div className="flex flex-wrap gap-3">
              <PrimaryButton asChild>
                <Link to="/journeys">View all Journeys</Link>
              </PrimaryButton>
              <Button asChild variant="outline">
                <Link to="/onboarding/journey" search={{ fresh: true }}>
                  Add Journey
                </Link>
              </Button>
            </div>
          }
        />
        <HomeActivityOverview home={home} now={now} state={state} />
        <div className="mt-16">
          <HomeRecentSessions now={now} sessions={home.recentSessions} />
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <section aria-labelledby="home-continue-heading">
        <ContinueCard
          hasCompletedActivity={home.hasCompletedActivity}
          journeyId={continueJourney.journey.id}
          journeyName={continueJourney.journey.name}
          nextStep={continueJourney.currentStep}
        />
      </section>

      <HomeActivityOverview home={home} now={now} state={state} />

      <section className="mt-16" aria-labelledby="active-journeys-heading">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-ink/8 border-b pb-4">
          <h2
            id="active-journeys-heading"
            className="mb-0 font-extrabold text-3xl text-ink tracking-tight"
          >
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
              focusedTime={formatFocusedDuration(summary.progress.focusedMinutes)}
              milestoneLabel={`Current milestone: ${
                summary.currentMilestone?.name ?? 'Journey target'
              }`}
              milestonePercent={summary.currentMilestonePercentage}
              nextStep={summary.currentStep}
              status={summary.journey.status}
            />
          ))}
        </div>
        {home.hasJourneyOutsidePreview ? (
          <Button asChild variant="link" className="mt-4 px-0">
            <Link to="/journeys">View all Journeys</Link>
          </Button>
        ) : null}
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
    <ApplicationStateBoundary variant="home">
      {(state) => <HomeContent now={now} state={state} />}
    </ApplicationStateBoundary>
  );
}
