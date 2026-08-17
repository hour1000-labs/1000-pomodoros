import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import {
  getCustomHoursError,
  getInitialCustomHours,
  getInitialSelection,
  TargetPicker,
  type TargetSelection,
  targetSelectionToMinutes,
} from '@/components/shared/target-picker';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import type { OnboardingDraft } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { OnboardingLayout } from './components/onboarding-layout';

export { hoursToPomodoros } from '@/components/shared/target-picker';

function TargetForm({ draft }: { draft: OnboardingDraft }) {
  const navigate = useNavigate({ from: '/onboarding/target' });
  const initialSelection = getInitialSelection(draft.targetMinutes);
  const [selection, setSelection] = useState<TargetSelection>(initialSelection);
  const [customHours, setCustomHours] = useState(getInitialCustomHours(draft.targetMinutes));
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
    const result = appRepository.saveOnboardingDraft({
      ...draft,
      targetMinutes,
      updatedAt: new Date().toISOString(),
    });

    if (result.status === 'saved') {
      void navigate({ to: '/onboarding/next-step' });
      return;
    }

    setIsSaving(false);
    setSaveError('Your target could not be saved. Try again.');
  }

  return (
    <OnboardingLayout>
      <div className="mx-auto w-full max-w-[42rem]">
        <section className="w-full min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <p className="mb-0 shrink-0 font-bold text-ink/60 text-sm">3 of 4</p>
            <span className="h-px w-24 bg-ink/20" aria-hidden="true">
              <span className="block h-px w-3/4 bg-pomodoro-red" />
            </span>
          </div>

          <p className="mb-3 min-w-0 font-bold text-ink/60 text-sm [overflow-wrap:anywhere]">
            {draft.journeyName}
          </p>

          <h1 className="mb-3 max-w-[14ch] font-extrabold text-4xl text-ink leading-[1.06] tracking-[-0.04em] sm:text-5xl">
            Choose a focus target
          </h1>
          <p className="mb-7 text-base text-ink/65">You can change it later.</p>

          <form noValidate onSubmit={handleSubmit}>
            <TargetPicker
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

            <div className="mt-6 flex items-center justify-between">
              <Button asChild variant="link" className="px-0 text-ink">
                <Link to="/onboarding/motivation">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back
                </Link>
              </Button>
              <PrimaryButton type="submit" className="min-w-36" disabled={isSaving}>
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

export function OnboardingChooseTarget() {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <OnboardingLayout>
        <LoadingState label="Loading target draft" variant="form" />
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

  return <TargetForm draft={hydration.state.onboardingDraft} />;
}
