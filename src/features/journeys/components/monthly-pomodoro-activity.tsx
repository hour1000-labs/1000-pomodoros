import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { PomodoroBlock } from '@/components/shared/pomodoro-block';
import { Button } from '@/components/ui/button';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import {
  getLocalDateKey,
  type LocalMonth,
  localDateKeyToDate,
  normalizeLocalMonth,
} from '@/lib/local-date';
import type { AppState } from '@/lib/models';

import {
  deriveMonthlyPomodoroActivity,
  type MonthlyPomodoroActivityDay,
} from '../monthly-pomodoro-activity-data';

export const MONTHLY_ACTIVITY_TOMATO_RENDER_LIMIT = 24;

const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 20,
});

const POMODORO_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const DEFAULT_INITIAL_VISIBLE_DAYS = 7;
const REVEAL_BATCH_SIZE = 7;

function createLocalMonthDate({ year, monthIndex }: LocalMonth) {
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, monthIndex, 1);
  return date;
}

function formatMonth(month: LocalMonth) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(createLocalMonthDate(month));
}

function compareMonths(left: LocalMonth, right: LocalMonth) {
  return left.year * 12 + left.monthIndex - (right.year * 12 + right.monthIndex);
}

function isSameMonth(left: LocalMonth, right: LocalMonth) {
  return left.year === right.year && left.monthIndex === right.monthIndex;
}

function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

function formatPomodoroValue(value: number) {
  if (!Number.isFinite(value)) return '0';

  const floored = Math.floor(value * 10) / 10;
  return POMODORO_NUMBER_FORMATTER.format(floored);
}

function formatPomodoroCount(value: number) {
  return `${formatPomodoroValue(value)} ${value === 1 ? 'Pomodoro' : 'Pomodoros'}`;
}

function formatFocusedMinutes(value: number) {
  return `${formatNumber(value)} focused ${value === 1 ? 'minute' : 'minutes'}`;
}

function getRenderedMarks(day: MonthlyPomodoroActivityDay) {
  const fullPomodoros = Number.isFinite(day.fullPomodoros)
    ? Math.max(0, Math.floor(day.fullPomodoros))
    : 0;
  const partialPomodoro = Number.isFinite(day.partialPomodoro)
    ? Math.min(1, Math.max(0, day.partialPomodoro))
    : 0;
  const renderedFullPomodoros = Math.min(fullPomodoros, MONTHLY_ACTIVITY_TOMATO_RENDER_LIMIT);
  const rendersPartial =
    partialPomodoro > 0 && renderedFullPomodoros < MONTHLY_ACTIVITY_TOMATO_RENDER_LIMIT;
  const totalMarks = fullPomodoros + (partialPomodoro > 0 ? 1 : 0);
  const renderedMarks = renderedFullPomodoros + (rendersPartial ? 1 : 0);

  return {
    partialPomodoro,
    renderedFullPomodoros,
    rendersPartial,
    overflowCount: Math.max(0, totalMarks - renderedMarks),
  };
}

function ActivityRow({
  day,
  todayKey,
}: {
  day: MonthlyPomodoroActivityDay;
  todayKey: string | null;
}) {
  const date = localDateKeyToDate(day.dateKey);
  if (date === null) return null;

  const isToday = day.dateKey === todayKey;
  const shortDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date);
  const dayContext = isToday
    ? 'Today'
    : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
  const fullDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date);
  const marks = getRenderedMarks(day);
  const rowLabel = `${fullDate}; ${formatFocusedMinutes(day.focusedMinutes)}; ${formatPomodoroCount(
    day.totalPomodoros
  )}.`;

  return (
    <tr aria-label={rowLabel} className="border-ink/15 border-t align-top">
      <th className="px-3 py-4 text-left font-normal sm:px-5" scope="row">
        <time className="block leading-tight" dateTime={day.dateKey}>
          <span className="block font-bold text-sm tabular-nums">{shortDate}</span>
          {isToday ? (
            <span className="mt-1 inline-flex items-center gap-1.5 font-bold text-ink text-xs">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-pomodoro-red" />
              Today
            </span>
          ) : (
            <span className="mt-1 block text-ink/60 text-xs">{dayContext}</span>
          )}
        </time>
      </th>
      <td className="min-w-0 px-1.5 py-4 sm:px-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span aria-hidden="true" className="contents">
            {Array.from({ length: marks.renderedFullPomodoros }, (_, index) => index + 1).map(
              (pomodoroNumber) => (
                <span
                  className="size-5 shrink-0 sm:size-6"
                  key={`${day.dateKey}-pomodoro-${pomodoroNumber}`}
                >
                  <PomodoroBlock state="complete" label="Complete Pomodoro" />
                </span>
              )
            )}
            {marks.rendersPartial ? (
              <span className="size-5 shrink-0 sm:size-6">
                <PomodoroBlock
                  state="partial"
                  fraction={marks.partialPomodoro}
                  label={`${formatNumber(marks.partialPomodoro * 100)}% of a Pomodoro`}
                />
              </span>
            ) : null}
          </span>
          {marks.overflowCount > 0 ? (
            <span className="font-bold text-ink/60 text-xs tabular-nums [overflow-wrap:anywhere]">
              +{marks.overflowCount} more
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-4 text-right sm:px-5">
        <span className="block font-bold text-sm tabular-nums [overflow-wrap:anywhere]">
          {formatPomodoroValue(day.totalPomodoros)}
        </span>
        <span className="sr-only"> {day.totalPomodoros === 1 ? 'Pomodoro' : 'Pomodoros'}</span>
      </td>
    </tr>
  );
}

export function MonthlyPomodoroActivity({
  state,
  now,
  journeyId,
  scopeLabel,
  headingLevel = 2,
  initialVisibleDays = DEFAULT_INITIAL_VISIBLE_DAYS,
}: {
  state: AppState;
  now: Date;
  journeyId?: string;
  scopeLabel?: string;
  headingLevel?: 2 | 3;
  initialVisibleDays?: number;
}) {
  const sectionHeadingId = useId();
  const monthHeadingId = useId();
  const currentMonth = useMemo<LocalMonth>(
    () => ({ year: now.getFullYear(), monthIndex: now.getMonth() }),
    [now]
  );
  const [selectedMonth, setSelectedMonth] = useState<LocalMonth>(() => currentMonth);
  const previousCurrentMonthRef = useRef(currentMonth);
  const revealFocusTargetRef = useRef<'reveal' | 'collapse' | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const normalizedInitialVisibleDays = Number.isFinite(initialVisibleDays)
    ? Math.max(1, Math.floor(initialVisibleDays))
    : DEFAULT_INITIAL_VISIBLE_DAYS;
  const [visibleDayCount, setVisibleDayCount] = useState(normalizedInitialVisibleDays);
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const MonthHeading = headingLevel === 3 ? 'h4' : 'h3';

  useEffect(() => {
    const previousCurrentMonth = previousCurrentMonthRef.current;

    setSelectedMonth((month) =>
      isSameMonth(month, previousCurrentMonth) && !isSameMonth(month, currentMonth)
        ? currentMonth
        : month
    );
    setVisibleDayCount((count) =>
      isSameMonth(previousCurrentMonth, currentMonth) ? count : normalizedInitialVisibleDays
    );
    previousCurrentMonthRef.current = currentMonth;
  }, [currentMonth, normalizedInitialVisibleDays]);

  const activity = useMemo(
    () =>
      deriveMonthlyPomodoroActivity(state, {
        year: selectedMonth.year,
        monthIndex: selectedMonth.monthIndex,
        now,
        journeyId,
      }),
    [journeyId, now, selectedMonth.monthIndex, selectedMonth.year, state]
  );
  const monthLabel = formatMonth(selectedMonth);
  const todayKey = getLocalDateKey(now);
  const canViewNextMonth = compareMonths(selectedMonth, currentMonth) < 0;
  const visibleDays = activity.days.slice(Math.max(0, activity.days.length - visibleDayCount));
  const earlierDayCount = Math.max(0, activity.days.length - visibleDayCount);
  const earlierBatchCount = Math.min(REVEAL_BATCH_SIZE, earlierDayCount);
  const hasEarlierDays = earlierDayCount > 0;
  const hasExpandedDays = visibleDayCount > normalizedInitialVisibleDays;
  const visibleDayStatus = `Showing ${visibleDays.length} of ${activity.days.length} active ${activity.days.length === 1 ? 'day' : 'days'}`;
  const revealEarlierLabel = `Show ${earlierBatchCount} earlier ${earlierBatchCount === 1 ? 'day' : 'days'}`;
  const collapseLatestLabel = `Show latest ${normalizedInitialVisibleDays} ${normalizedInitialVisibleDays === 1 ? 'day' : 'days'}`;
  useEffect(() => {
    void visibleDayCount;
    const focusTarget = revealFocusTargetRef.current;
    if (focusTarget === null) return;

    revealFocusTargetRef.current = null;
    const target = sectionRef.current?.querySelector<HTMLButtonElement>(
      `[data-monthly-activity-action="${focusTarget}"]`
    );
    target?.focus();
  }, [visibleDayCount]);

  function moveMonth(offset: -1 | 1) {
    setVisibleDayCount(normalizedInitialVisibleDays);
    setSelectedMonth((month) => {
      const nextMonth = normalizeLocalMonth(month.year, month.monthIndex + offset);
      if (nextMonth === null) return month;
      if (compareMonths(nextMonth, currentMonth) > 0) return month;
      return nextMonth;
    });
  }

  function revealEarlierDays() {
    const nextVisibleDayCount = Math.min(activity.days.length, visibleDayCount + REVEAL_BATCH_SIZE);
    if (nextVisibleDayCount === activity.days.length) {
      revealFocusTargetRef.current = 'collapse';
    }
    setVisibleDayCount(nextVisibleDayCount);
  }

  function collapseToLatestDays() {
    revealFocusTargetRef.current = 'reveal';
    setVisibleDayCount(normalizedInitialVisibleDays);
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby={sectionHeadingId}
      className="overflow-hidden rounded-xl border border-ink/15 bg-paper"
    >
      <header className="px-4 pt-5 pb-4 sm:px-6">
        <Heading className="mb-1 font-bold text-2xl tracking-[-0.025em]" id={sectionHeadingId}>
          Monthly activity
        </Heading>
        {scopeLabel ? (
          <p className="mb-0 text-ink/60 text-sm [overflow-wrap:anywhere]">{scopeLabel}</p>
        ) : null}
      </header>

      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 border-ink/15 border-y px-3 py-2 sm:gap-3 sm:px-5">
        <Button
          aria-label="View previous month"
          onClick={() => moveMonth(-1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <MonthHeading
          aria-atomic="true"
          aria-live="polite"
          className="mb-0 text-center font-bold text-base leading-tight sm:text-lg"
          id={monthHeadingId}
        >
          {monthLabel}
        </MonthHeading>
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
      </div>

      <dl
        aria-label={`Month total: ${formatPomodoroCount(activity.totalPomodoros)}, ${formatFocusedMinutes(activity.focusedMinutes)} (${formatFocusedDuration(activity.focusedMinutes)}).`}
        className="flex items-center justify-between gap-4 border-ink/15 border-b px-4 py-5 sm:px-6"
      >
        <dt className="shrink-0 font-bold text-ink/60 text-sm sm:text-base">Month total</dt>
        <dd className="mb-0 min-w-0 text-right [overflow-wrap:anywhere]">
          <span className="block font-bold text-xl tabular-nums leading-tight tracking-[-0.02em] sm:text-2xl">
            {formatPomodoroCount(activity.totalPomodoros)}
          </span>
          <span className="mt-1 block text-ink/60 text-sm tabular-nums leading-tight sm:text-base">
            {formatFocusedDuration(activity.focusedMinutes)}
          </span>
        </dd>
      </dl>

      {activity.days.length > normalizedInitialVisibleDays ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-ink/15 border-b px-4 py-3 sm:px-6">
          <p aria-live="polite" className="m-0 text-ink/60 text-sm tabular-nums">
            {visibleDayStatus}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasEarlierDays ? (
              <Button
                aria-label={revealEarlierLabel}
                data-monthly-activity-action="reveal"
                onClick={revealEarlierDays}
                size="sm"
                title={revealEarlierLabel}
                type="button"
                variant="ghost"
              >
                <ChevronUp aria-hidden="true" />
                <span aria-hidden="true">{earlierBatchCount} earlier</span>
              </Button>
            ) : null}
            {hasExpandedDays ? (
              <Button
                aria-label={collapseLatestLabel}
                data-monthly-activity-action="collapse"
                onClick={collapseToLatestDays}
                size="sm"
                title={collapseLatestLabel}
                type="button"
                variant="ghost"
              >
                <ChevronDown aria-hidden="true" />
                <span aria-hidden="true">Latest {normalizedInitialVisibleDays}</span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <table aria-labelledby={monthHeadingId} className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[5.5rem] sm:w-32" />
          <col />
          <col className="w-14 sm:w-20" />
        </colgroup>
        <thead>
          <tr className="text-ink/60 text-xs">
            <th className="px-3 py-2 text-left font-bold sm:px-5" scope="col">
              Date
            </th>
            <th className="px-1.5 py-2 text-left font-bold sm:px-3" scope="col">
              Focused work
            </th>
            <th className="px-3 py-2 text-right font-bold sm:px-5" scope="col">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleDays.map((day) => (
            <ActivityRow day={day} key={day.dateKey} todayKey={todayKey} />
          ))}
        </tbody>
      </table>

      {activity.days.length === 0 ? (
        <p className="m-0 border-ink/15 border-t px-4 py-8 text-center text-ink/60 text-sm sm:px-6">
          {journeyId === undefined
            ? 'No focused work across your Journeys this month.'
            : 'No focused work for this Journey this month.'}
        </p>
      ) : null}
    </section>
  );
}
