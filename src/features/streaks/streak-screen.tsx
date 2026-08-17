import { Link } from '@tanstack/react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Snowflake } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ApplicationLayout } from '@/features/journeys/components/application-layout';
import { ApplicationStateBoundary } from '@/features/journeys/components/application-state-boundary';
import { useCurrentLocalDate } from '@/hooks/use-current-local-date';
import { normalizeLocalMonth } from '@/lib/local-date';
import type { AppState } from '@/lib/models';
import { deriveStreakMonth, deriveStreakSummary } from '@/lib/streaks';

import { StreakCalendar, StreakCalendarLegend } from './streak-calendar';

interface MonthSelection {
  year: number;
  monthIndex: number;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

function getMonthNumber(month: MonthSelection) {
  return month.year * 12 + month.monthIndex;
}

function getMonthLabel(month: MonthSelection) {
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(month.year, month.monthIndex, 1);
  return monthFormatter.format(date);
}

function getTodayMessage(todayState: ReturnType<typeof deriveStreakSummary>['todayState']) {
  if (todayState === 'practiced') return 'Today counts.';
  if (todayState === 'open') return 'Today is still open.';
  return 'A focused day starts your streak.';
}

export function StreakContent({ now, state }: { now: Date; state: AppState }) {
  const currentMonth = { year: now.getFullYear(), monthIndex: now.getMonth() };
  const currentMonthNumber = getMonthNumber(currentMonth);
  const [selectedMonth, setSelectedMonth] = useState<MonthSelection>(currentMonth);
  const summary = deriveStreakSummary(
    state.focusSessions,
    state.journeys.map(({ id }) => id),
    now
  );
  const month = deriveStreakMonth(summary, selectedMonth.year, selectedMonth.monthIndex);
  const canViewNextMonth = getMonthNumber(selectedMonth) < currentMonthNumber;
  const streakUnit = summary.currentStreak === 1 ? 'day' : 'days';
  const bestUnit = summary.longestStreak === 1 ? 'day' : 'days';
  const freezeUnit = summary.freezesAvailable === 1 ? 'freeze' : 'freezes';
  const focusDayUnit = summary.qualifyingDaysUntilNextFreeze === 1 ? 'day' : 'days';

  function moveMonth(offset: -1 | 1) {
    const nextMonth = normalizeLocalMonth(selectedMonth.year, selectedMonth.monthIndex + offset);
    if (nextMonth === null || getMonthNumber(nextMonth) > currentMonthNumber) return;

    setSelectedMonth(nextMonth);
  }

  return (
    <ApplicationLayout>
      <div className="mx-auto w-full max-w-[44rem]">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 font-bold text-sm hover:text-pomodoro-red"
          to="/home"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Home
        </Link>

        <header className="mt-8 border-ink/8 border-b pb-10">
          <p className="mb-4 font-bold text-ink/60 text-xs uppercase tracking-wider">
            Current streak
          </p>
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-pomodoro-red/40 bg-pomodoro-red/5 text-pomodoro-red sm:size-14"
            >
              <Flame className="size-6 fill-pomodoro-red stroke-[1.75] sm:size-7" />
            </span>
            <h1
              aria-label={`Current streak: ${summary.currentStreak} ${streakUnit}`}
              className="mb-0 flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0 tracking-tight"
            >
              <span className="font-extrabold text-[clamp(4rem,20vw,7rem)] text-ink tabular-nums leading-none tracking-[-0.05em]">
                {summary.currentStreak}
              </span>
              <span className="font-bold text-2xl text-ink/70 tracking-tight sm:text-3xl">
                {streakUnit}
              </span>
            </h1>
          </div>

          <p className="mt-5 mb-0 text-ink/70 text-sm">{getTodayMessage(summary.todayState)}</p>
          <p className="mt-2 mb-0 text-ink/60 text-sm">
            Personal best: {summary.longestStreak} {bestUnit} · {summary.freezesAvailable}{' '}
            {freezeUnit} available
          </p>
          <p className="mt-6 mb-0 max-w-[55ch] text-ink/70 leading-relaxed">
            Focus for at least 5 minutes in any Journey to count today.
          </p>
          <p className="mt-2 mb-0 font-bold text-sm">
            {summary.qualifyingDaysUntilNextFreeze} focus {focusDayUnit} to next freeze
          </p>
        </header>

        <section aria-labelledby="streak-month-heading" className="mt-10">
          <header className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3">
            <Button
              aria-label="View previous month"
              onClick={() => moveMonth(-1)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <h2
              aria-live="polite"
              className="mb-0 text-center font-bold text-xl leading-tight tracking-[-0.025em] sm:text-3xl"
              id="streak-month-heading"
            >
              {getMonthLabel(selectedMonth)}
            </h2>
            <Button
              aria-label="View next month"
              disabled={!canViewNextMonth}
              onClick={() => moveMonth(1)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </header>

          <div className="mt-6 overflow-hidden rounded-2xl border border-ink/8 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] ring-1 ring-ink/5">
            <section
              aria-label={`${getMonthLabel(selectedMonth)} totals`}
              className="border-ink/8 border-b"
            >
              <dl className="m-0 grid grid-cols-2 divide-x divide-ink/8">
                <div className="min-w-0 p-4 sm:px-6">
                  <dt className="mt-1 font-bold text-ink/60 text-xs uppercase tracking-wider">
                    Days practiced
                  </dt>
                  <dd className="m-0 flex items-center gap-2 font-extrabold text-2xl text-ink tabular-nums sm:text-3xl">
                    <Flame
                      aria-hidden="true"
                      className="size-5 fill-pomodoro-red text-pomodoro-red"
                    />
                    {month?.practicedDays ?? 0}
                  </dd>
                </div>
                <div className="min-w-0 p-4 sm:px-6">
                  <dt className="mt-1 font-bold text-ink/60 text-xs uppercase tracking-wider">
                    Freezes used
                  </dt>
                  <dd className="m-0 flex items-center gap-2 font-extrabold text-2xl text-ink tabular-nums sm:text-3xl">
                    <Snowflake aria-hidden="true" className="size-5 text-ink/60" />
                    {month?.freezesUsed ?? 0}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="px-2 py-4 sm:px-5 sm:py-6">
              <StreakCalendar
                asOfDateKey={summary.asOfDateKey}
                daysByDate={summary.daysByDate}
                monthIndex={selectedMonth.monthIndex}
                year={selectedMonth.year}
              />
            </div>
          </div>

          <div className="mt-5">
            <StreakCalendarLegend />
          </div>
        </section>
      </div>
    </ApplicationLayout>
  );
}

export function StreakScreen() {
  const now = useCurrentLocalDate();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  return (
    <ApplicationStateBoundary variant="home">
      {(state) => <StreakContent key={monthKey} now={now} state={state} />}
    </ApplicationStateBoundary>
  );
}
