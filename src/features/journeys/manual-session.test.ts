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

  it('requires a valid date, activity, and at least five focused minutes', () => {
    expect(
      getManualSessionFormError({ completedDate: '', activity: '', focusedMinutes: '' }, today)
    ).toBe('Choose the date you completed the session.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-02-30', activity: 'Practice scales', focusedMinutes: '25' },
        today
      )
    ).toBe('Enter a valid completed date.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-07', activity: 'Practice scales', focusedMinutes: '25' },
        today
      )
    ).toBe('The completed date cannot be in the future.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-06', activity: '   ', focusedMinutes: '25' },
        today
      )
    ).toBe('Describe what you worked on.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-06', activity: 'Practice scales', focusedMinutes: '4' },
        today
      )
    ).toBe('Enter at least 5 focused minutes.');
    expect(
      getManualSessionFormError(
        { completedDate: '2026-08-06', activity: 'Practice scales', focusedMinutes: '12.5' },
        today
      )
    ).toBeNull();
    expect(
      getManualSessionFormError(
        {
          completedDate: '2026-08-06',
          activity: 'a'.repeat(121),
          focusedMinutes: '25',
        },
        today
      )
    ).toBe('Keep the activity to 120 characters or fewer.');
  });

  it('creates a completed, manually labeled session with a trimmed activity and exact minutes', () => {
    const session = createManualFocusSession({
      id: 'manual-session-1',
      journeyId: 'journey-1',
      activity: '  Practice scales  ',
      completedDate: '2026-08-05',
      focusedMinutes: 37.5,
    });

    expect(session).toMatchObject({
      id: 'manual-session-1',
      journeyId: 'journey-1',
      nextStepId: null,
      activity: 'Practice scales',
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
