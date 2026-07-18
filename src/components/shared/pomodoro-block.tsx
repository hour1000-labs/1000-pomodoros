import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export type PomodoroBlockBaseState = 'complete' | 'partial' | 'future';
export type PomodoroBlockState = PomodoroBlockBaseState | 'latest' | 'milestone';

const stateClass: Record<PomodoroBlockBaseState, string> = {
  complete: 'border-pomodoro-red bg-pomodoro-red',
  partial: 'border-pomodoro-red bg-paper',
  future: 'border-ink/[0.12] bg-paper',
};

function isBaseState(state: PomodoroBlockState): state is PomodoroBlockBaseState {
  return state === 'complete' || state === 'partial' || state === 'future';
}

export function PomodoroBlock({
  state,
  label,
  fraction,
  latest = false,
  milestone = false,
  highlighted = false,
  pomodoroIndex,
  onSelect,
  dialogId,
  dialogOpen,
  className,
}: {
  state: PomodoroBlockState;
  label: string;
  fraction?: number;
  latest?: boolean;
  milestone?: boolean;
  highlighted?: boolean;
  pomodoroIndex?: number;
  onSelect?: () => void;
  dialogId?: string;
  dialogOpen?: boolean;
  className?: string;
}) {
  const defaultFraction = state === 'partial' ? 0.5 : state === 'future' ? 0 : 1;
  const rawFraction = fraction ?? defaultFraction;
  const clampedFraction = Number.isFinite(rawFraction)
    ? Math.min(1, Math.max(0, rawFraction))
    : defaultFraction;
  const baseState = isBaseState(state)
    ? state
    : clampedFraction === 0
      ? 'future'
      : clampedFraction < 1
        ? 'partial'
        : 'complete';
  const renderedFraction =
    baseState === 'complete' ? 1 : baseState === 'future' ? 0 : clampedFraction;
  const isLatest = latest || state === 'latest';
  const isMilestone = milestone || state === 'milestone';
  const commonClass = cn(
    'relative aspect-square size-full min-h-4 min-w-4 max-w-7 overflow-hidden rounded-sm border',
    stateClass[baseState],
    isLatest && 'outline-2 outline-ink outline-offset-1',
    highlighted &&
      'zoom-in-75 animate-in ring-2 ring-ink ring-offset-2 duration-300 motion-reduce:animate-none',
    onSelect &&
      'min-h-11 min-w-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
    className
  );
  const partialStyle = {
    '--pomodoro-fill': `${renderedFraction * 100}%`,
  } as CSSProperties;
  const dataAttributes = {
    'data-state': baseState,
    'data-latest': isLatest || undefined,
    'data-milestone': isMilestone || undefined,
    'data-newly-earned': highlighted || undefined,
    'data-fill-percent': Math.round(renderedFraction * 100),
    'data-pomodoro-index': pomodoroIndex,
  };

  const content = (
    <>
      {baseState === 'partial' ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-pomodoro-red"
          style={{ height: 'var(--pomodoro-fill)' }}
        />
      ) : null}
      {isMilestone ? (
        <span
          aria-hidden="true"
          className="absolute top-0 right-0 size-2.5 bg-ink [clip-path:polygon(100%_0,100%_100%,0_0)]"
          data-milestone-notch="true"
        />
      ) : null}
      <span className="sr-only">{label}</span>
    </>
  );

  return onSelect ? (
    <button
      type="button"
      className={commonClass}
      style={partialStyle}
      onClick={onSelect}
      aria-label={label}
      aria-current={isLatest || undefined}
      aria-haspopup={dialogId ? 'dialog' : undefined}
      aria-controls={dialogId}
      aria-expanded={dialogId ? Boolean(dialogOpen) : undefined}
      {...dataAttributes}
    >
      {content}
    </button>
  ) : (
    <span
      className={commonClass}
      style={partialStyle}
      role="img"
      aria-label={label}
      aria-current={isLatest || undefined}
      {...dataAttributes}
    >
      {content}
    </span>
  );
}
