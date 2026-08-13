import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingState } from '@/components/shared/loading-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { DEFAULT_TARGET_MINUTES } from '@/components/shared/target-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/hooks/use-app-state';
import { getJourneyNameError } from '@/lib/journey-name';
import type { AppState, OnboardingDraft } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { OnboardingLayout } from './components/onboarding-layout';

const journeyExamples = ['Learn Spanish', 'Build my portfolio', 'Improve at chess'];

function JourneyForm({ state, startFresh }: { state: AppState; startFresh: boolean }) {
  const savedDraft = startFresh ? null : state.onboardingDraft;
  const navigate = useNavigate({ from: '/onboarding/journey' });
  const [journeyName, setJourneyName] = useState(savedDraft?.journeyName ?? '');
  const [hasBlurred, setHasBlurred] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const validationError = getJourneyNameError(journeyName);
  const showValidation = (hasBlurred || submitted) && validationError !== null;
  const hasDraftData = savedDraft !== null || journeyName.trim().length > 0;
  const hasClearedFreshDraft = useRef(!startFresh || state.onboardingDraft === null);

  useEffect(() => {
    if (startFresh && !hasClearedFreshDraft.current && state.onboardingDraft !== null) {
      hasClearedFreshDraft.current = true;
      appRepository.saveOnboardingDraft(null);
    }
  }, [startFresh, state.onboardingDraft]);

  function createDraft(trimmedName: string): OnboardingDraft {
    const now = new Date().toISOString();

    return {
      journeyName: trimmedName,
      reason: savedDraft?.reason ?? '',
      targetMinutes: savedDraft?.targetMinutes ?? DEFAULT_TARGET_MINUTES,
      nextStepTitle: savedDraft?.nextStepTitle ?? '',
      startedAt: savedDraft?.startedAt ?? now,
      updatedAt: now,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSaveError(null);

    if (validationError !== null) return;

    setIsSaving(true);
    await Promise.resolve();
    const result = appRepository.saveOnboardingDraft(createDraft(journeyName.trim()));

    if (result.status === 'saved') {
      void navigate({ to: '/onboarding/motivation' });
      return;
    }

    setIsSaving(false);
    setSaveError('Your Journey could not be saved. Try again.');
  }

  function discardDraftAndExit() {
    setSaveError(null);

    window.setTimeout(() => {
      const result = appRepository.saveOnboardingDraft(null);

      if (result.status === 'saved') {
        void navigate({ to: '/' });
        return;
      }

      setSaveError('Your onboarding draft could not be discarded. Try again.');
    }, 0);
  }

  const exitAction = hasDraftData ? (
    <ConfirmDialog
      trigger={
        <Button variant="link" className="min-w-11 px-0 text-ink">
          Exit
        </Button>
      }
      title="Exit onboarding?"
      description="This deletes your Journey draft and returns to the landing page."
      confirmLabel="Discard draft"
      onConfirm={discardDraftAndExit}
    />
  ) : (
    <Button asChild variant="link" className="min-w-11 px-0 text-ink">
      <Link to="/">Exit</Link>
    </Button>
  );

  return (
    <OnboardingLayout headerAction={exitAction}>
      <div className="mx-auto w-full max-w-[42rem]">
        <section className="w-full">
          <div className="mb-6 flex items-center gap-3">
            <p className="mb-0 shrink-0 font-bold text-ink/60 text-sm">1 of 4</p>
            <span className="h-px w-24 bg-ink/20" aria-hidden="true">
              <span className="block h-px w-1/4 bg-pomodoro-red" />
            </span>
          </div>

          <h1 className="mb-4 max-w-[15ch] font-bold text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            {startFresh ? 'Name your next Journey' : 'Name your first Journey'}
          </h1>
          <p className="mb-8 max-w-[58ch] text-base text-ink/60 leading-relaxed sm:text-lg">
            Track focused work, one pomodoro at a time.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <label className="mb-2 block font-bold text-sm" htmlFor="journey-name">
              Journey name
            </label>
            <Input
              id="journey-name"
              name="journeyName"
              value={journeyName}
              placeholder="Learn guitar"
              autoComplete="off"
              autoFocus={savedDraft?.journeyName.trim().length === 0 || savedDraft === null}
              aria-describedby={showValidation ? 'journey-name-error' : undefined}
              aria-invalid={showValidation}
              className="h-14 rounded-lg border-ink/50 px-4 font-bold text-lg focus-visible:border-ink sm:text-xl"
              onBlur={() => setHasBlurred(true)}
              onChange={(event) => {
                setJourneyName(event.target.value);
                setSaveError(null);
              }}
            />
            <div className="min-h-7 pt-2">
              {showValidation ? (
                <p
                  className="mb-0 font-bold text-pomodoro-red text-sm"
                  id="journey-name-error"
                  role="alert"
                >
                  {validationError}
                </p>
              ) : null}
            </div>

            <fieldset className="mt-4">
              <legend className="mb-3 text-ink/60 text-sm">Try an example</legend>
              <div className="flex flex-wrap gap-2">
                {journeyExamples.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    className="border-ink/50 bg-paper px-4 font-normal text-sm"
                    onClick={() => {
                      setJourneyName(example);
                      setSaveError(null);
                    }}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </fieldset>

            {saveError ? (
              <p className="mt-5 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="mt-9 flex justify-end">
              <PrimaryButton
                type="submit"
                className="min-w-36"
                disabled={journeyName.trim().length === 0 || isSaving}
              >
                {isSaving ? 'Saving…' : 'Continue'}
                <ArrowRight aria-hidden="true" className="size-4" />
              </PrimaryButton>
            </div>
          </form>
        </section>
      </div>
    </OnboardingLayout>
  );
}

export function OnboardingCreateJourney({ startFresh = false }: { startFresh?: boolean }) {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <OnboardingLayout>
        <LoadingState label="Loading Journey draft" variant="form" />
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

  return <JourneyForm state={hydration.state} startFresh={startFresh} />;
}
