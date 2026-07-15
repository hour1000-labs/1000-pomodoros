import { describe, expect, it } from 'vitest';
import {
  completeRunningFocusSession,
  getRemainingSeconds,
  pauseRunningFocusSession,
} from './focus-timer';
import type { ActiveTimer, FocusSession } from './models';

const session: FocusSession = {
  id: 'session-1',
  journeyId: 'journey-1',
  nextStepId: 'next-step-1',
  plannedMinutes: 25,
  focusedMinutes: 0,
  status: 'running',
  source: 'timer',
  startedAt: '2026-07-15T18:00:00.000Z',
  endedAt: null,
  reflection: '',
};

const activeTimer: ActiveTimer = {
  sessionId: session.id,
  status: 'running',
  remainingSeconds: 1_500,
  accumulatedFocusedSeconds: 0,
  targetEndAt: '2026-07-15T18:25:00.000Z',
  pausedAt: null,
};

describe('focus timer calculations', () => {
  it('derives remaining time from the target timestamp after delayed refreshes', () => {
    expect(getRemainingSeconds(activeTimer.targetEndAt, Date.parse(session.startedAt))).toBe(1_500);
    expect(getRemainingSeconds(activeTimer.targetEndAt, Date.parse('2026-07-15T18:06:15Z'))).toBe(
      1_125
    );
    expect(getRemainingSeconds(activeTimer.targetEndAt, Date.parse('2026-07-15T18:26:00Z'))).toBe(
      0
    );
  });

  it('persists exact remaining and accumulated time when paused', () => {
    const paused = pauseRunningFocusSession(session, activeTimer, '2026-07-15T18:06:15.000Z');

    expect(paused.session.status).toBe('paused');
    expect(paused.activeTimer).toEqual({
      ...activeTimer,
      status: 'paused',
      remainingSeconds: 1_125,
      accumulatedFocusedSeconds: 375,
      targetEndAt: null,
      pausedAt: '2026-07-15T18:06:15.000Z',
    });
  });

  it('credits only the planned focused duration at natural completion', () => {
    expect(completeRunningFocusSession(session, activeTimer, '2026-07-15T18:26:00.000Z')).toEqual({
      ...session,
      focusedMinutes: 25,
      status: 'completed',
      endedAt: activeTimer.targetEndAt,
    });
  });
});
