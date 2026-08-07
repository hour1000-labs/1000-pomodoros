import type { FocusSession } from '@/lib/models';
import { MINIMUM_FOCUSED_MINUTES } from '@/lib/progress';

export interface ManualSessionFormValues {
  completedDate: string;
  nextStepId: string;
  focusedMinutes: string;
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function getDateInputValue(date = new Date()) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, '0')))
    .join('-');
}

export function getManualSessionFormError(values: ManualSessionFormValues, today = new Date()) {
  if (values.completedDate.length === 0) return 'Choose the date you completed the session.';

  const completedAt = parseDateInput(values.completedDate);

  if (completedAt === null) return 'Enter a valid completed date.';

  const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);

  if (completedAt > todayAtNoon) return 'The completed date cannot be in the future.';
  if (values.nextStepId.length === 0) return 'Choose the Next step you worked on.';
  if (values.focusedMinutes.trim().length === 0) return 'Enter the focused minutes you completed.';

  const focusedMinutes = Number(values.focusedMinutes);

  if (!Number.isFinite(focusedMinutes) || focusedMinutes < MINIMUM_FOCUSED_MINUTES) {
    return `Enter at least ${MINIMUM_FOCUSED_MINUTES} focused minutes.`;
  }

  return null;
}

export function createManualFocusSession({
  id,
  journeyId,
  nextStepId,
  completedDate,
  focusedMinutes,
}: {
  id: string;
  journeyId: string;
  nextStepId: string;
  completedDate: string;
  focusedMinutes: number;
}): FocusSession {
  const endedAt = parseDateInput(completedDate);

  if (endedAt === null) {
    throw new Error('Cannot create a manual session with an invalid date.');
  }

  const endedAtTimestamp = endedAt.getTime();

  return {
    id,
    journeyId,
    nextStepId,
    plannedMinutes: focusedMinutes,
    focusedMinutes,
    status: 'completed',
    source: 'manual',
    startedAt: new Date(endedAtTimestamp - focusedMinutes * 60 * 1_000).toISOString(),
    endedAt: endedAt.toISOString(),
    reflection: '',
  };
}
