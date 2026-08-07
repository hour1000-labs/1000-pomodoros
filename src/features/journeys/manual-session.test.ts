import { describe, expect, it } from 'vitest';

import {
  createManualFocusSession,
  getDateInputValue,
  getManualSessionFormError,
} from './manual-session';

const today = new Date(2026, 7, 6, 15, 30);

describe('manual session entry', () => {
  it('formats local dates for the date input', () => {
    expect(getDateInputValue(today)).toBe('2026-08-06');
  });

  it('requires a valid date, Next step, and at least five focused minutes', () => {
    expect(
      getManualSessionFormError({ completedDate: '', nextStepId: '', focusedMinutes: '' }, today)
    ).toBe('Choose the date you completed the session.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-02-30', nextStepId: 'step-1', focusedMinutes: '25' },
        today
      )
    ).toBe('Enter a valid completed date.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-07', nextStepId: 'step-1', focusedMinutes: '25' },
        today
      )
    ).toBe('The completed date cannot be in the future.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-06', nextStepId: '', focusedMinutes: '25' },
        today
      )
    ).toBe('Choose the Next step you worked on.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-06', nextStepId: 'step-1', focusedMinutes: '4' },
        today
      )
    ).toBe('Enter at least 5 focused minutes.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-06', nextStepId: 'step-1', focusedMinutes: '12.5' },
        today
      )
    ).toBeNull();
  });

  it('creates a completed, manually labeled session with the selected local date and exact minutes', () => {
    const session = createManualFocusSession({
      id: 'manual-session-1',
      journeyId: 'journey-1',
      nextStepId: 'step-1',
      completedDate: '2026-08-05',
      focusedMinutes: 37.5,
    });

    expect(session).toMatchObject({
      id: 'manual-session-1',
      journeyId: 'journey-1',
      nextStepId: 'step-1',
      plannedMinutes: 37.5,
      focusedMinutes: 37.5,
      status: 'completed',
      source: 'manual',
    });
    expect(new Date(session.endedAt ?? '').getFullYear()).toBe(2026);
    expect(new Date(session.endedAt ?? '').getMonth()).toBe(7);
    expect(new Date(session.endedAt ?? '').getDate()).toBe(5);
    expect(new Date(session.startedAt).getTime()).toBe(
      new Date(session.endedAt ?? '').getTime() - 37.5 * 60 * 1_000
    );
  });
});
