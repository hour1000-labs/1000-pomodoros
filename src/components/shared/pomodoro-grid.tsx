import { PomodoroBlock, type PomodoroBlockBaseState } from '@/components/shared/pomodoro-block';
import { cn } from '@/lib/utils';

const MINUTES_PER_POMODORO = 25;

function toNonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function PomodoroGrid({
  focusedMinutes,
  totalPomodoros,
  startIndex = 0,
  renderLimit = 100,
  latestIndex,
  milestoneIndexes = [],
  highlightedIndexes = [],
  selectableIndexes,
  onSelect,
  selectionDialogId,
  selectedIndex,
  className,
}: {
  focusedMinutes: number;
  totalPomodoros: number;
  startIndex?: number;
  renderLimit?: number;
  latestIndex?: number;
  milestoneIndexes?: number[];
  highlightedIndexes?: number[];
  selectableIndexes?: number[];
  onSelect?: (index: number) => void;
  selectionDialogId?: string;
  selectedIndex?: number | null;
  className?: string;
}) {
  const safeTotal = toNonNegativeInteger(totalPomodoros);
  const safeStart = Math.min(toNonNegativeInteger(startIndex), safeTotal);
  const safeRenderLimit = toNonNegativeInteger(renderLimit);
  const visibleCount = Math.min(safeRenderLimit, safeTotal - safeStart);
  const safeFocusedMinutes = Number.isFinite(focusedMinutes) ? Math.max(0, focusedMinutes) : 0;
  const completedPomodoros = Math.floor(safeFocusedMinutes / MINUTES_PER_POMODORO);
  const partialFraction = (safeFocusedMinutes % MINUTES_PER_POMODORO) / MINUTES_PER_POMODORO;
  const milestoneSet = new Set(milestoneIndexes);
  const highlightedSet = new Set(highlightedIndexes);
  const selectableSet = selectableIndexes ? new Set(selectableIndexes) : null;

  function getState(index: number): PomodoroBlockBaseState {
    if (index < completedPomodoros) return 'complete';
    if (index === completedPomodoros && partialFraction > 0) return 'partial';
    return 'future';
  }

  return (
    <figure
      className={cn('m-0 w-full overflow-x-auto', className)}
      aria-label={`${completedPomodoros} complete pomodoros out of ${safeTotal}`}
    >
      <div
        className={cn(
          'grid grid-cols-10 gap-1 p-1',
          onSelect && 'min-w-[30.25rem] grid-cols-10 place-items-center'
        )}
      >
        {Array.from({ length: visibleCount }, (_, offset) => {
          const index = safeStart + offset;
          const state = getState(index);
          const fraction = state === 'partial' ? partialFraction : undefined;
          const latest = latestIndex === index;
          const milestone = milestoneSet.has(index);
          const highlighted = highlightedSet.has(index);
          const selectable = Boolean(onSelect) && (!selectableSet || selectableSet.has(index));
          const label = `Pomodoro ${index + 1}: ${state}${
            state === 'partial' ? `, ${Math.round(partialFraction * 100)}% filled` : ''
          }${latest ? ', latest' : ''}${milestone ? ', milestone' : ''}${
            highlighted ? ', newly earned' : ''
          }`;

          return (
            <PomodoroBlock
              key={index}
              state={state}
              fraction={fraction}
              label={label}
              latest={latest}
              milestone={milestone}
              highlighted={highlighted}
              pomodoroIndex={index}
              onSelect={selectable && onSelect ? () => onSelect(index) : undefined}
              dialogId={selectable ? selectionDialogId : undefined}
              dialogOpen={selectable && selectedIndex === index}
              className={onSelect ? 'min-h-11 min-w-11 max-w-11' : undefined}
            />
          );
        })}
      </div>
      {onSelect ? (
        <p className="mt-3 mb-0 font-bold text-ink/65 text-xs sm:hidden">
          Swipe or scroll horizontally to inspect all 10 columns.
        </p>
      ) : null}
      {safeTotal > visibleCount ? (
        <figcaption className="mt-3 text-ink/60 text-sm">
          Showing pomodoros {safeStart + 1}–{safeStart + visibleCount} of{' '}
          {safeTotal.toLocaleString()}.
        </figcaption>
      ) : null}
    </figure>
  );
}
