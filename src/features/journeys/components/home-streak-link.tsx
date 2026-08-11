import { Link } from '@tanstack/react-router';
import { ChevronRight, Flame, Snowflake } from 'lucide-react';

import type { StreakSummary } from '@/lib/streaks';

function formatStreakCount(count: number) {
  return `${count}-day streak`;
}

function formatFreezeCount(count: number) {
  return `${count} ${count === 1 ? 'freeze' : 'freezes'}`;
}

function getTodayLabel(streak: StreakSummary) {
  if (streak.todayState === 'practiced') return 'Today complete';

  const latestDay = streak.days.at(-1);
  if (streak.todayState === 'open' && latestDay?.state === 'freeze-used') {
    return 'Protected yesterday · Focus 5 minutes today';
  }

  if (streak.todayState === 'open') return 'Focus 5 minutes today';

  return 'Focus 5 minutes to start';
}

export function HomeStreakLink({ streak }: { streak: StreakSummary }) {
  const streakLabel = formatStreakCount(streak.currentStreak);
  const todayLabel = getTodayLabel(streak);
  const freezeLabel = formatFreezeCount(streak.freezesAvailable);

  return (
    <Link
      to="/streaks"
      aria-label={`View streak calendar: ${streakLabel}. ${todayLabel}. ${freezeLabel} available.`}
      className="group -mx-2 mt-6 flex min-h-14 items-center gap-3 border-ink/15 border-t px-2 pt-5 outline-none transition-colors hover:text-pomodoro-red focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-pomodoro-red/30 text-pomodoro-red">
        <Flame aria-hidden="true" className="size-5" strokeWidth={2.25} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-bold text-base text-ink tabular-nums">{streakLabel}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink/60 text-sm">
          <span>{todayLabel}</span>
          <span aria-hidden="true" className="text-ink/30">
            ·
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Snowflake aria-hidden="true" className="size-3.5" />
            {freezeLabel}
          </span>
        </span>
      </span>

      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink/40" />
    </Link>
  );
}
