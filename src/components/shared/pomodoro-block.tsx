import { type CSSProperties, useId } from 'react';

import { cn } from '@/lib/utils';

export type PomodoroBlockBaseState = 'complete' | 'partial' | 'future';
export type PomodoroBlockState = PomodoroBlockBaseState | 'latest' | 'milestone';

const TOMATO_BODY_PATH =
  'M14 7.75c-5.6-1-9.5 2.7-9.5 7.65C4.5 20.65 8.65 24 14 24s9.5-3.35 9.5-8.6C23.5 10.45 19.6 6.75 14 7.75Z';

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
  const fillClipId = `pomodoro-fill-${useId().replaceAll(':', '')}`;
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
    'relative grid aspect-square size-full min-h-4 min-w-4 max-w-7 place-items-center overflow-visible rounded-full border-0 bg-transparent p-0',
    highlighted &&
      'zoom-in-75 animate-in ring-2 ring-ink ring-offset-2 duration-300 motion-reduce:animate-none',
    dialogOpen && 'bg-pomodoro-red/10 ring-2 ring-pomodoro-red ring-offset-2',
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
    'data-selected': dialogOpen || undefined,
    'data-fill-percent': Math.round(renderedFraction * 100),
    'data-pomodoro-index': pomodoroIndex,
  };

  const content = (
    <>
      <svg
        aria-hidden="true"
        className="pointer-events-none size-full max-h-7 max-w-7 overflow-visible"
        data-pomodoro-tomato="true"
        focusable="false"
        viewBox="0 0 28 28"
      >
        <defs>
          <clipPath id={fillClipId} clipPathUnits="userSpaceOnUse">
            <rect
              data-fill-direction="left-to-right"
              data-pomodoro-fill-clip="true"
              height="20"
              width={20 * renderedFraction}
              x="4"
              y="6"
            />
          </clipPath>
        </defs>
        {isLatest ? (
          <circle
            className="fill-none stroke-ink"
            cx="14"
            cy="15.25"
            data-latest-ring="true"
            r="12"
            strokeWidth="1.5"
          />
        ) : null}
        <path className="fill-paper" d={TOMATO_BODY_PATH} />
        <path
          className="fill-pomodoro-red"
          clipPath={`url(#${fillClipId})`}
          d={TOMATO_BODY_PATH}
          data-pomodoro-fill="true"
        />
        <path
          className="fill-none stroke-ink"
          d={TOMATO_BODY_PATH}
          data-pomodoro-outline="true"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
        <path
          className="fill-ink stroke-ink"
          d="m14 8.5-3.9-2.6 2.15 3.65L14 8.5l1.75 1.05L17.9 5.9 14 8.5Z"
          data-pomodoro-calyx="true"
          strokeLinejoin="round"
          strokeWidth="0.75"
        />
        <path
          className="fill-none stroke-ink"
          d="M14 7.25V3.75"
          data-pomodoro-stem="true"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
        {isMilestone ? (
          <path
            className="fill-ink stroke-paper"
            d="m20.25 23.5 4.25-4.25v4.25h-4.25Z"
            data-milestone-notch="true"
            strokeLinejoin="round"
            strokeWidth="0.75"
          />
        ) : null}
      </svg>
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
