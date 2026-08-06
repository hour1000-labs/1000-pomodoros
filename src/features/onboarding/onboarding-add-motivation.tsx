import { Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { PomodoroBlock } from '@/components/shared/pomodoro-block';
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
const journeyPreviewPomodoroIds = Array.from(
  { length: 32 },
  (_, index) => `journey-preview-pomodoro-${index + 1}`
);

type SaveAction = 'back' | 'skip' | 'continue';

function JourneyPreview({ journeyName }: { journeyName: string }) {
  return (
    <aside className="hidden max-w-sm lg:block" aria-hidden="true">
      <p className="mb-5 font-bold text-xl leading-tight [overflow-wrap:anywhere]">{journeyName}</p>
      <div className="grid w-fit grid-cols-8 gap-2" aria-hidden="true">
        {journeyPreviewPomodoroIds.map((pomodoroId, index) => (
          <PomodoroBlock
            key={pomodoroId}
            state={index < 9 ? 'complete' : 'future'}
            label={`Pomodoro ${index + 1}, ${index < 9 ? 'complete' : 'not started'}`}
            className="size-7"
          />
        ))}
      </div>
      <p className="mt-4 mb-0 text-ink/60 text-sm">9 Pomodoros</p>
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
    <OnboardingLayout>
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <JourneyPreview journeyName={draft.journeyName} />

        <section className="w-full min-w-0 max-w-[42rem] lg:justify-self-end">
          <div className="mb-6 flex items-center gap-3">
            <p className="mb-0 shrink-0 font-bold text-ink/60 text-sm">2 of 4</p>
            <span className="h-px w-24 bg-ink/20" aria-hidden="true">
              <span className="block h-px w-1/2 bg-pomodoro-red" />
            </span>
          </div>

          <p className="mb-3 min-w-0 font-bold text-ink/60 text-sm [overflow-wrap:anywhere]">
            {draft.journeyName}
          </p>

          <h1 className="mb-7 max-w-[13ch] font-bold text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Why does it matter?
          </h1>

          <form noValidate onSubmit={handleSubmit}>
            <label
              className="mb-2 flex items-center justify-between gap-4 font-bold text-sm"
              htmlFor="journey-reason"
            >
              <span>Reason</span>
              <span className="font-normal text-ink/60">Optional</span>
            </label>
            <Textarea
              id="journey-reason"
              name="reason"
              value={reason}
              placeholder={sampleReason}
              maxLength={REASON_MAX_LENGTH}
              autoComplete="off"
              aria-describedby={showCharacterCount ? 'journey-reason-count' : undefined}
              className="h-32 min-h-0 w-full min-w-0 max-w-full resize-none border-ink/50 bg-paper px-4 py-3 text-base leading-relaxed sm:h-36 sm:text-lg"
              onChange={(event) => {
                setReason(event.target.value);
                setSaveError(null);
              }}
            />
            {showCharacterCount ? (
              <p
                className="mt-2 mb-0 text-right text-ink/60 text-sm tabular-nums"
                id="journey-reason-count"
              >
                {reason.length} / {REASON_MAX_LENGTH}
              </p>
            ) : null}

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
                className="col-span-2 w-full sm:w-auto sm:min-w-36"
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
