import { Snowflake } from 'lucide-react';

import { formatFocusedDuration } from '@/lib/format-focused-duration';
import {
  compareLocalDateKeys,
  getLocalMonthGridDateKeys,
  type LocalDateKey,
  localDateKeyToDate,
  parseLocalDateKey,
} from '@/lib/local-date';
import type { StreakDay } from '@/lib/streaks';
import { cn } from '@/lib/utils';

const WEEKDAYS = [
  { abbreviation: 'Su', name: 'Sunday' },
  { abbreviation: 'Mo', name: 'Monday' },
  { abbreviation: 'Tu', name: 'Tuesday' },
  { abbreviation: 'We', name: 'Wednesday' },
  { abbreviation: 'Th', name: 'Thursday' },
  { abbreviation: 'Fr', name: 'Friday' },
  { abbreviation: 'Sa', name: 'Saturday' },
] as const;

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDateLabel(
  dateKey: LocalDateKey,
  day: StreakDay | undefined,
  asOfDateKey: LocalDateKey | null
) {
  const date = localDateKeyToDate(dateKey);
  const formattedDate = date === null ? dateKey : fullDateFormatter.format(date);
  const todayLabel = dateKey === asOfDateKey ? ', today' : '';

  if (day?.state === 'practiced') {
    const freezeEarnedLabel = day.freezeAwarded ? ', streak freeze earned' : '';
    return `${formattedDate}${todayLabel}: practiced, ${formatFocusedDuration(
      day.focusedMinutes
    )} focused${freezeEarnedLabel}.`;
  }

  if (day?.state === 'freeze-used') {
    return `${formattedDate}${todayLabel}: 1 freeze used.`;
  }

  if (day?.state === 'missed') {
    return `${formattedDate}: no qualifying focus; streak sequence ended.`;
  }

  if (asOfDateKey !== null && compareLocalDateKeys(dateKey, asOfDateKey) > 0) {
    return `${formattedDate}: future date.`;
  }

  if (dateKey === asOfDateKey) {
    return `${formattedDate}, today: not yet practiced.`;
  }

  return `${formattedDate}: no qualifying focus.`;
}

function isSequenceDay(day: StreakDay | undefined) {
  return day?.state === 'practiced' || day?.state === 'freeze-used';
}

function CalendarDay({
  asOfDateKey,
  dateKey,
  day,
  hasNextSequenceDay,
  hasPreviousSequenceDay,
  selectedMonthIndex,
  selectedYear,
}: {
  asOfDateKey: LocalDateKey | null;
  dateKey: LocalDateKey;
  day: StreakDay | undefined;
  hasNextSequenceDay: boolean;
  hasPreviousSequenceDay: boolean;
  selectedMonthIndex: number;
  selectedYear: number;
}) {
  const parts = parseLocalDateKey(dateKey);
  const dayNumber = parts?.day ?? '';
  const isInSelectedMonth = parts?.year === selectedYear && parts.month - 1 === selectedMonthIndex;
  const isToday = dateKey === asOfDateKey;
  const isFuture = asOfDateKey !== null && compareLocalDateKeys(dateKey, asOfDateKey) > 0;
  const sequenceDay = isSequenceDay(day);

  return (
    <td
      aria-label={formatDateLabel(dateKey, day, asOfDateKey)}
      className="relative min-w-0 p-0"
      data-date={dateKey}
      data-sequence-end={sequenceDay && !hasNextSequenceDay ? 'true' : undefined}
      data-sequence-start={sequenceDay && !hasPreviousSequenceDay ? 'true' : undefined}
      data-state={day?.state ?? (isFuture ? 'future' : 'inactive')}
    >
      {sequenceDay ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-1',
            isInSelectedMonth ? 'bg-pomodoro-red' : 'bg-pomodoro-red/10',
            hasPreviousSequenceDay ? 'left-0' : 'left-1 rounded-l-full',
            hasNextSequenceDay ? 'right-0' : 'right-1 rounded-r-full'
          )}
        />
      ) : null}

      <span className="relative z-10 flex min-h-12 items-center justify-center px-0.5">
        {day?.state === 'freeze-used' ? (
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex size-8 items-center justify-center gap-0.5 rounded-full border border-dashed bg-paper text-[0.6875rem] tabular-nums',
              isInSelectedMonth
                ? 'border-ink font-bold text-ink'
                : 'border-ink/50 font-normal text-ink/60',
              isToday && 'ring-2 ring-ink ring-offset-1 ring-offset-paper'
            )}
          >
            <Snowflake className="size-3" strokeWidth={2.25} />
            {dayNumber}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full text-xs tabular-nums',
              isInSelectedMonth && day?.state === 'practiced' && 'font-bold text-paper',
              !isInSelectedMonth && day?.state === 'practiced' && 'font-normal text-ink/65',
              isInSelectedMonth && day?.state === 'missed' && 'font-medium text-ink/60',
              isInSelectedMonth && day === undefined && !isFuture && 'font-medium text-ink/60',
              isInSelectedMonth && isFuture && 'font-normal text-ink/60',
              !isInSelectedMonth && day?.state !== 'practiced' && 'font-normal text-ink/60',
              isToday && 'ring-2 ring-ink ring-inset'
            )}
          >
            {dayNumber}
          </span>
        )}
      </span>
    </td>
  );
}

export function StreakCalendar({
  asOfDateKey,
  daysByDate,
  monthIndex,
  year,
}: {
  asOfDateKey: LocalDateKey | null;
  daysByDate: Readonly<Partial<Record<LocalDateKey, StreakDay>>>;
  monthIndex: number;
  year: number;
}) {
  const dateKeys = getLocalMonthGridDateKeys(year, monthIndex);
  const rows: LocalDateKey[][] = [];

  for (let index = 0; index < dateKeys.length; index += 7) {
    rows.push(dateKeys.slice(index, index + 7));
  }

  const monthDate = new Date(0);
  monthDate.setHours(12, 0, 0, 0);
  monthDate.setFullYear(year, monthIndex, 1);
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  return (
    <table
      aria-label={`${monthLabel} streak calendar`}
      className="w-full table-fixed border-collapse"
    >
      <thead>
        <tr>
          {WEEKDAYS.map((weekday) => (
            <th
              aria-label={weekday.name}
              className="h-11 p-0 text-center font-medium text-ink/60 text-xs"
              key={weekday.name}
              scope="col"
            >
              {weekday.abbreviation}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            {row.map((dateKey, columnIndex) => {
              const day = daysByDate[dateKey];
              const previousDateKey = row[columnIndex - 1];
              const nextDateKey = row[columnIndex + 1];

              return (
                <CalendarDay
                  asOfDateKey={asOfDateKey}
                  dateKey={dateKey}
                  day={day}
                  hasNextSequenceDay={
                    nextDateKey !== undefined && isSequenceDay(daysByDate[nextDateKey])
                  }
                  hasPreviousSequenceDay={
                    previousDateKey !== undefined && isSequenceDay(daysByDate[previousDateKey])
                  }
                  key={dateKey}
                  selectedMonthIndex={monthIndex}
                  selectedYear={year}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StreakCalendarLegend() {
  return (
    <ul
      aria-label="Calendar legend"
      className="m-0 flex list-none flex-wrap gap-x-5 gap-y-3 p-0 text-ink/60 text-xs"
    >
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-4 rounded-full bg-pomodoro-red" />
        Focus day
      </li>
      <li className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex size-4 items-center justify-center rounded-full border border-ink border-dashed bg-paper text-ink"
        >
          <Snowflake className="size-2.5" />
        </span>
        Freeze used
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-4 rounded-full ring-2 ring-ink ring-inset" />
        Today
      </li>
    </ul>
  );
}
