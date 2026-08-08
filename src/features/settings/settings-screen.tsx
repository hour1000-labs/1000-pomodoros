import { Link } from '@tanstack/react-router';
import { Download, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { ImportSavedData } from '@/components/shared/import-saved-data';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApplicationLayout } from '@/features/journeys/components/application-layout';
import { ApplicationStateBoundary } from '@/features/journeys/components/application-state-boundary';
import { formatFocusedDuration } from '@/lib/format-focused-duration';
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';
import type { AppState, Journey } from '@/lib/models';
import { getFocusedMinutes } from '@/lib/progress';
import { appRepository, createAppExport } from '@/lib/repository';

type SettingsFeedback = {
  kind: 'error' | 'success';
  message: string;
};

function getPluralizedLabel(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function createBackupFileName() {
  return `1000-pomodoros-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function journeyHasActiveWork(state: AppState, journeyId: string) {
  if (!state.activeTimer) return false;
  const activeSession = state.focusSessions.find(
    (session) => session.id === state.activeTimer?.sessionId
  );
  return activeSession?.journeyId === journeyId;
}

function DeleteJourneyDialog({
  journey,
  hasActiveWork,
  errorMessage,
  trigger,
  onOpen,
  onConfirm,
}: {
  journey: Journey;
  hasActiveWork: boolean;
  errorMessage: string | null;
  trigger: React.ReactNode;
  onOpen: () => void;
  onConfirm: () => void;
}) {
  const [confirmInput, setConfirmInput] = useState('');
  const isMatch = confirmInput.trim() === journey.name.trim();

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setConfirmInput('');
          onOpen();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{journey.name}”?</DialogTitle>
          <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-pomodoro-red/30 bg-pomodoro-red/10 p-3 text-ink text-sm">
            <p className="mb-0">
              Permanently delete “{journey.name}” and all of its Next steps, focus sessions,
              milestones, and focused progress.
              {hasActiveWork
                ? ' An active focus session for this Journey is currently running or paused and will also be ended.'
                : ''}
            </p>
          </div>

          <div>
            <label
              htmlFor={`confirm-delete-${journey.id}`}
              className="block text-ink text-sm leading-snug"
            >
              To confirm, type{' '}
              <strong className="select-all font-bold text-pomodoro-red">“{journey.name}”</strong>{' '}
              below:
            </label>
            <Input
              id={`confirm-delete-${journey.id}`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={journey.name}
              className="mt-2"
              autoComplete="off"
            />
          </div>
        </div>

        {errorMessage ? (
          <p
            className="mb-0 font-bold text-pomodoro-red text-sm"
            role="alert"
            aria-live="assertive"
          >
            {errorMessage}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={!isMatch} onClick={onConfirm}>
            Delete Journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsContent({ state }: { state: AppState }) {
  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);
  const [deletionFeedback, setDeletionFeedback] = useState<SettingsFeedback | null>(null);

  const navigationJourneyId = state.journeys[0]?.id ?? LEARN_GUITAR_JOURNEY_ID;
  const focusedMinutes = getFocusedMinutes(state.focusSessions);

  function handleExport() {
    try {
      const backup = createAppExport(state);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = createBackupFileName();
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({
        kind: 'success',
        message: `Downloaded a backup of ${state.journeys.length} ${getPluralizedLabel(state.journeys.length, 'Journey')}.`,
      });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'The backup could not be downloaded. Try again.',
      });
    }
  }

  function handleDeleteJourney(journey: Journey) {
    const result = appRepository.deleteJourney(journey.id);

    if (result.status === 'saved') {
      setDeletionFeedback({
        kind: 'success',
        message: `Deleted “${journey.name}” and its saved progress.`,
      });
    } else {
      setDeletionFeedback({
        kind: 'error',
        message: `Failed to delete “${journey.name}”. Try again.`,
      });
    }
  }

  return (
    <ApplicationLayout journeyId={navigationJourneyId}>
      <ScreenHeader
        eyebrow="Your data"
        title="Settings"
        description="Manage saved Journeys or move your progress between devices with a local backup."
      />

      <div className="mt-10 grid max-w-reading gap-6">
        <section aria-labelledby="saved-data-heading">
          <Card className="border border-ink/15 bg-paper py-0 ring-0">
            <CardHeader className="border-b p-6 sm:p-8">
              <CardTitle id="saved-data-heading" className="text-xl">
                Saved data
              </CardTitle>
              <CardDescription>
                Your backup includes Journeys, Next steps, sessions, milestones, goals, and other
                saved progress from this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <dl className="mb-7 grid grid-cols-2 gap-5 sm:grid-cols-3">
                <div>
                  <dt className="mb-1 text-ink/60 text-sm">Journeys</dt>
                  <dd className="mb-0 font-bold text-2xl tabular-nums">{state.journeys.length}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-ink/60 text-sm">Focused time</dt>
                  <dd className="mb-0 font-bold text-lg tabular-nums">
                    {formatFocusedDuration(focusedMinutes)}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-ink/60 text-sm">Sessions</dt>
                  <dd className="mb-0 font-bold text-2xl tabular-nums">
                    {state.focusSessions.length}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Button type="button" onClick={handleExport} className="w-full sm:w-auto">
                  <Download aria-hidden="true" />
                  Export saved data
                </Button>
                <ImportSavedData />
              </div>

              {feedback ? (
                <p
                  className={`mt-5 mb-0 font-bold text-sm ${feedback.kind === 'error' ? 'text-pomodoro-red' : 'text-ink/70'}`}
                  role={feedback.kind === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  {feedback.message}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="manage-journeys-heading">
          <Card className="border border-ink/15 bg-paper py-0 ring-0">
            <CardHeader className="border-b p-6 sm:p-8">
              <CardTitle id="manage-journeys-heading" className="text-xl">
                Manage Journeys
              </CardTitle>
              <CardDescription>Review or remove saved Journeys from this device.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {state.journeys.length === 0 ? (
                <div className="text-ink/70 text-sm">
                  <p className="mb-4">No saved Journeys on this device.</p>
                  <Button variant="outline" asChild>
                    <Link to="/onboarding/journey" search={{ fresh: true }}>
                      <Plus aria-hidden="true" />
                      Create a Journey
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-ink/10 rounded-lg border border-ink/15 bg-background">
                  {state.journeys.map((journey) => {
                    const journeyMinutes = getFocusedMinutes(state.focusSessions, journey.id);
                    const journeySessionsCount = state.focusSessions.filter(
                      (session) => session.journeyId === journey.id
                    ).length;
                    const hasActiveWork = journeyHasActiveWork(state, journey.id);

                    return (
                      <li
                        key={journey.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="mb-1 font-bold text-base text-ink">{journey.name}</p>
                          <p className="mb-0 text-ink/60 text-sm">
                            {formatFocusedDuration(journeyMinutes)} · {journeySessionsCount}{' '}
                            {getPluralizedLabel(journeySessionsCount, 'session')}
                          </p>
                        </div>
                        <DeleteJourneyDialog
                          journey={journey}
                          hasActiveWork={hasActiveWork}
                          errorMessage={
                            deletionFeedback?.kind === 'error' ? deletionFeedback.message : null
                          }
                          onOpen={() => setDeletionFeedback(null)}
                          onConfirm={() => handleDeleteJourney(journey)}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-pomodoro-red/30 text-pomodoro-red hover:border-pomodoro-red/60 hover:bg-pomodoro-red/10 sm:w-auto"
                              aria-label={`Delete ${journey.name}`}
                            >
                              <Trash2 aria-hidden="true" />
                              Delete Journey
                            </Button>
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}

              {deletionFeedback?.kind === 'success' ? (
                <p
                  className="mt-5 mb-0 font-bold text-ink/70 text-sm"
                  role="status"
                  aria-live="polite"
                >
                  {deletionFeedback.message}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <aside className="flex gap-3 rounded-lg border border-ink/15 p-5 text-ink/65 text-sm leading-relaxed">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-pomodoro-red" />
          <p className="mb-0">
            Backups stay on your device until you choose where to save or share the downloaded file.
            Keep one somewhere safe if this progress matters to you.
          </p>
        </aside>
      </div>
    </ApplicationLayout>
  );
}

export function SettingsScreen() {
  return (
    <ApplicationStateBoundary variant="settings">
      {(state) => <SettingsContent state={state} />}
    </ApplicationStateBoundary>
  );
}
