import { Clock3 } from 'lucide-react';

import { JourneyDetailDialog } from './journey-detail-dialog';

export interface JourneyBlockContributionView {
  sessionId: string;
  date: string | null;
  focusedMinutes: number;
  contributionMinutes: number;
  nextStepTitle: string | null;
  source: 'timer' | 'manual';
}

function formatDate(value: string | null) {
  if (value === null) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatMinutes(minutes: number) {
  const roundedMinutes = Math.round(minutes * 10) / 10;
  return `${roundedMinutes} minute${roundedMinutes === 1 ? '' : 's'}`;
}

export function JourneyDetailBlockDialog({
  blockIndex,
  contributions,
  onOpenChange,
}: {
  blockIndex: number | null;
  contributions: readonly JourneyBlockContributionView[];
  onOpenChange: (open: boolean) => void;
}) {
  const blockNumber = blockIndex === null ? null : blockIndex + 1;

  return (
    <JourneyDetailDialog
      open={blockIndex !== null}
      onOpenChange={onOpenChange}
      dialogId="journey-block-detail-dialog"
      titleId="journey-block-detail-title"
      descriptionId="journey-block-detail-description"
      className="max-w-md"
      getReturnFocus={() =>
        blockIndex === null
          ? null
          : document.querySelector<HTMLButtonElement>(`[data-pomodoro-index="${blockIndex}"]`)
      }
    >
      <div className="flex flex-col gap-2">
        <p className="mb-0 font-bold text-[0.68rem] text-pomodoro-red uppercase tracking-[0.16em]">
          Visible effort
        </p>
        <h2 id="journey-block-detail-title" className="mb-0 pr-10 font-bold text-2xl">
          Pomodoro {blockNumber ?? ''}
        </h2>
        <p id="journey-block-detail-description" className="mb-0 text-muted-foreground text-sm">
          {contributions.length === 1
            ? 'The focus session that contributed to this block.'
            : `${contributions.length} focus sessions contributed minutes to this block.`}
        </p>
      </div>

      <ol className="m-0 grid list-none gap-3 p-0" aria-label="Contributing focus sessions">
        {contributions.map((contribution) => (
          <li
            key={contribution.sessionId}
            className="rounded-lg border border-ink/15 bg-ink/[0.02] p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="mb-0 font-bold text-sm">{formatDate(contribution.date)}</p>
              <span className="inline-flex items-center gap-1 font-bold text-ink/65 text-xs">
                <Clock3 aria-hidden="true" className="size-3.5" />
                {formatMinutes(contribution.focusedMinutes)}
              </span>
            </div>
            <p className="mb-1 font-bold leading-snug [overflow-wrap:anywhere]">
              {contribution.nextStepTitle ?? 'Next step unavailable'}
            </p>
            <p className="mb-0 text-ink/60 text-sm">
              {contribution.source === 'manual' ? 'Added manually' : 'Timer'}
              {contribution.contributionMinutes !== contribution.focusedMinutes
                ? ` · ${formatMinutes(contribution.contributionMinutes)} added to this block`
                : ''}
            </p>
          </li>
        ))}
      </ol>
    </JourneyDetailDialog>
  );
}
