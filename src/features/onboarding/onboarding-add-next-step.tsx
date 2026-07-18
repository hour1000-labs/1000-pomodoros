import { Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
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
const nextStepPreviewBlockIds = Array.from(
  { length: FIRST_MILESTONE_POMODOROS },
  (_, index) => `next-step-preview-block-${index + 1}`
);

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

function NextStepPreview({ journeyName }: { journeyName: string }) {
  return (
    <aside className="hidden max-w-sm lg:block" aria-hidden="true">
      <p className="mb-8 font-bold text-[0.75rem] text-ink/60 uppercase tracking-[0.22em]">
        Ready to begin
      </p>
      <div className="mb-7 h-px w-full bg-ink" />
      <span className="mb-5 block size-10 rounded-full border-2 border-ink bg-pomodoro-red shadow-[2px_2px_0_var(--ink)]" />
      <p className="mb-9 font-bold text-3xl leading-[1.08] tracking-[-0.035em] [overflow-wrap:anywhere]">
        {journeyName}
      </p>
      <div className="mb-6 border-ink border-y py-5">
        <p className="mb-2 font-bold text-[0.68rem] text-ink/55 uppercase tracking-[0.16em]">
          First focus session
        </p>
        <p className="mb-0 font-bold text-5xl tabular-nums tracking-[-0.05em]">25:00</p>
      </div>
      <p className="mb-8 max-w-[30ch] text-base text-ink/60 leading-relaxed">
        One concrete action is all you need before the first pomodoro begins.
      </p>
      <div className="grid w-fit grid-cols-5 gap-2">
        {nextStepPreviewBlockIds.map((blockId) => (
          <span className="size-7 rounded-sm border border-ink/70 bg-paper" key={blockId} />
        ))}
      </div>
      <p className="mt-5 mb-0 font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.18em]">
        Your first block is waiting
      </p>
    </aside>
  );
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
      void navigate({ to: '/focus' });
      return;
    }

    submissionInFlight.current = false;
    onCompletionFailure();
    setPendingAction(null);
    setSaveError('Your Journey could not be created. Your draft is still saved. Try again.');
  }

  return (
    <OnboardingLayout className="items-start py-3 sm:py-6 md:items-center md:py-12 [@media(max-height:760px)]:py-0">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
        <NextStepPreview journeyName={draft.journeyName} />

        <section className="w-full min-w-0 max-w-[42rem] lg:justify-self-end">
          <div className="mb-4 flex items-center gap-4 sm:mb-6 [@media(max-height:720px)]:mb-2">
            <p className="mb-0 shrink-0 font-bold text-[0.75rem] uppercase tracking-[0.18em]">
              4 of 4
            </p>
            <span className="h-px w-24 bg-pomodoro-red" aria-hidden="true" />
            <p className="mb-0 hidden font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.16em] sm:block">
              Your first step
            </p>
          </div>

          <div className="mb-3 flex items-center gap-3 sm:mb-4 [@media(max-height:620px)]:hidden">
            <span
              className="block size-7 rounded-full border-2 border-ink bg-pomodoro-red"
              aria-hidden="true"
            />
            <p className="mb-0 min-w-0 font-bold text-sm [overflow-wrap:anywhere]">
              {draft.journeyName}
            </p>
          </div>

          <h1 className="mb-3 max-w-[14ch] font-bold text-4xl leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem] [@media(max-height:720px)]:mb-2 [@media(max-height:720px)]:text-3xl">
            What is the next thing you can work on?
          </h1>

          <form noValidate onSubmit={handleSubmit}>
            <label
              className="mb-2 block font-bold text-[0.75rem] uppercase tracking-[0.12em]"
              htmlFor="first-next-step"
            >
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
              className="h-16 w-full min-w-0 rounded-none border-2 border-ink bg-paper px-4 font-bold text-lg shadow-[5px_5px_0_var(--pomodoro-red)] focus-visible:border-ink sm:h-20 sm:px-6 sm:text-xl [@media(max-height:620px)]:h-14"
              onBlur={() => setHasBlurred(true)}
              onChange={(event) => {
                setNextStepTitle(event.target.value);
                setSaveError(null);
              }}
            />
            <p
              className="mt-3 mb-0 border-pomodoro-red border-l-2 py-1 pl-4 text-ink/65 text-sm leading-relaxed [@media(max-height:620px)]:mt-2 [@media(max-height:620px)]:text-xs"
              id="first-next-step-helper"
            >
              Choose one action you can make progress on in your next session.
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

            <div className="mt-6 border-ink border-t pt-5 sm:mt-8 sm:flex sm:items-end sm:justify-between sm:gap-6 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:pt-3">
              <div className="mb-4 sm:mb-0 [@media(max-height:620px)]:hidden">
                <p className="mb-1 font-bold text-[0.68rem] text-ink/55 uppercase tracking-[0.15em]">
                  You are ready
                </p>
                <p className="mb-0 max-w-[23ch] font-bold text-base leading-snug">
                  Start a 25-minute session and make your first pomodoro visible.
                </p>
              </div>
              <PrimaryButton
                type="submit"
                className="w-full shadow-[4px_4px_0_var(--ink)] sm:w-auto sm:min-w-56"
                disabled={pendingAction !== null}
              >
                <Play aria-hidden="true" className="size-4 fill-current" />
                {pendingAction === 'submit' ? 'Creating Journey…' : 'Start first pomodoro'}
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
      return <Navigate to="/focus" replace />;
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
