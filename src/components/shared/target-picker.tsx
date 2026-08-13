import { Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_POMODORO = 25;
export const MIN_CUSTOM_HOURS = 1;
export const MAX_CUSTOM_HOURS = 10_000;

export const TARGET_PRESETS = [
  {
    id: '10-hours',
    targetMinutes: 10 * MINUTES_PER_HOUR,
    value: '10',
    unit: 'hours',
    label: '10 hours',
    detail: '24 Pomodoros',
  },
  {
    id: '25-hours',
    targetMinutes: 25 * MINUTES_PER_HOUR,
    value: '25',
    unit: 'hours',
    label: '25 hours',
    detail: '60 Pomodoros',
  },
  {
    id: '100-hours',
    targetMinutes: 100 * MINUTES_PER_HOUR,
    value: '100',
    unit: 'hours',
    label: '100 hours',
    detail: '240 Pomodoros',
  },
  {
    id: '1000-pomodoros',
    targetMinutes: 1_000 * MINUTES_PER_POMODORO,
    value: '1,000',
    unit: 'Pomodoros',
    label: '1,000 Pomodoros',
    detail: '416 hours 40 minutes',
  },
  {
    id: '1000-hours',
    targetMinutes: 1_000 * MINUTES_PER_HOUR,
    value: '1,000',
    unit: 'hours',
    label: '1,000 hours',
    detail: '2,400 Pomodoros',
  },
  {
    id: '10000-hours',
    targetMinutes: 10_000 * MINUTES_PER_HOUR,
    value: '10,000',
    unit: 'hours',
    label: '10,000 hours',
    detail: '24,000 Pomodoros',
  },
] as const;

export const DEFAULT_TARGET_MINUTES =
  TARGET_PRESETS.find(({ id }) => id === '1000-pomodoros')?.targetMinutes ??
  1_000 * MINUTES_PER_POMODORO;

export type TargetPresetId = (typeof TARGET_PRESETS)[number]['id'];
export type TargetSelection = TargetPresetId | 'custom';

export function hoursToPomodoros(hours: number) {
  return (hours * MINUTES_PER_HOUR) / MINUTES_PER_POMODORO;
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatTargetHours(targetMinutes: number) {
  const totalMinutes = Math.max(0, targetMinutes);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (minutes === 0) return `${formatNumber(hours)} hours`;
  return `${formatNumber(hours)} hours ${minutes} minutes`;
}

export function getCustomHoursError(value: string) {
  if (value.trim().length === 0) {
    return 'Enter a custom target to continue.';
  }

  const hours = Number(value);

  if (!Number.isFinite(hours) || hours < MIN_CUSTOM_HOURS || hours > MAX_CUSTOM_HOURS) {
    return `Enter a target from ${formatNumber(MIN_CUSTOM_HOURS)} to ${formatNumber(MAX_CUSTOM_HOURS)} hours.`;
  }

  return null;
}

export function getInitialSelection(targetMinutes: number): TargetSelection {
  const preset = TARGET_PRESETS.find(
    ({ targetMinutes: presetMinutes }) => presetMinutes === targetMinutes
  );
  return preset?.id ?? 'custom';
}

export function getInitialCustomHours(
  targetMinutes: number,
  selection = getInitialSelection(targetMinutes)
) {
  return selection === 'custom' ? String(targetMinutes / MINUTES_PER_HOUR) : '';
}

export function targetSelectionToMinutes(selection: TargetSelection, customHours: string) {
  if (selection === 'custom') {
    const error = getCustomHoursError(customHours);
    return error === null ? Number(customHours) * MINUTES_PER_HOUR : null;
  }

  return TARGET_PRESETS.find(({ id }) => id === selection)?.targetMinutes ?? null;
}

function TargetOption({
  preset,
  selected,
  name,
  onSelect,
}: {
  preset: (typeof TARGET_PRESETS)[number];
  selected: boolean;
  name: string;
  onSelect: () => void;
}) {
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
        name={name}
        value={preset.id}
        checked={selected}
        aria-label={`${preset.label}, ${preset.detail}`}
        className="sr-only"
        onChange={onSelect}
      />
      <span className="font-bold text-2xl tabular-nums leading-none tracking-[-0.03em] sm:text-3xl">
        {preset.value}
        <span className="mt-1 block font-normal text-sm tracking-normal">{preset.unit}</span>
      </span>
      <span className={cn('mt-3 text-sm tabular-nums', selected ? 'text-paper/70' : 'text-ink/60')}>
        {preset.detail}
      </span>
      {selected ? (
        <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-pomodoro-red text-paper">
          <Check aria-hidden="true" className="size-4" />
        </span>
      ) : null}
    </label>
  );
}

export function TargetPicker({
  selection,
  customHours,
  customHasBlurred,
  submitted,
  inputId = 'custom-target-hours',
  messageIdPrefix = 'custom-target',
  onSelect,
  onCustomHoursChange,
  onCustomBlur,
}: {
  selection: TargetSelection;
  customHours: string;
  customHasBlurred: boolean;
  submitted: boolean;
  inputId?: string;
  messageIdPrefix?: string;
  onSelect: (selection: TargetSelection) => void;
  onCustomHoursChange: (value: string) => void;
  onCustomBlur: () => void;
}) {
  const customError = selection === 'custom' ? getCustomHoursError(customHours) : null;
  const showCustomError = customError !== null && (customHasBlurred || submitted);
  const customPomodoros = customError === null ? hoursToPomodoros(Number(customHours)) : null;

  return (
    <fieldset>
      <legend className="sr-only">Focus target</legend>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {TARGET_PRESETS.map((preset) => (
          <TargetOption
            key={preset.id}
            preset={preset}
            name="target"
            selected={selection === preset.id}
            onSelect={() => onSelect(preset.id)}
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
          onChange={() => onSelect('custom')}
        />
      </label>

      {selection === 'custom' ? (
        <div className="mt-3">
          <label className="mb-2 block font-bold text-sm" htmlFor={inputId}>
            Custom hours
          </label>
          <Input
            id={inputId}
            name="customTargetHours"
            type="number"
            inputMode="decimal"
            min={MIN_CUSTOM_HOURS}
            max={MAX_CUSTOM_HOURS}
            step="any"
            value={customHours}
            aria-describedby={
              showCustomError ? `${messageIdPrefix}-error` : `${messageIdPrefix}-helper`
            }
            aria-invalid={showCustomError}
            className="h-12 rounded-lg border-ink/50 bg-paper px-4 font-bold text-lg focus-visible:border-ink"
            onBlur={onCustomBlur}
            onChange={(event) => onCustomHoursChange(event.target.value)}
          />
          <div className="min-h-7 pt-2">
            {showCustomError ? (
              <p
                className="mb-0 font-bold text-pomodoro-red text-sm"
                id={`${messageIdPrefix}-error`}
                role="alert"
              >
                {customError}
              </p>
            ) : (
              <p className="mb-0 text-ink/60 text-sm" id={`${messageIdPrefix}-helper`}>
                {customPomodoros === null
                  ? `Choose from ${formatNumber(MIN_CUSTOM_HOURS)} to ${formatNumber(MAX_CUSTOM_HOURS)} hours.`
                  : `${formatNumber(customPomodoros)} Pomodoros`}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
