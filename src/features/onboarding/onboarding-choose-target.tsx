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
const targetPreviewBlockIds = Array.from(
  { length: 32 },
  (_, index) => `target-preview-block-${index + 1}`
);

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

function TargetPreview({ journeyName }: { journeyName: string }) {
  return (
    <aside className="hidden max-w-sm lg:block" aria-hidden="true">
      <p className="mb-8 font-bold text-[0.75rem] text-ink/60 uppercase tracking-[0.22em]">
        Your Journey
      </p>
      <div className="mb-7 h-px w-full bg-ink" />
      <span className="mb-5 block size-10 rounded-full border-2 border-ink bg-pomodoro-red shadow-[2px_2px_0_var(--ink)]" />
      <p className="mb-3 font-bold text-3xl leading-[1.08] tracking-[-0.035em] [overflow-wrap:anywhere]">
        {journeyName}
      </p>
      <p className="mb-10 max-w-[28ch] text-base text-ink/60 leading-relaxed">
        Your target is the long view. Your next session is where you begin.
      </p>
      <div className="grid w-fit grid-cols-8 gap-2">
        {targetPreviewBlockIds.map((blockId, index) => (
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
        'relative grid min-h-24 cursor-pointer content-between border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 sm:min-h-28 sm:px-5 sm:py-4 [@media(max-height:800px)]:min-h-16 [@media(max-height:800px)]:px-3 [@media(max-height:800px)]:py-2',
        selected
          ? 'border-ink bg-ink text-paper shadow-[5px_5px_0_var(--pomodoro-red)]'
          : 'border-ink/30 bg-paper text-ink hover:border-ink'
      )}
    >
      <input
        type="radio"
        name="target"
        value={hours}
        checked={selected}
        aria-label={`${formatNumber(hours)} hours, ${formatNumber(pomodoros)} pomodoros`}
        className="sr-only"
        onChange={onSelect}
      />
      <span className="font-bold text-3xl tabular-nums leading-none tracking-[-0.04em] sm:text-4xl [@media(max-height:800px)]:text-2xl">
        {formatNumber(hours)}
        <span className="mt-1 block text-sm tracking-normal">hours</span>
      </span>
      <span
        className={cn(
          'mt-3 font-bold text-[0.68rem] uppercase tabular-nums tracking-[0.14em] [@media(max-height:800px)]:mt-1 [@media(max-height:800px)]:whitespace-nowrap [@media(max-height:800px)]:text-[0.6rem] [@media(max-height:800px)]:tracking-[0.06em]',
          selected ? 'text-paper/70' : 'text-ink/55'
        )}
      >
        {formatNumber(pomodoros)} pomodoros
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
    <OnboardingLayout className="items-start py-3 sm:py-6 md:items-center md:py-12 [@media(max-height:900px)]:py-0">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
        <TargetPreview journeyName={draft.journeyName} />

        <section className="w-full min-w-0 max-w-[42rem] lg:justify-self-end">
          <div className="mb-4 flex items-center gap-4 sm:mb-6 [@media(max-height:800px)]:mb-2">
            <p className="mb-0 shrink-0 font-bold text-[0.75rem] uppercase tracking-[0.18em]">
              3 of 4
            </p>
            <span className="h-px w-24 bg-ink/20" aria-hidden="true">
              <span className="block h-px w-3/4 bg-pomodoro-red" />
            </span>
            <p className="mb-0 hidden font-bold text-[0.7rem] text-ink/60 uppercase tracking-[0.16em] sm:block">
              Choose a target
            </p>
          </div>

          <div className="mb-3 flex items-center gap-3 sm:mb-4 [@media(max-height:650px)]:hidden">
            <span
              className="block size-7 rounded-full border-2 border-ink bg-pomodoro-red"
              aria-hidden="true"
            />
            <p className="mb-0 min-w-0 font-bold text-sm [overflow-wrap:anywhere]">
              {draft.journeyName}
            </p>
          </div>

          <h1 className="mb-3 max-w-[14ch] font-bold text-4xl leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem] [@media(max-height:800px)]:mb-2 [@media(max-height:800px)]:text-3xl">
            How much focused time are you aiming for?
          </h1>
          <p className="mb-5 max-w-[54ch] text-base text-ink/60 leading-relaxed sm:mb-7 sm:text-lg [@media(max-height:650px)]:hidden">
            Pick a target that gives your practice direction. You can always change it later.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <fieldset>
              <legend className="sr-only">Focused-time target</legend>
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
                  'mt-2 flex min-h-12 cursor-pointer items-center justify-between gap-4 border-2 border-dashed px-4 py-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 sm:mt-3 sm:px-5 [@media(max-height:800px)]:min-h-10',
                  selection === 'custom' ? 'border-ink bg-ink/5' : 'border-ink/30 bg-paper'
                )}
              >
                <span className="font-bold">Custom</span>
                <span className="font-bold text-[0.68rem] text-ink/55 uppercase tracking-[0.14em]">
                  Set your own hours
                </span>
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
              <div className="mt-3 [@media(max-height:800px)]:mt-2">
                <label
                  className="mb-2 block font-bold text-[0.75rem] uppercase tracking-[0.12em] [@media(max-height:650px)]:sr-only"
                  htmlFor="custom-target-hours"
                >
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
                  className="h-12 rounded-none border-2 border-ink bg-paper px-4 font-bold text-lg shadow-[4px_4px_0_var(--pomodoro-red)] focus-visible:border-ink [@media(max-height:800px)]:h-11"
                  onBlur={() => setCustomHasBlurred(true)}
                  onChange={(event) => {
                    setCustomHours(event.target.value);
                    setSaveError(null);
                  }}
                />
                <div className="min-h-7 pt-2 [@media(max-height:800px)]:min-h-5 [@media(max-height:800px)]:pt-1">
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
                        : `${formatNumber(customPomodoros)} pomodoros`}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <p
              className={cn(
                'mt-3 mb-0 border-pomodoro-red border-l-2 py-1 pl-4 text-ink/65 text-sm leading-relaxed sm:mt-5 [@media(max-height:800px)]:mt-2 [@media(max-height:800px)]:text-xs [@media(max-height:800px)]:leading-snug',
                selection === 'custom' ? '[@media(max-height:650px)]:hidden' : undefined
              )}
            >
              You will focus on the next milestone, not the full target at once. Start with your
              first 25-minute pomodoro.
            </p>

            {saveError ? (
              <p className="mt-2 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-between sm:mt-7 [@media(max-height:900px)]:mt-1">
              <Button asChild variant="link" className="px-0 text-ink">
                <Link to="/onboarding/motivation">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back
                </Link>
              </Button>
              <PrimaryButton
                type="submit"
                className="min-w-36 shadow-[4px_4px_0_var(--ink)]"
                disabled={isSaving}
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

export function OnboardingChooseTarget() {
  const hydration = useAppState();

  if (hydration.status === 'loading') {
    return (
      <OnboardingLayout>
        <LoadingState label="Loading target draft" />
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
