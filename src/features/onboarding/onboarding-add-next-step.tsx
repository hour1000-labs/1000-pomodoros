import { Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/hooks/use-app-state';
import type { Journey, Milestone, NextStep, OnboardingDraft } from '@/lib/models';
import { getNextStepError, NEXT_STEP_MAX_LENGTH } from '@/lib/next-step';
import { appRepository } from '@/lib/repository';

import { OnboardingLayout } from './components/onboarding-layout';

const FIRST_MILESTONE_POMODOROS = 10;
const MINUTES_PER_POMODORO = 25;
const LEARN_GUITAR_SAMPLE_STEP = 'Practice the F chord transition';
function getInitialNextStep(draft: OnboardingDraft) {
  if (draft.nextStepTitle.length > 0) return draft.nextStepTitle;
  return draft.journeyName.trim().toLocaleLowerCase() === 'learn guitar'
    ? LEARN_GUITAR_SAMPLE_STEP
    : '';
}

export { getNextStepError };

function getRecordSuffix(draft: OnboardingDraft) {
  return draft.startedAt.replace(/[^a-zA-Z0-9]/g, '').toLocaleLowerCase();
}

export function createOnboardingRecords(
  draft: OnboardingDraft,
  nextStepTitle: string,
  completedAt: string
): { journey: Journey; nextStep: NextStep; milestone: Milestone } {
  const suffix = getRecordSuffix(draft);
  const journeyId = `journey-onboarding-${suffix}`;

  return {
    journey: {
      id: journeyId,
      name: draft.journeyName.trim(),
      reason: draft.reason.trim(),
      targetMinutes: draft.targetMinutes,
      status: 'active',
      createdAt: draft.startedAt,
      updatedAt: completedAt,
      lastActiveAt: completedAt,
    },
    nextStep: {
      id: `next-step-onboarding-${suffix}`,
      journeyId,
      title: nextStepTitle.trim(),
      description: '',
      status: 'current',
      position: 0,
      createdAt: completedAt,
      completedAt: null,
    },
    milestone: {
      id: `milestone-onboarding-${suffix}-10-pomodoros`,
      journeyId,
      name: '10 pomodoros',
      targetFocusedMinutes: FIRST_MILESTONE_POMODOROS * MINUTES_PER_POMODORO,
      earnedAt: null,
    },
  };
}

function NextStepForm({
  draft,
  onCompletionStart,
  onCompletionFailure,
}: {
  draft: OnboardingDraft;
  onCompletionStart: () => void;
  onCompletionFailure: () => void;
}) {
  const navigate = useNavigate({ from: '/onboarding/next-step' });
  const [nextStepTitle, setNextStepTitle] = useState(() => getInitialNextStep(draft));
  const [hasBlurred, setHasBlurred] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'submit' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const nextStepError = getNextStepError(nextStepTitle);
  const showNextStepError = nextStepError !== null && (hasBlurred || submitted);

  async function saveDraftAndGoBack() {
    if (pendingAction !== null) return;

    setPendingAction('back');
    setSaveError(null);
    await Promise.resolve();
    const result = appRepository.saveOnboardingDraft({
      ...draft,
      nextStepTitle,
      updatedAt: new Date().toISOString(),
    });

    if (result.status === 'saved') {
      void navigate({ to: '/onboarding/target' });
      return;
    }

    setPendingAction(null);
    setSaveError('Your Next step could not be saved. Try again.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSaveError(null);

    if (nextStepError !== null || submissionInFlight.current) return;

    submissionInFlight.current = true;
    onCompletionStart();
    setPendingAction('submit');
    await Promise.resolve();
    const completedAt = new Date().toISOString();
    const { journey, nextStep, milestone } = createOnboardingRecords(
      draft,
      nextStepTitle,
      completedAt
    );
    const result = appRepository.finishOnboarding(journey, nextStep, milestone);

    if (result.status === 'saved') {
      void navigate({ to: '/home', replace: true });
      return;
    }

    submissionInFlight.current = false;
    onCompletionFailure();
    setPendingAction(null);
    setSaveError('Your Journey could not be created. Your draft is still saved. Try again.');
  }

  return (
    <OnboardingLayout>
      <div className="mx-auto w-full max-w-[42rem]">
        <section className="w-full min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <p className="mb-0 shrink-0 font-bold text-ink/60 text-sm">4 of 4</p>
            <span className="h-px w-24 bg-pomodoro-red" aria-hidden="true" />
          </div>

          <p className="mb-3 min-w-0 font-bold text-ink/60 text-sm [overflow-wrap:anywhere]">
            {draft.journeyName}
          </p>

          <h1 className="mb-7 max-w-[14ch] font-bold text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Add your first Next step
          </h1>

          <form noValidate onSubmit={handleSubmit}>
            <label className="mb-2 block font-bold text-sm" htmlFor="first-next-step">
              Next step
            </label>
            <Input
              id="first-next-step"
              name="nextStep"
              value={nextStepTitle}
              maxLength={NEXT_STEP_MAX_LENGTH}
              autoComplete="off"
              aria-describedby={
                showNextStepError
                  ? 'first-next-step-helper first-next-step-error'
                  : 'first-next-step-helper'
              }
              aria-invalid={showNextStepError}
              className="h-14 w-full min-w-0 rounded-lg border-ink/50 bg-paper px-4 font-bold text-lg focus-visible:border-ink sm:text-xl"
              onBlur={() => setHasBlurred(true)}
              onChange={(event) => {
                setNextStepTitle(event.target.value);
                setSaveError(null);
              }}
            />
            <p
              className="mt-2 mb-0 text-ink/60 text-sm leading-relaxed"
              id="first-next-step-helper"
            >
              Choose one action for your first Focus session.
            </p>
            {showNextStepError ? (
              <p
                className="mt-2 mb-0 font-bold text-pomodoro-red text-sm"
                id="first-next-step-error"
                role="alert"
              >
                {nextStepError}
              </p>
            ) : null}
            {saveError ? (
              <p className="mt-2 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <PrimaryButton
                type="submit"
                className="w-full sm:w-auto sm:min-w-48"
                disabled={pendingAction !== null}
              >
                {pendingAction === 'submit' ? 'Creating Journey…' : 'Create Journey'}
                <ArrowRight aria-hidden="true" className="size-4" />
              </PrimaryButton>
            </div>

            <Button
              type="button"
              variant="link"
              className="mt-3 px-0 text-ink sm:mt-5"
              disabled={pendingAction !== null}
              onClick={() => void saveDraftAndGoBack()}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {pendingAction === 'back' ? 'Saving…' : 'Back'}
            </Button>
          </form>
        </section>
      </div>
    </OnboardingLayout>
  );
}

export function OnboardingAddNextStep() {
  const completionInFlight = useRef(false);
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <OnboardingLayout>
        <LoadingState label="Loading Next step draft" />
      </OnboardingLayout>
    );
  }

  if (hydration.status === 'error') {
    return (
      <OnboardingLayout>
        <RecoverableErrorState onRetry={hydration.retry} onReset={hydration.reset} />
      </OnboardingLayout>
    );
  }

  if (
    hydration.state.onboardingDraft === null ||
    hydration.state.onboardingDraft.journeyName.trim().length === 0
  ) {
    if (completionInFlight.current && hydration.state.lastActiveJourneyId !== null) {
      return <Navigate to="/home" replace />;
    }

    return <Navigate to="/onboarding/journey" replace />;
  }

  return (
    <NextStepForm
      draft={hydration.state.onboardingDraft}
      onCompletionStart={() => {
        completionInFlight.current = true;
      }}
      onCompletionFailure={() => {
        completionInFlight.current = false;
      }}
    />
  );
}
