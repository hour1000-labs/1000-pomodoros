import { Link, Navigate, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { PrimaryButton } from '@/components/shared/primary-button';
import { RecoverableErrorState } from '@/components/shared/recoverable-error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/hooks/use-app-state';
import type { OnboardingDraft } from '@/lib/models';
import { appRepository } from '@/lib/repository';
import { cn } from '@/lib/utils';

import { OnboardingLayout } from './components/onboarding-layout';

const TARGET_OPTIONS = [10, 25, 100, 1_000] as const;
const MIN_CUSTOM_HOURS = 1;
const MAX_CUSTOM_HOURS = 10_000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_POMODORO = 25;
type TargetSelection = (typeof TARGET_OPTIONS)[number] | 'custom';

export function hoursToPomodoros(hours: number) {
  return (hours * MINUTES_PER_HOUR) / MINUTES_PER_POMODORO;
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function getCustomHoursError(value: string) {
  if (value.trim().length === 0) {
    return 'Enter a custom target to continue.';
  }

  const hours = Number(value);

  if (!Number.isFinite(hours) || hours < MIN_CUSTOM_HOURS || hours > MAX_CUSTOM_HOURS) {
    return `Enter a target from ${formatNumber(MIN_CUSTOM_HOURS)} to ${formatNumber(MAX_CUSTOM_HOURS)} hours.`;
  }

  return null;
}

function getInitialSelection(targetMinutes: number): TargetSelection {
  const targetHours = targetMinutes / MINUTES_PER_HOUR;
  return TARGET_OPTIONS.includes(targetHours as (typeof TARGET_OPTIONS)[number])
    ? (targetHours as (typeof TARGET_OPTIONS)[number])
    : 'custom';
}

function TargetOption({
  hours,
  selected,
  onSelect,
}: {
  hours: (typeof TARGET_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const pomodoros = hoursToPomodoros(hours);

  return (
    <label
      className={cn(
        'relative grid min-h-20 cursor-pointer content-between rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 sm:min-h-24 sm:px-5 sm:py-4',
        selected
          ? 'border-ink bg-ink text-paper'
          : 'border-ink/50 bg-paper text-ink hover:border-ink'
      )}
    >
      <input
        type="radio"
        name="target"
        value={hours}
        checked={selected}
        aria-label={`${formatNumber(hours)} hours, ${formatNumber(pomodoros)} Pomodoros`}
        className="sr-only"
        onChange={onSelect}
      />
      <span className="font-bold text-2xl tabular-nums leading-none tracking-[-0.03em] sm:text-3xl">
        {formatNumber(hours)}
        <span className="mt-1 block font-normal text-sm tracking-normal">hours</span>
      </span>
      <span className={cn('mt-3 text-sm tabular-nums', selected ? 'text-paper/70' : 'text-ink/60')}>
        {formatNumber(pomodoros)} Pomodoros
      </span>
      {selected ? (
        <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-pomodoro-red text-paper">
          <Check aria-hidden="true" className="size-4" />
        </span>
      ) : null}
    </label>
  );
}

function TargetForm({ draft }: { draft: OnboardingDraft }) {
  const navigate = useNavigate({ from: '/onboarding/target' });
  const initialSelection = getInitialSelection(draft.targetMinutes);
  const [selection, setSelection] = useState<TargetSelection>(initialSelection);
  const [customHours, setCustomHours] = useState(
    initialSelection === 'custom' ? String(draft.targetMinutes / MINUTES_PER_HOUR) : ''
  );
  const [customHasBlurred, setCustomHasBlurred] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const customError = selection === 'custom' ? getCustomHoursError(customHours) : null;
  const showCustomError = customError !== null && (customHasBlurred || submitted);
  const customPomodoros = customError === null ? hoursToPomodoros(Number(customHours)) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSaveError(null);

    if (customError !== null) return;

    const targetHours = selection === 'custom' ? Number(customHours) : selection;
    setIsSaving(true);
    await Promise.resolve();
    const result = appRepository.saveOnboardingDraft({
      ...draft,
      targetMinutes: targetHours * MINUTES_PER_HOUR,
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

          <h1 className="mb-3 max-w-[14ch] font-bold text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Choose a focus target
          </h1>
          <p className="mb-6 text-base text-ink/60">You can change it later.</p>

          <form noValidate onSubmit={handleSubmit}>
            <fieldset>
              <legend className="sr-only">Focus target</legend>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {TARGET_OPTIONS.map((hours) => (
                  <TargetOption
                    key={hours}
                    hours={hours}
                    selected={selection === hours}
                    onSelect={() => {
                      setSelection(hours);
                      setSubmitted(false);
                      setSaveError(null);
                    }}
                  />
                ))}
              </div>

              <label
                className={cn(
                  'mt-2 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed px-4 py-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 sm:mt-3 sm:px-5',
                  selection === 'custom' ? 'border-ink bg-ink/5' : 'border-ink/50 bg-paper'
                )}
              >
                <span className="font-bold">Custom</span>
                <span className="text-ink/60 text-sm">Set your own hours</span>
                <input
                  type="radio"
                  name="target"
                  value="custom"
                  checked={selection === 'custom'}
                  aria-label="Custom target"
                  className="sr-only"
                  onChange={() => {
                    setSelection('custom');
                    setSubmitted(false);
                    setSaveError(null);
                  }}
                />
              </label>
            </fieldset>

            {selection === 'custom' ? (
              <div className="mt-3">
                <label className="mb-2 block font-bold text-sm" htmlFor="custom-target-hours">
                  Custom hours
                </label>
                <Input
                  id="custom-target-hours"
                  name="customTargetHours"
                  type="number"
                  inputMode="decimal"
                  min={MIN_CUSTOM_HOURS}
                  max={MAX_CUSTOM_HOURS}
                  step="any"
                  value={customHours}
                  aria-describedby={
                    showCustomError ? 'custom-target-error' : 'custom-target-helper'
                  }
                  aria-invalid={showCustomError}
                  className="h-12 rounded-lg border-ink/50 bg-paper px-4 font-bold text-lg focus-visible:border-ink"
                  onBlur={() => setCustomHasBlurred(true)}
                  onChange={(event) => {
                    setCustomHours(event.target.value);
                    setSaveError(null);
                  }}
                />
                <div className="min-h-7 pt-2">
                  {showCustomError ? (
                    <p
                      className="mb-0 font-bold text-pomodoro-red text-sm"
                      id="custom-target-error"
                      role="alert"
                    >
                      {customError}
                    </p>
                  ) : (
                    <p className="mb-0 text-ink/60 text-sm" id="custom-target-helper">
                      {customPomodoros === null
                        ? 'Choose from 1 to 10,000 hours.'
                        : `${formatNumber(customPomodoros)} Pomodoros`}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

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
