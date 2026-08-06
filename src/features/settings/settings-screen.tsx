import { Download, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { ImportSavedData } from '@/components/shared/import-saved-data';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationLayout } from '@/features/journeys/components/application-layout';
import { ApplicationStateBoundary } from '@/features/journeys/components/application-state-boundary';
import { formatFocusedTime } from '@/features/journeys/format-focused-time';
import { LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';
import type { AppState } from '@/lib/models';
import { getFocusedMinutes } from '@/lib/progress';
import { createAppExport } from '@/lib/repository';

type ExportFeedback = {
  kind: 'error' | 'success';
  message: string;
};

function getPluralizedLabel(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function createBackupFileName() {
  return `1000-pomodoros-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function SettingsContent({ state }: { state: AppState }) {
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);
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

  return (
    <ApplicationLayout journeyId={navigationJourneyId}>
      <ScreenHeader
        eyebrow="Your data"
        title="Settings"
        description="Move your saved Journeys and progress between devices with a local backup."
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
                    {formatFocusedTime(focusedMinutes)}
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
    <ApplicationStateBoundary>
      {(state) => <SettingsContent state={state} />}
    </ApplicationStateBoundary>
  );
}
