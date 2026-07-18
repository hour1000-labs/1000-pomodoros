import { Link } from '@tanstack/react-router';
import { ArrowLeft, PauseCircle, Play, Plus } from 'lucide-react';
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
        description="This Journey is unavailable or may have been removed. Return Home to choose another path."
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
    <PrimaryButton asChild className="w-full shadow-[4px_4px_0_var(--ink)]">
      <Link
        to="/focus"
        search={{ journeyId, nextStepId: nextStep.id }}
        aria-label={`Start 25:00 for ${nextStep.title}`}
      >
        <Play aria-hidden="true" />
        Start 25:00
      </Link>
    </PrimaryButton>
  );
}

function JourneyContent({ state, journeyId }: { state: AppState; journeyId: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const detail = deriveJourneyDetailData(state, journeyId);

  if (!detail) return <JourneyNotFoundState state={state} />;

  const { journey, progress, currentStep } = detail;
  const canStart = journey.status === 'active' && currentStep !== null;
  const startAction = canStart ? (
    <StartAction journeyId={journey.id} nextStep={currentStep} />
  ) : undefined;
  const mobileDock =
    journey.status === 'active' ? (
      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 h-15 bg-paper px-5 pt-3 md:hidden">
        {currentStep ? (
          <StartAction journeyId={journey.id} nextStep={currentStep} />
        ) : (
          <PrimaryButton
            type="button"
            className="w-full shadow-[4px_4px_0_var(--ink)]"
            onClick={() => setAddOpen(true)}
          >
            <Plus aria-hidden="true" />
            Add a Next step
          </PrimaryButton>
        )}
      </div>
    ) : undefined;

  return (
    <ApplicationLayout journeyId={journey.id} className="pb-12 md:pb-16" mobileDock={mobileDock}>
      <header className="border-ink border-b pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="mb-4 font-bold text-[0.68rem] text-pomodoro-red uppercase tracking-[0.18em]">
              A Journey in practice
            </p>
            <h1 className="mb-3 max-w-[18ch] font-bold text-5xl leading-[1.02] tracking-[-0.045em] [overflow-wrap:anywhere] sm:text-6xl">
              {journey.name}
            </h1>
            {journey.reason ? (
              <p className="mb-0 max-w-[60ch] text-ink/60 text-lg leading-relaxed">
                “{journey.reason}”
              </p>
            ) : null}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-2 border-ink border-y py-4 md:min-w-72">
            <div>
              <p className="mb-1 font-bold text-[0.62rem] text-ink/65 uppercase tracking-[0.14em]">
                Pomodoros
              </p>
              <p className="mb-0 font-bold text-2xl tabular-nums">
                {progress.totalPomodoros.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </p>
            </div>
            <div>
              <p className="mb-1 font-bold text-[0.62rem] text-ink/65 uppercase tracking-[0.14em]">
                Focused time
              </p>
              <p className="mb-0 font-bold text-lg tabular-nums">
                {formatFocusedTime(progress.focusedMinutes)}
              </p>
            </div>
          </div>
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
          />
        </div>
        <div className="order-1 lg:order-2">
          <JourneyDetailCurrentStep
            journeyId={journey.id}
            currentStep={currentStep}
            primaryAction={startAction}
            onRequestAdd={() => setAddOpen(true)}
          />
          {journey.status !== 'active' ? (
            <div className="mt-5 flex gap-3 rounded-lg border border-ink/15 bg-ink/[0.03] p-4">
              <PauseCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink/65" />
              <p className="mb-0 text-ink/60 text-sm">
                This Journey is {journey.status}. Focus sessions can start again when it is active.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <JourneyDetailNextSteps
          journeyId={journey.id}
          upcomingSteps={detail.upcomingSteps}
          addOpen={addOpen}
          onAddOpenChange={setAddOpen}
        />
        <JourneyDetailRecentSessions sessions={detail.recentSessions} />
      </section>
    </ApplicationLayout>
  );
}

export function JourneyDetailScreen({ journeyId }: { journeyId: string }) {
  return (
    <ApplicationStateBoundary>
      {(state) => <JourneyContent state={state} journeyId={journeyId} />}
    </ApplicationStateBoundary>
  );
}
