import { EmptyState } from '@/components/shared/empty-state';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import type { FocusSession } from '@/lib/models';

function formatSessionDate(value: string | null) {
  if (value === null) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function JourneyDetailRecentSessions({
  sessions,
}: {
  sessions: readonly { session: FocusSession; nextStepTitle: string | null }[];
}) {
  return (
    <section aria-labelledby="recent-sessions-heading">
      <div className="mb-5 border-ink/15 border-b pb-3">
        <h2 id="recent-sessions-heading" className="mb-0 font-bold text-2xl tracking-[-0.025em]">
          Recent sessions
        </h2>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          className="min-h-44"
          title="No sessions yet"
          description="Finish at least five focused minutes to add a session."
        />
      ) : (
        <ol className="m-0 list-none p-0">
          {sessions.map(({ session, nextStepTitle }) => (
            <li
              key={session.id}
              className="grid gap-1 border-ink/15 border-b py-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <time
                dateTime={session.endedAt ?? session.startedAt}
                className="font-bold text-ink/60 text-sm"
              >
                {formatSessionDate(session.endedAt ?? session.startedAt)}
              </time>
              <p className="mb-0 min-w-0 font-bold leading-snug [overflow-wrap:anywhere]">
                {nextStepTitle ?? 'Next step unavailable'}
              </p>
              <span className="font-bold text-sm sm:justify-self-end">
                {formatFocusedDuration(session.focusedMinutes)}
                {session.source === 'manual' ? (
                  <span className="text-ink/65">· Added manually</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
