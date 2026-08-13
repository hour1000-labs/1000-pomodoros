import { type FormEvent, useRef, useState } from 'react';

import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import { FOCUS_SESSION_ACTIVITY_MAX_LENGTH, type FocusSession } from '@/lib/models';
import { appRepository } from '@/lib/repository';
import { deriveStreakSessionImpact, type StreakSessionImpact } from '@/lib/streaks';

import {
  createManualFocusSession,
  getDateInputValue,
  getManualSessionFormError,
  type ManualSessionFormValues,
} from '../manual-session';

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

function createManualSessionIdentity() {
  const createdAt = new Date().toISOString();
  const suffix = globalThis.crypto?.randomUUID?.() ?? createdAt.replace(/[^0-9]/g, '');

  return `manual-session-${suffix}`;
}

function getInitialManualValues(): ManualSessionFormValues {
  return {
    completedDate: getDateInputValue(),
    activity: '',
    focusedMinutes: '25',
  };
}

function SavedManualSession({
  session,
  activityLabel,
  streakImpact,
}: {
  session: FocusSession;
  activityLabel: string;
  streakImpact: StreakSessionImpact;
}) {
  const streakImpactLabel = formatManualStreakImpact(streakImpact);

  return (
    <div className="rounded-lg border border-pomodoro-red/30 bg-pomodoro-red/10 p-3" role="status">
      <p className="mb-2 font-bold">Manual session saved</p>
      <dl className="m-0 grid gap-1 text-sm">
        <div className="flex flex-wrap justify-between gap-3">
          <dt className="text-ink/65">Date</dt>
          <dd className="m-0 font-bold">{formatDate(session.endedAt)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <dt className="text-ink/65">What you worked on</dt>
          <dd className="m-0 max-w-[70%] text-right font-bold [overflow-wrap:anywhere]">
            {activityLabel}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <dt className="text-ink/65">Focused time</dt>
          <dd className="m-0 font-bold">
            {formatFocusedDuration(session.focusedMinutes)} · Added manually
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <dt className="text-ink/65">Streak impact</dt>
          <dd className="m-0 max-w-[70%] text-right font-bold [overflow-wrap:anywhere]">
            {streakImpactLabel}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatManualStreakImpact(impact: StreakSessionImpact) {
  if (impact.state === 'already-counted') {
    return 'This date was already covered. Streak unchanged.';
  }

  if (impact.state === 'not-eligible') {
    return 'No streak change.';
  }

  const parts = impact.restored
    ? [`History restored`, `${impact.currentStreakAfter}-day current streak`]
    : [
        'This date now counts',
        impact.currentStreakAfter > 0
          ? `${impact.currentStreakAfter}-day current streak`
          : 'History recalculated',
      ];

  if (impact.freezesEarnedDelta > 0) {
    parts.push(`${formatCount(impact.freezesEarnedDelta, 'streak freeze')} earned`);
  }

  if (impact.freezesUsedDelta < 0) {
    parts.push(`${formatCount(-impact.freezesUsedDelta, 'streak freeze')} returned`);
  }

  if (impact.freezesUsedDelta > 0) {
    parts.push(`${formatCount(impact.freezesUsedDelta, 'streak freeze')} used after recalculation`);
  }

  if (
    impact.freezesEarnedDelta === 0 &&
    impact.freezesUsedDelta === 0 &&
    impact.freezesAvailableDelta !== 0
  ) {
    parts.push(
      `${formatCount(Math.abs(impact.freezesAvailableDelta), 'streak freeze')} ${impact.freezesAvailableDelta > 0 ? 'added' : 'deducted'}`
    );
  }

  if (
    impact.freezesEarnedDelta !== 0 ||
    impact.freezesUsedDelta !== 0 ||
    impact.freezesAvailableDelta !== 0
  ) {
    parts.push(`${formatCount(impact.freezesAvailableAfter, 'freeze')} available`);
  }

  return `${parts.join(' · ')}.`;
}

export function JourneyDetailBlockDialog({
  journeyId,
  blockIndex,
  contributions,
  readOnly = false,
  onOpenChange,
}: {
  journeyId: string;
  blockIndex: number | null;
  contributions: readonly JourneyBlockContributionView[];
  readOnly?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const blockNumber = blockIndex === null ? null : blockIndex + 1;
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualValues, setManualValues] = useState(() => getInitialManualValues());
  const [manualTouched, setManualTouched] = useState(false);
  const [manualSaveError, setManualSaveError] = useState<string | null>(null);
  const [savedManualSession, setSavedManualSession] = useState<{
    session: FocusSession;
    activityLabel: string;
    streakImpact: StreakSessionImpact;
  } | null>(null);
  const manualFormError = getManualSessionFormError(manualValues);

  function resetManualEntry() {
    setManualEntryOpen(false);
    setManualValues(getInitialManualValues());
    setManualTouched(false);
    setManualSaveError(null);
  }

  function changeDialogOpen(open: boolean) {
    if (!open) {
      resetManualEntry();
      setSavedManualSession(null);
    }

    onOpenChange(open);
  }

  function openManualEntry() {
    setSavedManualSession(null);
    setManualValues(getInitialManualValues());
    setManualTouched(false);
    setManualSaveError(null);
    setManualEntryOpen(true);
  }

  function handleManualValueChange(nextValues: Partial<ManualSessionFormValues>) {
    setManualValues((values) => ({ ...values, ...nextValues }));
    setManualSaveError(null);
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualTouched(true);
    setManualSaveError(null);

    if (manualFormError !== null) return;

    const focusedMinutes = Number(manualValues.focusedMinutes);

    if (!Number.isFinite(focusedMinutes)) {
      setManualSaveError('Choose a valid activity and focused time. Nothing changed.');
      return;
    }

    const session = createManualFocusSession({
      id: createManualSessionIdentity(),
      journeyId,
      activity: manualValues.activity,
      completedDate: manualValues.completedDate,
      focusedMinutes,
    });
    const beforeSave = appRepository.load();
    const result = appRepository.addManualFocusSession(session);

    if (
      result.status !== 'saved' ||
      !result.state.focusSessions.some(({ id }) => id === session.id)
    ) {
      setManualSaveError('Your manual session could not be saved. Nothing changed. Try again.');
      return;
    }

    setManualEntryOpen(false);
    setManualTouched(false);
    const beforeSessions =
      beforeSave.status === 'ready'
        ? beforeSave.state.focusSessions
        : result.state.focusSessions.filter(({ id }) => id !== session.id);
    setSavedManualSession({
      session,
      activityLabel: session.activity ?? manualValues.activity.trim(),
      streakImpact: deriveStreakSessionImpact(
        beforeSessions,
        session,
        result.state.journeys.map(({ id }) => id),
        new Date()
      ),
    });
  }

  return (
    <JourneyDetailDialog
      open={blockIndex !== null}
      onOpenChange={changeDialogOpen}
      dialogId="journey-block-detail-dialog"
      titleId="journey-block-detail-title"
      descriptionId="journey-block-detail-description"
      className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto"
      initialFocusRef={manualEntryOpen ? manualInputRef : undefined}
      getReturnFocus={() =>
        blockIndex === null
          ? null
          : document.querySelector<HTMLButtonElement>(`[data-pomodoro-index="${blockIndex}"]`)
      }
    >
      <div className="flex flex-col gap-2">
        <h2 id="journey-block-detail-title" className="mb-0 pr-10 font-bold text-2xl">
          Pomodoro {blockNumber ?? ''}
        </h2>
        <p id="journey-block-detail-description" className="mb-0 text-muted-foreground text-sm">
          {contributions.length === 0
            ? 'No Focus session has added time to this Pomodoro yet.'
            : contributions.length === 1
              ? 'One Focus session added time to this Pomodoro.'
              : `${contributions.length} Focus sessions added time to this Pomodoro.`}
        </p>
      </div>

      {contributions.length > 0 ? (
        <ol className="m-0 list-none p-0" aria-label="Contributing Focus sessions">
          {contributions.map((contribution) => (
            <li
              key={contribution.sessionId}
              className="border-ink/15 border-b py-4 last:border-b-0"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="mb-0 font-bold text-sm">{formatDate(contribution.date)}</p>
                <span className="font-bold text-ink/65 text-xs">
                  {formatFocusedDuration(contribution.focusedMinutes)}
                </span>
              </div>
              <p className="mb-1 font-bold leading-snug [overflow-wrap:anywhere]">
                {contribution.nextStepTitle ?? 'Next step unavailable'}
              </p>
              <p className="mb-0 text-ink/60 text-sm">
                {contribution.source === 'manual' ? 'Added manually' : 'Timer'}
                {contribution.contributionMinutes !== contribution.focusedMinutes
                  ? ` · ${formatFocusedDuration(contribution.contributionMinutes)} added to this Pomodoro`
                  : ''}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      {savedManualSession ? (
        <SavedManualSession
          session={savedManualSession.session}
          activityLabel={savedManualSession.activityLabel}
          streakImpact={savedManualSession.streakImpact}
        />
      ) : null}

      {!readOnly ? (
        <div className="border-ink/15 border-t pt-4">
          {manualEntryOpen ? (
            <form noValidate onSubmit={handleManualSubmit}>
              <div className="mb-4 flex flex-col gap-2">
                <h3 className="mb-0 font-bold text-lg">Record a missed session</h3>
                <p className="mb-0 text-ink/60 text-sm">
                  Forgot to start a session? Add the focused work you completed.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor="journey-manual-session-date"
                    className="mb-2 block font-bold text-sm"
                  >
                    Completed date
                  </label>
                  <Input
                    id="journey-manual-session-date"
                    type="date"
                    value={manualValues.completedDate}
                    max={getDateInputValue()}
                    aria-invalid={(manualTouched && manualFormError !== null) || undefined}
                    onChange={(event) =>
                      handleManualValueChange({ completedDate: event.target.value })
                    }
                    onBlur={() => setManualTouched(true)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="journey-manual-session-activity"
                    className="mb-2 block font-bold text-sm"
                  >
                    What did you work on?
                  </label>
                  <Input
                    ref={manualInputRef}
                    id="journey-manual-session-activity"
                    type="text"
                    maxLength={FOCUS_SESSION_ACTIVITY_MAX_LENGTH}
                    autoComplete="off"
                    placeholder="e.g. Practiced chord changes"
                    value={manualValues.activity}
                    aria-invalid={(manualTouched && manualFormError !== null) || undefined}
                    onChange={(event) => handleManualValueChange({ activity: event.target.value })}
                    onBlur={() => setManualTouched(true)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="journey-manual-session-minutes"
                    className="mb-2 block font-bold text-sm"
                  >
                    Focused minutes
                  </label>
                  <Input
                    id="journey-manual-session-minutes"
                    type="number"
                    min={5}
                    step="any"
                    inputMode="decimal"
                    value={manualValues.focusedMinutes}
                    aria-invalid={(manualTouched && manualFormError !== null) || undefined}
                    onChange={(event) =>
                      handleManualValueChange({ focusedMinutes: event.target.value })
                    }
                    onBlur={() => setManualTouched(true)}
                  />
                </div>
              </div>

              <p
                className="mt-3 mb-0 min-h-5 text-pomodoro-red text-sm"
                role={manualTouched && manualFormError !== null ? 'alert' : undefined}
              >
                {manualTouched ? manualFormError : null}
              </p>
              {manualSaveError ? (
                <p className="mt-3 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                  {manualSaveError}
                </p>
              ) : null}
              <div className="-mx-4 mt-5 -mb-4 flex flex-col-reverse gap-2 border-ink/15 border-t p-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={resetManualEntry}>
                  Cancel
                </Button>
                <PrimaryButton type="submit">Add session</PrimaryButton>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="link"
              className="h-auto w-full justify-start whitespace-normal p-0 text-left"
              onClick={openManualEntry}
            >
              Forgot to start a session?
            </Button>
          )}
        </div>
      ) : null}
    </JourneyDetailDialog>
  );
}
