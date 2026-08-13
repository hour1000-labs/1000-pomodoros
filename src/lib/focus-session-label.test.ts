import { describe, expect, it } from 'vitest';
import { getFocusSessionLabel } from './focus-session-label';
import type { FocusSession } from './models';

const session: FocusSession = {
  id: 'session-1',
  journeyId: 'journey-1',
  nextStepId: 'step-1',
  plannedMinutes: 25,
  focusedMinutes: 25,
  status: 'completed',
  source: 'manual',
  startedAt: '2026-08-13T10:00:00.000Z',
  endedAt: '2026-08-13T10:25:00.000Z',
  reflection: '',
};

describe('getFocusSessionLabel', () => {
  it('prefers a manually entered activity over a linked Next step', () => {
    expect(
      getFocusSessionLabel({ ...session, activity: 'Replayed the bridge' }, 'Bridge practice')
    ).toBe('Replayed the bridge');
  });

  it('falls back to the linked Next step for older sessions without activity', () => {
    expect(getFocusSessionLabel(session, 'Bridge practice')).toBe('Bridge practice');
  });

  it('ignores blank activity and returns null when no label exists', () => {
    expect(getFocusSessionLabel({ ...session, activity: '  ' })).toBeNull();
  });
});
