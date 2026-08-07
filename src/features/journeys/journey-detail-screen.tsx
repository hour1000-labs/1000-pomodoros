import { Link } from '@tanstack/react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { deriveJourneyDetailData } from '@/features/journeys/journey-detail-data';
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';
import type { AppState, NextStep } from '@/lib/models';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';
import {
  JourneyDetailCurrentStep,
  JourneyDetailNextSteps,
} from './components/journey-detail-next-steps';
import { JourneyDetailProgress } from './components/journey-detail-progress';
import { JourneyDetailRecentSessions } from './components/journey-detail-recent-sessions';
import { formatFocusedTime } from './format-focused-time';

function JourneyNotFoundState({ state }: { state: AppState }) {
  const navigationJourneyId =
    state.journeys.find((journey) => journey.id === state.lastActiveJourneyId)?.id ??
    state.journeys[0]?.id ??
    LEARN_GUITAR_JOURNEY_ID;

  return (
    <ApplicationLayout journeyId={navigationJourneyId}>
      <EmptyState
        className="w-full"
        title="Journey not found"
        description="This Journey may have been removed."
        action={
          <PrimaryButton asChild>
            <Link to="/home">
              <ArrowLeft aria-hidden="true" />
              Return Home
            </Link>
          </PrimaryButton>
        }
      />
    </ApplicationLayout>
  );
}

function StartAction({ journeyId, nextStep }: { journeyId: string; nextStep: NextStep }) {
  return (
    <PrimaryButton asChild className="w-full">
      <Link
        to="/focus"
        search={{ journeyId, nextStepId: nextStep.id }}
        aria-label={`Start 25:00 for ${nextStep.title}`}
      >
        Start 25:00
      </Link>
    </PrimaryButton>
  );
}

function JourneyContent({
  state,
  journeyId,
  readOnly = false,
  showNavigationItems = true,
}: {
  state: AppState;
  journeyId: string;
  readOnly?: boolean;
  showNavigationItems?: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const detail = deriveJourneyDetailData(state, journeyId);

  if (!detail) return <JourneyNotFoundState state={state} />;

  const { journey, progress, currentStep } = detail;
  const canStart = !readOnly && journey.status === 'active' && currentStep !== null;
  const startAction = canStart ? (
    <StartAction journeyId={journey.id} nextStep={currentStep} />
  ) : undefined;
  const mobileDock =
    !readOnly && journey.status === 'active' ? (
      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 h-15 border-ink/10 border-t bg-paper px-5 pt-3 md:hidden">
        {currentStep ? (
          <StartAction journeyId={journey.id} nextStep={currentStep} />
        ) : (
          <PrimaryButton type="button" className="w-full" onClick={() => setAddOpen(true)}>
            <Plus aria-hidden="true" />
            Add a Next step
          </PrimaryButton>
        )}
      </div>
    ) : undefined;

  return (
    <ApplicationLayout
      journeyId={journey.id}
      className="pb-12 md:pb-16"
      mobileDock={mobileDock}
      showNavigationItems={showNavigationItems}
    >
      <header className="border-ink/15 border-b pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="mb-3 max-w-[18ch] font-bold text-5xl leading-[1.02] tracking-[-0.045em] [overflow-wrap:anywhere] sm:text-6xl">
              {journey.name}
            </h1>
            {journey.reason ? (
              <p className="mb-0 max-w-[60ch] text-ink/60 leading-relaxed">{journey.reason}</p>
            ) : null}
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-8 border-ink/15 border-t pt-4 md:min-w-72 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <div>
              <dt className="mb-1 font-bold text-ink/60 text-sm">Pomodoros</dt>
              <dd className="mb-0 font-bold text-2xl tabular-nums">
                {progress.totalPomodoros.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-bold text-ink/60 text-sm">Focused time</dt>
              <dd className="mb-0 font-bold text-lg tabular-nums">
                {formatFocusedTime(progress.focusedMinutes)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <JourneyDetailProgress
            focusedMinutes={progress.focusedMinutes}
            totalPomodoros={progress.totalPomodoros}
            targetBlocks={detail.targetBlocks}
            totalBlocks={detail.totalBlocks}
            totalSections={detail.totalSections}
            currentSectionIndex={detail.currentSectionIndex}
            currentSectionStart={detail.currentSectionStart}
            currentSectionCount={detail.currentSectionCount}
            currentMilestone={detail.currentMilestone}
            nextMilestone={detail.nextMilestone}
            nextMilestonePercentage={detail.nextMilestonePercentage}
            remainingPomodoros={detail.remainingPomodoros}
            latestIndex={detail.latestIndex}
            milestoneIndexes={detail.milestoneIndexes}
            getBlockContributions={detail.getBlockContributions}
            nextSteps={detail.nextSteps}
            readOnly={readOnly}
          />
        </div>
        <div className="order-1 lg:order-2">
          <JourneyDetailCurrentStep
            journeyId={journey.id}
            currentStep={currentStep}
            primaryAction={startAction}
            onRequestAdd={() => setAddOpen(true)}
            readOnly={readOnly}
          />
          {journey.status !== 'active' ? (
            <p className="mt-5 mb-0 rounded-lg border border-ink/15 p-4 text-ink/60 text-sm">
              This Journey is {journey.status}. Make it active to start a Focus session.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <JourneyDetailNextSteps
          journeyId={journey.id}
          upcomingSteps={detail.upcomingSteps}
          addOpen={addOpen}
          onAddOpenChange={setAddOpen}
          readOnly={readOnly}
        />
        <JourneyDetailRecentSessions sessions={detail.recentSessions} />
      </section>
    </ApplicationLayout>
  );
}

export function JourneyDetailScreen({
  journeyId,
  readOnly = false,
  state,
  showNavigationItems = true,
}: {
  journeyId: string;
  readOnly?: boolean;
  state?: AppState;
  showNavigationItems?: boolean;
}) {
  if (state !== undefined) {
    return (
      <JourneyContent
        state={state}
        journeyId={journeyId}
        readOnly={readOnly}
        showNavigationItems={showNavigationItems}
      />
    );
  }

  return (
    <ApplicationStateBoundary>
      {(persistedState) => (
        <JourneyContent
          state={persistedState}
          journeyId={journeyId}
          readOnly={readOnly}
          showNavigationItems={showNavigationItems}
        />
      )}
    </ApplicationStateBoundary>
  );
}
