import { Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/use-app-state';
import type { OnboardingDraft } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { OnboardingLayout } from './components/onboarding-layout';

const REASON_MAX_LENGTH = 240;
const REASON_COUNT_THRESHOLD = 180;
const LEARN_GUITAR_SAMPLE_REASON = 'I want to play my favorite songs confidently.';
const journeyPreviewBlockIds = Array.from(
  { length: 32 },
  (_, index) => `journey-preview-block-${index + 1}`
);

type SaveAction = 'back' | 'skip' | 'continue';

function JourneyPreview({ journeyName }: { journeyName: string }) {
  return (
    <aside className="hidden max-w-sm lg:block" aria-hidden="true">
      <p className="mb-8 font-bold text-[0.75rem] text-ink/60 uppercase tracking-[0.22em]">
        Your Journey
      </p>
      <div className="mb-7 h-px w-full bg-ink" />
      <span
        className="mb-5 block size-10 rounded-full border-2 border-ink bg-pomodoro-red shadow-[2px_2px_0_var(--ink)]"
        aria-hidden="true"
      />
      <p className="mb-3 font-bold text-3xl leading-[1.08] tracking-[-0.035em] [overflow-wrap:anywhere]">
        {journeyName}
      </p>
      <p className="mb-10 max-w-[28ch] text-base text-ink/60 leading-relaxed">
        A little context helps you return to what matters when practice feels hard.
      </p>
      <div className="grid w-fit grid-cols-8 gap-2" aria-hidden="true">
        {journeyPreviewBlockIds.map((blockId, index) => (
          <span
            className={
              index < 9
                ? 'size-7 rounded-sm border border-ink bg-pomodoro-red'
                : 'size-7 rounded-sm border border-ink/70 bg-paper'
            }
            key={blockId}
          />
        ))}
      </div>
      <p className="mt-5 mb-0 font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.18em]">
        A record of your effort
      </p>
    </aside>
  );
}

function MotivationForm({ draft }: { draft: OnboardingDraft }) {
  const navigate = useNavigate({ from: '/onboarding/motivation' });
  const [reason, setReason] = useState(draft.reason);
  const [pendingAction, setPendingAction] = useState<SaveAction | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const showCharacterCount = reason.length > REASON_COUNT_THRESHOLD;
  const sampleReason =
    draft.journeyName.toLocaleLowerCase() === 'learn guitar' ? LEARN_GUITAR_SAMPLE_REASON : '';

  async function saveAndNavigate(
    nextReason: string,
    to: '/onboarding/journey' | '/onboarding/target',
    action: SaveAction
  ) {
    setPendingAction(action);
    setSaveError(null);

    await Promise.resolve();
    const result = appRepository.saveOnboardingDraft({
      ...draft,
      reason: nextReason,
      updatedAt: new Date().toISOString(),
    });

    if (result.status === 'saved') {
      void navigate({ to });
      return;
    }

    setPendingAction(null);
    setSaveError('Your reason could not be saved. Try again.');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveAndNavigate(reason, '/onboarding/target', 'continue');
  }

  return (
    <OnboardingLayout className="items-start py-3 sm:py-6 md:items-center md:py-12">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
        <JourneyPreview journeyName={draft.journeyName} />

        <section className="w-full min-w-0 max-w-[42rem] lg:justify-self-end">
          <div className="mb-4 flex items-center gap-4 sm:mb-6">
            <p className="mb-0 shrink-0 font-bold text-[0.75rem] uppercase tracking-[0.18em]">
              2 of 4
            </p>
            <span className="h-px w-24 bg-ink/20" aria-hidden="true">
              <span className="block h-px w-1/2 bg-pomodoro-red" />
            </span>
            <p className="mb-0 hidden font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.16em] sm:block">
              Your motivation
            </p>
          </div>

          <div className="mb-3 flex items-center gap-3 sm:mb-4">
            <span
              className="block size-7 rounded-full border-2 border-ink bg-pomodoro-red"
              aria-hidden="true"
            />
            <p className="mb-0 min-w-0 font-bold text-sm [overflow-wrap:anywhere]">
              {draft.journeyName}
            </p>
          </div>

          <h1 className="mb-3 max-w-[13ch] font-bold text-4xl leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]">
            Why does this matter to you?
          </h1>
          <p className="mb-5 max-w-[54ch] text-base text-ink/60 leading-relaxed sm:mb-7 sm:text-lg [@media(max-height:640px)]:hidden">
            A few words can make it easier to stay connected to the practice you are building.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <label
              className="mb-2 flex items-center justify-between gap-4 font-bold text-[0.75rem] uppercase tracking-[0.12em]"
              htmlFor="journey-reason"
            >
              <span>Your reason</span>
              <span className="text-ink/50">Optional</span>
            </label>
            <div className="border-2 border-ink bg-paper px-5 shadow-[5px_5px_0_var(--pomodoro-red)] focus-within:ring-2 focus-within:ring-ink focus-within:ring-offset-2">
              <Textarea
                id="journey-reason"
                name="reason"
                value={reason}
                placeholder={sampleReason}
                maxLength={REASON_MAX_LENGTH}
                autoComplete="off"
                aria-describedby={
                  showCharacterCount
                    ? 'journey-reason-helper journey-reason-count'
                    : 'journey-reason-helper'
                }
                className="h-32 min-h-0 w-full min-w-0 max-w-full resize-none rounded-none border-0 bg-paper px-0 py-4 font-bold text-lg leading-relaxed shadow-none focus-visible:border-transparent focus-visible:ring-0 sm:h-40 sm:text-xl [@media(max-height:640px)]:h-24"
                onChange={(event) => {
                  setReason(event.target.value);
                  setSaveError(null);
                }}
              />
              <div className="flex min-h-10 items-center justify-between gap-4 border-ink/15 border-t py-2">
                <p
                  className="mb-0 font-bold text-[0.68rem] text-ink/55 uppercase tracking-[0.12em]"
                  id="journey-reason-helper"
                >
                  <span className="mr-2 text-pomodoro-red" aria-hidden="true">
                    ●
                  </span>
                  Your reason is for you
                </p>
                {showCharacterCount ? (
                  <p
                    className="mb-0 shrink-0 font-bold text-[0.72rem] text-ink/60 tabular-nums"
                    id="journey-reason-count"
                  >
                    {reason.length} / {REASON_MAX_LENGTH}
                  </p>
                ) : null}
              </div>
            </div>

            {saveError ? (
              <p className="mt-2 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-7 sm:flex sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="link"
                className="justify-self-start px-0 text-ink"
                disabled={pendingAction !== null}
                onClick={() => void saveAndNavigate(reason, '/onboarding/journey', 'back')}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {pendingAction === 'back' ? 'Saving…' : 'Back'}
              </Button>
              <Button
                type="button"
                variant="link"
                className="justify-self-end px-0 text-ink/60 sm:mr-3 sm:ml-auto"
                disabled={pendingAction !== null}
                onClick={() => void saveAndNavigate('', '/onboarding/target', 'skip')}
              >
                {pendingAction === 'skip' ? 'Saving…' : 'Skip for now'}
              </Button>
              <PrimaryButton
                type="submit"
                className="col-span-2 w-full shadow-[4px_4px_0_var(--ink)] sm:w-auto sm:min-w-36"
                disabled={pendingAction !== null}
              >
                {pendingAction === 'continue' ? 'Saving…' : 'Continue'}
                <ArrowRight aria-hidden="true" className="size-4" />
              </PrimaryButton>
            </div>
          </form>
        </section>
      </div>
    </OnboardingLayout>
  );
}

export function OnboardingAddMotivation() {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <OnboardingLayout>
        <LoadingState label="Loading motivation draft" />
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
    return <Navigate to="/onboarding/journey" replace />;
  }

  return <MotivationForm draft={hydration.state.onboardingDraft} />;
}
