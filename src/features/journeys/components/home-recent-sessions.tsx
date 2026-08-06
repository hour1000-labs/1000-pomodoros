import { EmptyState } from '@/components/shared/empty-state';

import type { HomeRecentSession } from '../home-data';

function getLocalDateOrdinal(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatSessionDay(value: string | null, now: Date) {
  if (value === null) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  const dayDifference =
    (getLocalDateOrdinal(now) - getLocalDateOrdinal(date)) / (24 * 60 * 60 * 1_000);

  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Yesterday';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

function formatDuration(minutes: number) {
  const roundedMinutes = Math.round(minutes * 10) / 10;
  return `${roundedMinutes} min`;
}

export function HomeRecentSessions({
  now,
  sessions,
}: {
  now: Date;
  sessions: readonly HomeRecentSession[];
}) {
  return (
    <section aria-labelledby="home-recent-sessions-heading">
      <div className="mb-5 border-ink/15 border-b pb-4">
        <h2
          id="home-recent-sessions-heading"
          className="mb-0 font-bold text-3xl tracking-[-0.03em]"
        >
          Recent sessions
        </h2>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          className="min-h-52"
          title="No sessions yet"
          description="Finish at least five focused minutes to add a session."
        />
      ) : (
        <ol className="m-0 list-none p-0">
          {sessions.map(({ journeyName, nextStepTitle, session }) => (
            <li
              key={session.id}
              className="grid gap-2 border-ink/15 border-b py-5 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
            >
              <time
                dateTime={session.endedAt ?? session.startedAt}
                className="font-bold text-ink/60 text-sm"
              >
                {formatSessionDay(session.endedAt ?? session.startedAt, now)}
              </time>
              <div className="min-w-0">
                <p className="mb-1 font-bold leading-snug [overflow-wrap:anywhere]">
                  {nextStepTitle ?? 'Focused session'}
                </p>
                <p className="mb-0 text-ink/60 text-xs [overflow-wrap:anywhere]">
                  {journeyName ?? 'Journey unavailable'}
                  {session.source === 'manual' ? ' · Added manually' : ''}
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums sm:justify-self-end">
                {formatDuration(session.focusedMinutes)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
