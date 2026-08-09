import { Check, Plus } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { NextStep } from '@/lib/models';
import { getNextStepError, NEXT_STEP_MAX_LENGTH } from '@/lib/next-step';
import { appRepository } from '@/lib/repository';

import { JourneyDetailDialog } from './journey-detail-dialog';
import { JourneyDetailUpcomingSteps } from './journey-detail-upcoming-steps';

function createNextStepIdentity() {
  const createdAt = new Date().toISOString();
  const suffix = globalThis.crypto?.randomUUID?.() ?? createdAt.replace(/[^0-9]/g, '');
  return { createdAt, id: `next-step-${suffix}` };
}

export function JourneyDetailNextSteps({
  journeyId,
  upcomingSteps,
  addOpen,
  onAddOpenChange,
  activeSessionNextStepId,
  sessionReferencedNextStepIds,
  readOnly = false,
}: {
  journeyId: string;
  upcomingSteps: readonly NextStep[];
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
  activeSessionNextStepId: string | null;
  sessionReferencedNextStepIds: readonly string[];
  readOnly?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingIdentity = useRef<ReturnType<typeof createNextStepIdentity> | null>(null);
  const titleError = getNextStepError(title);

  function changeAddOpen(open: boolean) {
    onAddOpenChange(open);

    if (open) return;

    setTitle('');
    setTouched(false);
    setIsSaving(false);
    setAddError(null);
    pendingIdentity.current = null;
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    setAddError(null);
    pendingIdentity.current = null;
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setAddError(null);

    if (isSaving || titleError !== null) return;

    const identity = pendingIdentity.current ?? createNextStepIdentity();
    pendingIdentity.current = identity;
    setIsSaving(true);

    const result = appRepository.addNextStep(journeyId, title, identity.createdAt, identity.id);

    if (result.status === 'saved' && result.state.nextSteps.some(({ id }) => id === identity.id)) {
      changeAddOpen(false);
      return;
    }

    setIsSaving(false);
    setAddError('Your Next step could not be saved. Nothing changed. Try again.');
  }

  return (
    <>
      <section aria-labelledby="next-steps-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-ink/15 border-b pb-3">
          <h2 id="next-steps-heading" className="mb-0 font-bold text-2xl tracking-[-0.025em]">
            Next steps
          </h2>
          {!readOnly ? (
            <Button
              data-next-step-add
              type="button"
              variant="outline"
              onClick={() => changeAddOpen(true)}
            >
              <Plus aria-hidden="true" />
              Add Next step
            </Button>
          ) : null}
        </div>

        {readOnly ? (
          upcomingSteps.length === 0 ? (
            <p className="mb-0 text-ink/60 text-sm">No upcoming steps.</p>
          ) : (
            <ol className="m-0 list-none p-0" aria-label="Upcoming Next steps">
              {upcomingSteps.map((step, index) => (
                <li
                  key={step.id}
                  className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-ink/15 border-b py-4"
                >
                  <span
                    aria-hidden="true"
                    className="font-bold text-[0.72rem] text-ink/60 tabular-nums"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 font-bold leading-snug [overflow-wrap:anywhere]">
                    {step.title}
                  </span>
                </li>
              ))}
            </ol>
          )
        ) : (
          <JourneyDetailUpcomingSteps
            journeyId={journeyId}
            upcomingSteps={upcomingSteps}
            activeSessionNextStepId={activeSessionNextStepId}
            sessionReferencedNextStepIds={sessionReferencedNextStepIds}
          />
        )}
      </section>

      {!readOnly ? (
        <JourneyDetailDialog
          open={addOpen}
          onOpenChange={changeAddOpen}
          titleId="journey-add-next-step-title"
          descriptionId="journey-add-next-step-description"
          initialFocusRef={inputRef}
        >
          <div className="flex flex-col gap-2">
            <h2 id="journey-add-next-step-title" className="mb-0 pr-10 font-bold text-xl">
              Add a Next step
            </h2>
            <p
              id="journey-add-next-step-description"
              className="mb-0 text-muted-foreground text-sm"
            >
              Choose one action you can start now.
            </p>
          </div>
          <form noValidate onSubmit={handleAdd}>
            <label htmlFor="journey-next-step-title" className="mb-2 block font-bold text-sm">
              Next step
            </label>
            <Input
              ref={inputRef}
              id="journey-next-step-title"
              value={title}
              maxLength={NEXT_STEP_MAX_LENGTH}
              aria-invalid={(touched && titleError !== null) || undefined}
              aria-describedby={
                touched && titleError !== null ? 'journey-next-step-error' : undefined
              }
              placeholder="Practice the chord change slowly"
              onChange={(event) => handleTitleChange(event.target.value)}
              onBlur={() => setTouched(true)}
            />
            <div className="mt-2 flex items-start justify-between gap-4 text-sm">
              <p
                id="journey-next-step-error"
                className="mb-0 text-pomodoro-red"
                role={touched && titleError !== null ? 'alert' : undefined}
              >
                {touched ? titleError : null}
              </p>
              <span className="ml-auto shrink-0 text-ink/65 tabular-nums">
                {title.length}/{NEXT_STEP_MAX_LENGTH}
              </span>
            </div>
            {addError ? (
              <p className="mt-3 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                {addError}
              </p>
            ) : null}
            <div className="-mx-4 mt-5 -mb-4 flex flex-col-reverse gap-2 border-ink/15 border-t p-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => changeAddOpen(false)}>
                Cancel
              </Button>
              <PrimaryButton type="submit" disabled={isSaving}>
                {isSaving ? 'Adding…' : 'Add Next step'}
              </PrimaryButton>
            </div>
          </form>
        </JourneyDetailDialog>
      ) : null}
    </>
  );
}

export function JourneyDetailCurrentStep({
  journeyId,
  currentStep,
  primaryAction,
  onRequestAdd,
  hasActiveFocusSession,
  readOnly = false,
}: {
  journeyId: string;
  currentStep: NextStep | null;
  primaryAction?: ReactNode;
  onRequestAdd: () => void;
  hasActiveFocusSession: boolean;
  readOnly?: boolean;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [sessionBlockerOpen, setSessionBlockerOpen] = useState(false);
  const completionInFlight = useRef(false);
  const activeStepId = useRef(currentStep?.id);
  const completeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeStepId.current === currentStep?.id) return;

    activeStepId.current = currentStep?.id;
    completionInFlight.current = false;
    setIsCompleting(false);
    setCompleteError(null);
  }, [currentStep?.id]);

  function handleComplete() {
    if (currentStep === null || completionInFlight.current) return;
    if (hasActiveFocusSession) {
      setSessionBlockerOpen(true);
      return;
    }

    completionInFlight.current = true;
    setIsCompleting(true);
    setCompleteError(null);

    const result = appRepository.completeCurrentNextStep(
      journeyId,
      currentStep.id,
      new Date().toISOString()
    );
    const completedStep =
      result.status === 'saved'
        ? result.state.nextSteps.find(({ id }) => id === currentStep.id)
        : null;

    if (completedStep?.status === 'completed') return;

    completionInFlight.current = false;
    setIsCompleting(false);
    setCompleteError('Your Next step could not be completed. Nothing changed. Try again.');
  }

  return (
    <aside className="min-w-0 border-ink/15 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
      <p className="mb-3 font-bold text-ink/60 text-sm">Next step</p>
      {currentStep ? (
        <>
          <h2 className="mb-3 font-bold text-2xl leading-tight tracking-[-0.025em] [overflow-wrap:anywhere]">
            {currentStep.title}
          </h2>
          <p className="mb-5 text-ink/60 text-sm">
            {readOnly
              ? 'This is a sample Journey. Create your own Journey to start focusing.'
              : 'Finish the session to add a Pomodoro.'}
          </p>
          {!readOnly ? (
            <>
              {primaryAction ? <div className="mb-3 hidden md:block">{primaryAction}</div> : null}
              <Button
                ref={completeButtonRef}
                data-current-next-step-focus-fallback
                type="button"
                variant="outline"
                className="w-full"
                disabled={isCompleting}
                onClick={handleComplete}
              >
                <Check aria-hidden="true" />
                {isCompleting ? 'Completing…' : 'Mark complete'}
              </Button>
              {completeError ? (
                <p className="mt-3 mb-0 font-bold text-pomodoro-red text-sm" role="alert">
                  {completeError}
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="mb-3 font-bold text-2xl leading-tight tracking-[-0.025em]">
            All caught up
          </h2>
          <p className="mb-5 text-ink/60 text-sm">
            {readOnly
              ? 'This is a sample Journey. Create your own Journey to add a Next step.'
              : 'Add a Next step when you are ready to keep going.'}
          </p>
          {!readOnly ? (
            <PrimaryButton
              type="button"
              className="hidden w-full md:inline-flex"
              onClick={onRequestAdd}
            >
              <Plus aria-hidden="true" />
              Add a Next step
            </PrimaryButton>
          ) : null}
        </>
      )}

      <Dialog open={sessionBlockerOpen} onOpenChange={setSessionBlockerOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            completeButtonRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Finish this Focus session first</DialogTitle>
            <DialogDescription>
              “{currentStep?.title ?? 'This step'}” is attached to your running or paused Focus
              session. Finish or cancel that session before marking it complete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
