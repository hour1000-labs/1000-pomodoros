import { FileUp } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { formatFocusedTime } from '@/features/journeys/format-focused-time';
import type { AppState } from '@/lib/models';
import { getFocusedMinutes } from '@/lib/progress';
import {
  appRepository,
  createAppExport,
  parseAppExport,
  type RepositorySaveResult,
} from '@/lib/repository';
import { cn } from '@/lib/utils';

type Feedback = {
  kind: 'error' | 'success';
  message: string;
};

type PendingImport = {
  fileName: string;
  state: AppState;
};

function getPluralizedLabel(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function getImportError(result: RepositorySaveResult) {
  if (result.status === 'error') return result.error.message;
  return 'Saved data could not be replaced in this browser. Try again.';
}

function getPendingImportDescription(pendingImport: PendingImport) {
  return `${pendingImport.fileName} contains ${pendingImport.state.journeys.length} ${getPluralizedLabel(pendingImport.state.journeys.length, 'Journey')} and ${formatFocusedTime(getFocusedMinutes(pendingImport.state.focusSessions))} of focused progress. This replaces every saved Journey and progress record on this device, including Next steps, sessions, milestones, goals, and timer state. This cannot be undone.`;
}

function readTextFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('The selected file could not be read as text.'));
      }
    });
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(file);
  });
}

export function ImportSavedData({
  compact = false,
  confirmBeforeImport = true,
  className,
}: {
  compact?: boolean;
  confirmBeforeImport?: boolean;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    setFeedback(null);
    setPendingImport(null);
    setIsReading(true);

    try {
      const importedState = parseAppExport(JSON.parse(await readTextFile(file)));

      if (importedState === null) {
        setFeedback({
          kind: 'error',
          message: 'This file is not a supported 1000 Pomodoros backup. Nothing was changed.',
        });
        return;
      }

      if (!confirmBeforeImport) {
        const result = appRepository.importState(createAppExport(importedState));

        if (result.status === 'saved') {
          setFeedback({
            kind: 'success',
            message: `Imported ${file.name}. Your saved Journeys and progress are ready.`,
          });
        } else {
          setFeedback({ kind: 'error', message: getImportError(result) });
        }
        return;
      }

      setPendingImport({ fileName: file.name, state: importedState });
      setFeedback({
        kind: 'success',
        message: `${file.name} is ready to import. Review the replacement warning below.`,
      });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'This file could not be read as JSON. Nothing was changed.',
      });
    } finally {
      setIsReading(false);
    }
  }

  function handleImport() {
    if (!pendingImport) return;

    const result = appRepository.importState(createAppExport(pendingImport.state));

    if (result.status === 'saved') {
      setPendingImport(null);
      setFeedback({
        kind: 'success',
        message: `Imported ${pendingImport.fileName}. Your saved Journeys and progress were replaced.`,
      });
      return;
    }

    setFeedback({ kind: 'error', message: getImportError(result) });
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {compact && pendingImport ? (
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              aria-label="Review import"
              className="px-2 text-ink/65 sm:px-3"
            >
              Review import
            </Button>
          }
          title="Replace saved data?"
          description={getPendingImportDescription(pendingImport)}
          confirmLabel="Replace saved data"
          onConfirm={handleImport}
        />
      ) : (
        <Button
          type="button"
          variant={compact ? 'ghost' : 'outline'}
          onClick={() => fileInputRef.current?.click()}
          disabled={isReading}
          aria-label={compact ? 'Import saved progress' : undefined}
          className={cn(compact ? 'px-2 text-ink/65 sm:px-3' : 'w-full sm:w-auto')}
        >
          <FileUp aria-hidden="true" />
          {compact ? (
            <>
              <span className="sm:hidden">Import</span>
              <span className="hidden sm:inline">Import saved progress</span>
            </>
          ) : isReading ? (
            'Reading backup…'
          ) : (
            'Choose backup to import'
          )}
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Choose a 1000 Pomodoros backup file"
        onChange={handleFileChange}
      />

      {feedback ? (
        <p
          className={`mb-0 font-bold text-sm ${feedback.kind === 'error' ? 'text-pomodoro-red' : 'text-ink/70'}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}

      {pendingImport && !compact ? (
        <div className="rounded-lg border border-ink/15 bg-ink/[.02] p-5">
          <h3 className="mb-2 font-bold text-base">Ready to import</h3>
          <p className="mb-4 text-ink/65 text-sm leading-relaxed">
            {pendingImport.fileName} contains {pendingImport.state.journeys.length}{' '}
            {getPluralizedLabel(pendingImport.state.journeys.length, 'Journey')} and{' '}
            {formatFocusedTime(getFocusedMinutes(pendingImport.state.focusSessions))} of focused
            progress.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ConfirmDialog
              trigger={<Button type="button">Replace saved data</Button>}
              title="Replace saved data?"
              description="This replaces every saved Journey and progress record on this device, including Next steps, sessions, milestones, goals, and timer state. This cannot be undone."
              confirmLabel="Replace saved data"
              onConfirm={handleImport}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPendingImport(null);
                setFeedback(null);
              }}
            >
              Cancel import
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
