import { PomodoroBlock, type PomodoroBlockState } from '@/components/pomodoro-block'
import { cn } from '@/lib/utils'

const MINUTES_PER_POMODORO = 25

export function PomodoroGrid({
  focusedMinutes,
  totalPomodoros,
  startIndex = 0,
  renderLimit = 100,
  latestIndex,
  milestoneIndexes = [],
  onSelect,
  className,
}: {
  focusedMinutes: number
  totalPomodoros: number
  startIndex?: number
  renderLimit?: number
  latestIndex?: number
  milestoneIndexes?: number[]
  onSelect?: (index: number) => void
  className?: string
}) {
  const safeTotal = Math.max(0, Math.floor(totalPomodoros))
  const safeStart = Math.min(Math.max(0, Math.floor(startIndex)), safeTotal)
  const visibleCount = Math.min(Math.max(0, renderLimit), safeTotal - safeStart)
  const completedPomodoros = Math.floor(Math.max(0, focusedMinutes) / MINUTES_PER_POMODORO)
  const partialFraction = (Math.max(0, focusedMinutes) % MINUTES_PER_POMODORO) / MINUTES_PER_POMODORO
  const milestoneSet = new Set(milestoneIndexes)

  function getState(index: number): PomodoroBlockState {
    if (latestIndex === index) return 'latest'
    if (milestoneSet.has(index) && index < completedPomodoros) return 'milestone'
    if (index < completedPomodoros) return 'complete'
    if (index === completedPomodoros && partialFraction > 0) return 'partial'
    return 'future'
  }

  return (
    <figure className={cn('m-0 w-full overflow-x-auto', className)}>
      <div
        className={cn(
          'grid grid-cols-10 gap-1',
          onSelect && 'min-w-[29.75rem] grid-cols-10',
        )}
        aria-label={`${completedPomodoros} complete pomodoros out of ${safeTotal}`}
      >
        {Array.from({ length: visibleCount }, (_, offset) => {
          const index = safeStart + offset
          const state = getState(index)
          const fraction = state === 'partial' ? partialFraction : undefined

          return (
            <PomodoroBlock
              key={index}
              state={state}
              fraction={fraction}
              label={`Pomodoro ${index + 1}: ${state}${
                state === 'partial' ? `, ${Math.round(partialFraction * 100)}% filled` : ''
              }`}
              onSelect={onSelect ? () => onSelect(index) : undefined}
            />
          )
        })}
      </div>
      {safeTotal > visibleCount ? (
        <figcaption className="mt-3 text-sm text-ink/60">
          Showing pomodoros {safeStart + 1}–{safeStart + visibleCount} of{' '}
          {safeTotal.toLocaleString()}.
        </figcaption>
      ) : null}
    </figure>
  )
}
