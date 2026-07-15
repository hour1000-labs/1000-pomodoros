import { describe, expect, it } from 'vitest';
import {
  cancelPausedFocusSession,
  canFinishPausedFocusSession,
  completePausedFocusSession,
  completeRunningFocusSession,
  getRemainingSeconds,
  pauseRunningFocusSession,
  resumePausedFocusSession,
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

  it('resumes from persisted remaining time without counting paused wall time', () => {
    const paused = pauseRunningFocusSession(session, activeTimer, '2026-07-15T18:06:15.000Z');
    const resumed = resumePausedFocusSession(
      paused.session,
      paused.activeTimer,
      '2026-07-15T20:00:00.000Z'
    );

    expect(resumed.session.status).toBe('running');
    expect(resumed.activeTimer).toEqual({
      ...paused.activeTimer,
      status: 'running',
      targetEndAt: '2026-07-15T20:18:45.000Z',
      pausedAt: null,
    });
  });

  it('finishes only eligible paused time and cancels without progress', () => {
    const paused = pauseRunningFocusSession(session, activeTimer, '2026-07-15T18:06:15.000Z');

    expect(canFinishPausedFocusSession(paused.activeTimer)).toBe(true);
    expect(
      completePausedFocusSession(paused.session, paused.activeTimer, '2026-07-15T18:07:00.000Z')
    ).toEqual({
      ...paused.session,
      focusedMinutes: 6.25,
      status: 'completed',
      endedAt: '2026-07-15T18:07:00.000Z',
    });
    expect(cancelPausedFocusSession(paused.session, '2026-07-15T18:07:00.000Z')).toEqual({
      ...paused.session,
      focusedMinutes: 0,
      status: 'cancelled',
      endedAt: '2026-07-15T18:07:00.000Z',
    });
  });

  it('does not make a paused session eligible before five focused minutes', () => {
    expect(
      canFinishPausedFocusSession({
        ...activeTimer,
        status: 'paused',
        accumulatedFocusedSeconds: 299,
        targetEndAt: null,
      })
    ).toBe(false);
  });
});
