import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export type PomodoroBlockState = 'complete' | 'partial' | 'future' | 'latest' | 'milestone';

const stateClass: Record<PomodoroBlockState, string> = {
  complete: 'border-pomodoro-red bg-pomodoro-red',
  partial: 'border-pomodoro-red bg-paper',
  future: 'border-ink/20 bg-paper',
  latest: 'border-ink bg-pomodoro-red ring-2 ring-ink ring-offset-2',
  milestone: 'border-ink bg-ink',
};

export function PomodoroBlock({
  state,
  label,
  fraction = state === 'partial' ? 0.5 : state === 'future' ? 0 : 1,
  highlighted = false,
  onSelect,
  className,
}: {
  state: PomodoroBlockState;
  label: string;
  fraction?: number;
  highlighted?: boolean;
  onSelect?: () => void;
  className?: string;
}) {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const commonClass = cn(
    'relative aspect-square size-full min-h-4 min-w-4 max-w-7 overflow-hidden rounded-sm border',
    stateClass[state],
    highlighted &&
      'zoom-in-75 animate-in ring-2 ring-ink ring-offset-2 duration-300 motion-reduce:animate-none',
    onSelect && 'min-h-11 min-w-11 cursor-pointer focus-visible:outline-none',
    className
  );
  const partialStyle = {
    '--pomodoro-fill': `${clampedFraction * 100}%`,
  } as CSSProperties;

  const content = (
    <>
      {state === 'partial' ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-pomodoro-red"
          style={{ height: 'var(--pomodoro-fill)' }}
        />
      ) : null}
      {state === 'milestone' ? (
        <span aria-hidden="true" className="absolute inset-[22%] rotate-45 border border-paper" />
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
      data-state={state}
      data-newly-earned={highlighted || undefined}
    >
      {content}
    </button>
  ) : (
    <span
      className={commonClass}
      style={partialStyle}
      role="img"
      aria-label={label}
      data-state={state}
      data-newly-earned={highlighted || undefined}
    >
      {content}
    </span>
  );
}
