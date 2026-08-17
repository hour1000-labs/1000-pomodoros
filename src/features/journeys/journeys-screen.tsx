import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { EmptyJourneyState } from '@/components/shared/empty-journey-state';
import { Button } from '@/components/ui/button';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import type { AppState } from '@/lib/models';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';
import { JourneyCard } from './components/journey-card';
import { deriveJourneySummaryGroups, type JourneySummary } from './journey-summary-data';

function JourneyGrid({ summaries }: { summaries: readonly JourneySummary[] }) {
  return (
    <div className="grid gap-7 lg:grid-cols-2">
      {summaries.map((summary) => (
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
  );
}

function JourneysContent({ state }: { state: AppState }) {
  const groups = deriveJourneySummaryGroups(state);
  const hasJourneys = groups.active.length > 0 || groups.inactive.length > 0;

  if (!hasJourneys) {
    return (
      <ApplicationLayout>
        <header className="border-ink/8 border-b pb-6">
          <h1 className="mb-0 font-extrabold text-4xl text-ink tracking-tight sm:text-5xl">
            Journeys
          </h1>
        </header>
        <div className="mt-8">
          <EmptyJourneyState />
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <header className="flex flex-wrap items-center justify-between gap-4 border-ink/8 border-b pb-6">
        <h1 className="mb-0 font-extrabold text-4xl text-ink tracking-tight sm:text-5xl">
          Journeys
        </h1>
        <Button asChild variant="outline">
          <Link to="/onboarding/journey" search={{ fresh: true }}>
            <Plus aria-hidden="true" />
            Add Journey
          </Link>
        </Button>
      </header>

      {groups.active.length > 0 ? (
        <section className="mt-10" aria-labelledby="active-journeys-heading">
          <h2
            id="active-journeys-heading"
            className="mb-6 font-extrabold text-2xl text-ink tracking-tight sm:text-3xl"
          >
            Active Journeys
          </h2>
          <JourneyGrid summaries={groups.active} />
        </section>
      ) : null}

      {groups.inactive.length > 0 ? (
        <section className="mt-14" aria-labelledby="inactive-journeys-heading">
          <h2
            id="inactive-journeys-heading"
            className="mb-6 font-extrabold text-2xl text-ink tracking-tight sm:text-3xl"
          >
            Other Journeys
          </h2>
          <JourneyGrid summaries={groups.inactive} />
        </section>
      ) : null}
    </ApplicationLayout>
  );
}

export function JourneysScreen() {
  return (
    <ApplicationStateBoundary variant="journeys">
      {(state) => <JourneysContent state={state} />}
    </ApplicationStateBoundary>
  );
}
