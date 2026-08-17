import { Link } from '@tanstack/react-router';
import { ArrowLeft, Ellipsis, Pencil, Plus, Target } from 'lucide-react';
import { useRef, useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deriveJourneyDetailData } from '@/features/journeys/journey-detail-data';
import { useCurrentLocalDate } from '@/hooks/use-current-local-date';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import type { AppState, NextStep } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';
import { JourneyDetailEditNameDialog } from './components/journey-detail-edit-name-dialog';
import {
  JourneyDetailCurrentStep,
  JourneyDetailNextSteps,
} from './components/journey-detail-next-steps';
import { JourneyDetailProgress } from './components/journey-detail-progress';
import { JourneyDetailRecentSessions } from './components/journey-detail-recent-sessions';

function JourneyNotFoundState() {
  return (
    <ApplicationLayout>
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
        data-current-next-step-start
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
  const [journeyNameEditOpen, setJourneyNameEditOpen] = useState(false);
  const journeyNameMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const now = useCurrentLocalDate();
  const detail = deriveJourneyDetailData(state, journeyId);

  if (!detail) return <JourneyNotFoundState />;

  const { journey, progress, currentStep } = detail;
  const activeSession = state.focusSessions.find(
    (session) =>
      session.journeyId === journey.id &&
      (session.status === 'running' || session.status === 'paused')
  );
  const activeSessionNextStepId = activeSession?.nextStepId ?? null;
  const sessionReferencedNextStepIds = state.focusSessions.flatMap((session) =>
    session.journeyId === journey.id && session.nextStepId !== null ? [session.nextStepId] : []
  );
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
      className="pb-12 md:pb-16"
      mobileDock={mobileDock}
      showNavigationItems={showNavigationItems}
    >
      <header className="border-ink/8 border-b pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-2">
              <h1 className="mb-0 min-w-0 max-w-[18ch] flex-1 font-extrabold text-5xl text-ink leading-[1.02] tracking-[-0.045em] [overflow-wrap:anywhere] sm:text-6xl">
                {journey.name}
              </h1>
              {!readOnly ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={journeyNameMenuTriggerRef}
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="mt-1 shrink-0"
                      aria-label={`Journey actions for ${journey.name}`}
                    >
                      <Ellipsis aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setJourneyNameEditOpen(true)}>
                      <Pencil aria-hidden="true" />
                      Edit name
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/journeys/$journeyId/target" params={{ journeyId: journey.id }}>
                        <Target aria-hidden="true" />
                        Edit target
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            {journey.reason ? (
              <p className="mt-2 mb-0 max-w-[60ch] text-ink/65 leading-relaxed">{journey.reason}</p>
            ) : null}
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-8 border-ink/8 border-t pt-4 md:min-w-72 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <div>
              <dt className="mb-1 font-bold text-ink/60 text-xs uppercase tracking-wider">
                Pomodoros
              </dt>
              <dd className="mb-0 font-extrabold text-3xl text-ink tabular-nums tracking-tight">
                {progress.totalPomodoros.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-bold text-ink/60 text-xs uppercase tracking-wider">
                Focused time
              </dt>
              <dd className="mb-0 font-extrabold text-2xl text-ink tabular-nums tracking-tight">
                {formatFocusedDuration(progress.focusedMinutes)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <JourneyDetailProgress
            state={state}
            now={now}
            journeyId={detail.journey.id}
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
            readOnly={readOnly}
          />
        </div>
        <div className="order-1 lg:order-2">
          <JourneyDetailCurrentStep
            journeyId={journey.id}
            currentStep={currentStep}
            primaryAction={startAction}
            onRequestAdd={() => setAddOpen(true)}
            hasActiveFocusSession={activeSessionNextStepId === currentStep?.id}
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
          activeSessionNextStepId={activeSessionNextStepId}
          sessionReferencedNextStepIds={sessionReferencedNextStepIds}
          readOnly={readOnly}
        />
        <JourneyDetailRecentSessions sessions={detail.recentSessions} />
      </section>

      {!readOnly ? (
        <JourneyDetailEditNameDialog
          kind="journey"
          value={journey.name}
          open={journeyNameEditOpen}
          onOpenChange={setJourneyNameEditOpen}
          onSave={(name) => appRepository.renameJourney(journey.id, name)}
          getReturnFocus={() => journeyNameMenuTriggerRef.current}
        />
      ) : null}
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
    <ApplicationStateBoundary variant="journey">
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
