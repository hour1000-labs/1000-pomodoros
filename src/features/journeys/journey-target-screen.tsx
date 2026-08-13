import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import {
  getCustomHoursError,
  getInitialCustomHours,
  getInitialSelection,
  TargetPicker,
  type TargetSelection,
  targetSelectionToMinutes,
} from '@/components/shared/target-picker';
import { Button } from '@/components/ui/button';
import type { AppState, Journey } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { ApplicationLayout } from './components/application-layout';
import { ApplicationStateBoundary } from './components/application-state-boundary';

function JourneyTargetNotFound() {
  return (
    <ApplicationLayout>
      <EmptyState
        className="w-full"
        title="Journey not found"
        description="This Journey may have been removed. Your saved progress has not been changed."
        action={
          <PrimaryButton asChild>
            <Link to="/journeys">
              <ArrowLeft aria-hidden="true" />
              Return to Journeys
            </Link>
          </PrimaryButton>
        }
      />
    </ApplicationLayout>
  );
}

function JourneyTargetForm({ journey }: { journey: Journey }) {
  const navigate = useNavigate({ from: '/journeys/$journeyId/target' });

  const initialSelection = getInitialSelection(journey.targetMinutes);
  const [selection, setSelection] = useState<TargetSelection>(initialSelection);
  const [customHours, setCustomHours] = useState(getInitialCustomHours(journey.targetMinutes));
  const [customHasBlurred, setCustomHasBlurred] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const customError = selection === 'custom' ? getCustomHoursError(customHours) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSaveError(null);

    if (customError !== null) return;

    const targetMinutes = targetSelectionToMinutes(selection, customHours);
    if (targetMinutes === null) return;

    setIsSaving(true);
    await Promise.resolve();
    const result = appRepository.updateJourneyTarget(journey.id, targetMinutes);

    if (result.status === 'saved') {
      void navigate({ to: '/journeys/$journeyId', params: { journeyId: journey.id } });
      return;
    }

    setIsSaving(false);
    setSaveError('Your target could not be saved. Nothing changed. Try again.');
  }

  return (
    <ApplicationLayout>
      <div className="mx-auto w-full max-w-[42rem]">
        <section className="w-full min-w-0">
          <p className="mb-3 min-w-0 font-bold text-ink/60 text-sm [overflow-wrap:anywhere]">
            {journey.name}
          </p>
          <h1 className="mb-3 max-w-[14ch] font-bold text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Edit focus target
          </h1>
          <p className="mb-6 text-base text-ink/60">
            Change the finish line. Recorded focused time stays the same.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <TargetPicker
              inputId={`custom-target-hours-${journey.id}`}
              messageIdPrefix={`custom-target-${journey.id}`}
              selection={selection}
              customHours={customHours}
              customHasBlurred={customHasBlurred}
              submitted={submitted}
              onSelect={(nextSelection) => {
                setSelection(nextSelection);
                setSubmitted(false);
                setSaveError(null);
              }}
              onCustomHoursChange={(value) => {
                setCustomHours(value);
                setSaveError(null);
              }}
              onCustomBlur={() => setCustomHasBlurred(true)}
            />

            {saveError ? (
              <p className="mt-2 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4">
              <Button asChild variant="link" className="px-0 text-ink">
                <Link to="/journeys/$journeyId" params={{ journeyId: journey.id }}>
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Cancel
                </Link>
              </Button>
              <PrimaryButton type="submit" className="min-w-36" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save target'}
                <Check aria-hidden="true" className="size-4" />
              </PrimaryButton>
            </div>
          </form>
        </section>
      </div>
    </ApplicationLayout>
  );
}

function JourneyTargetContent({ state, journeyId }: { state: AppState; journeyId: string }) {
  const journey = state.journeys.find(({ id }) => id === journeyId);

  return journey === undefined ? (
    <JourneyTargetNotFound />
  ) : (
    <JourneyTargetForm journey={journey} />
  );
}

export function JourneyTargetScreen({ journeyId }: { journeyId: string }) {
  return (
    <ApplicationStateBoundary variant="form">
      {(state) => <JourneyTargetContent state={state} journeyId={journeyId} />}
    </ApplicationStateBoundary>
  );
}
