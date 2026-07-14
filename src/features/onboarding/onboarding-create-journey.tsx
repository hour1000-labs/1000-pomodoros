import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingState } from '@/components/shared/loading-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/hooks/use-app-state';
import type { AppState, OnboardingDraft } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { OnboardingLayout } from './components/onboarding-layout';

const JOURNEY_NAME_MAX_LENGTH = 80;
const DEFAULT_TARGET_MINUTES = 1_000 * 60;
const journeyExamples = ['Learn Spanish', 'Build my portfolio', 'Improve at chess'];
const progressPreviewBlockIds = Array.from(
  { length: 32 },
  (_, index) => `progress-preview-block-${index + 1}`
);

function getJourneyNameError(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return 'Enter a Journey name to continue.';
  }

  if (trimmedValue.length > JOURNEY_NAME_MAX_LENGTH) {
    return `Journey name must be ${JOURNEY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

function ProgressPreview() {
  return (
    <aside className="hidden max-w-sm lg:block" aria-hidden="true">
      <p className="mb-8 font-bold text-[0.75rem] text-ink/60 uppercase tracking-[0.22em]">
        Your practice, made visible
      </p>
      <div className="mb-7 h-px w-full bg-ink" />
      <p className="mb-10 max-w-[15ch] font-bold text-3xl leading-[1.08] tracking-[-0.035em]">
        Every big thing begins with one focused session.
      </p>
      <div className="grid w-fit grid-cols-8 gap-2">
        {progressPreviewBlockIds.map((blockId, index) => (
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
        One block = 25 minutes
      </p>
    </aside>
  );
}

function JourneyForm({ state }: { state: AppState }) {
  const savedDraft = state.onboardingDraft;
  const navigate = useNavigate({ from: '/onboarding/journey' });
  const [journeyName, setJourneyName] = useState(savedDraft?.journeyName ?? '');
  const [hasBlurred, setHasBlurred] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const validationError = getJourneyNameError(journeyName);
  const showValidation = (hasBlurred || submitted) && validationError !== null;
  const hasDraftData = savedDraft !== null || journeyName.trim().length > 0;

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
      description="Your Journey draft will be discarded and you will return to the landing page."
      confirmLabel="Discard and exit"
      onConfirm={discardDraftAndExit}
    />
  ) : (
    <Button asChild variant="link" className="min-w-11 px-0 text-ink">
      <Link to="/">Exit</Link>
    </Button>
  );

  return (
    <OnboardingLayout headerAction={exitAction}>
      <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
        <ProgressPreview />

        <section className="w-full max-w-[42rem] lg:justify-self-end">
          <div className="mb-7 flex items-center gap-4">
            <p className="mb-0 shrink-0 font-bold text-[0.75rem] uppercase tracking-[0.18em]">
              1 of 4
            </p>
            <span className="h-px w-24 bg-ink/20" aria-hidden="true">
              <span className="block h-px w-1/4 bg-pomodoro-red" />
            </span>
            <p className="mb-0 hidden font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.16em] sm:block">
              Create your Journey
            </p>
          </div>

          <h1 className="mb-4 max-w-[15ch] font-bold text-4xl leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]">
            What do you want to make progress on?
          </h1>
          <p className="mb-8 max-w-[58ch] text-base text-ink/60 leading-relaxed sm:text-lg">
            Start with one skill, project, or long-term goal. You can add more Journeys later.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <label
              className="mb-2 block font-bold text-[0.75rem] uppercase tracking-[0.12em]"
              htmlFor="journey-name"
            >
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
              className="h-16 rounded-none border-2 border-ink px-5 font-bold text-xl shadow-[5px_5px_0_var(--pomodoro-red)] focus-visible:border-ink sm:text-2xl"
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
              <legend className="mb-3 font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.12em]">
                Or start with an idea
              </legend>
              <div className="flex flex-wrap gap-2">
                {journeyExamples.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    className="rounded-full border-ink/25 bg-paper px-4 font-normal text-sm"
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
                className="min-w-36 shadow-[4px_4px_0_var(--ink)]"
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

export function OnboardingCreateJourney() {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <OnboardingLayout>
        <LoadingState label="Loading Journey draft" />
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

  return <JourneyForm state={hydration.state} />;
}
