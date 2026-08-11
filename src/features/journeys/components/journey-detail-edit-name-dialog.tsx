import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getJourneyNameError, JOURNEY_NAME_MAX_LENGTH } from '@/lib/journey-name';
import { getNextStepError, NEXT_STEP_MAX_LENGTH } from '@/lib/next-step';
import type { RepositorySaveResult } from '@/lib/repository';

import { JourneyDetailDialog } from './journey-detail-dialog';

type EditNameKind = 'journey' | 'next-step';

const editNameConfig = {
  journey: {
    label: 'Journey name',
    title: 'Edit Journey name',
    description: 'Keep this label short and clear.',
    maxLength: JOURNEY_NAME_MAX_LENGTH,
    getError: getJourneyNameError,
  },
  'next-step': {
    label: 'Next step',
    title: 'Edit Next step name',
    description: 'Name one concrete action you can start now.',
    maxLength: NEXT_STEP_MAX_LENGTH,
    getError: getNextStepError,
  },
} as const satisfies Record<EditNameKind, object>;

export function JourneyDetailEditNameDialog({
  kind,
  value,
  open,
  onOpenChange,
  onSave,
  getReturnFocus,
}: {
  kind: EditNameKind;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: string) => RepositorySaveResult;
  getReturnFocus?: () => HTMLElement | null;
}) {
  const config = editNameConfig[kind];
  const id = useId().replaceAll(':', '');
  const inputId = `${id}-input`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const validationError = config.getError(draft);
  const showValidation = touched && validationError !== null;

  useEffect(() => {
    if (!open) return;

    setDraft(value);
    setTouched(false);
    setIsSaving(false);
    setSaveError(null);
  }, [open, value]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSaving) return;
    onOpenChange(nextOpen);
  }

  function handleDraftChange(nextValue: string) {
    setDraft(nextValue);
    setSaveError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setSaveError(null);

    if (isSaving || validationError !== null) return;

    setIsSaving(true);
    const result = onSave(draft.trim());

    if (result.status === 'saved') {
      setIsSaving(false);
      onOpenChange(false);
      return;
    }

    setIsSaving(false);
    setSaveError(`Your ${config.label} could not be saved. Nothing changed. Try again.`);
  }

  return (
    <JourneyDetailDialog
      open={open}
      onOpenChange={handleOpenChange}
      titleId={`${id}-title`}
      descriptionId={descriptionId}
      initialFocusRef={inputRef}
      getReturnFocus={getReturnFocus}
    >
      <div className="flex flex-col gap-2">
        <h2 id={`${id}-title`} className="mb-0 pr-10 font-bold text-xl">
          {config.title}
        </h2>
        <p id={descriptionId} className="mb-0 text-muted-foreground text-sm">
          {config.description}
        </p>
      </div>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="mb-2 block font-bold text-sm">
          {config.label}
        </label>
        <Input
          ref={inputRef}
          id={inputId}
          value={draft}
          maxLength={config.maxLength}
          aria-invalid={showValidation || undefined}
          aria-describedby={showValidation ? errorId : undefined}
          onChange={(event) => handleDraftChange(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        <div className="mt-2 flex items-start justify-between gap-4 text-sm">
          <p
            id={errorId}
            className="mb-0 text-pomodoro-red"
            role={showValidation ? 'alert' : undefined}
          >
            {showValidation ? validationError : null}
          </p>
          <span className="ml-auto shrink-0 text-ink/65 tabular-nums">
            {draft.length}/{config.maxLength}
          </span>
        </div>
        {saveError ? (
          <p className="mt-3 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
            {saveError}
          </p>
        ) : null}
        <div className="-mx-4 mt-5 -mb-4 flex flex-col-reverse gap-2 border-ink/15 border-t p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <PrimaryButton type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save name'}
          </PrimaryButton>
        </div>
      </form>
    </JourneyDetailDialog>
  );
}
