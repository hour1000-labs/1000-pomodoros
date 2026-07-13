import { describe, expect, it } from 'vitest'

import type { FocusSession, Journey } from './models'
import {
  deriveJourneyProgress,
  derivePomodoroProgress,
  deriveProgressFromSessions,
  deriveTargetProgress,
  getFocusedMinutes,
  getSessionsForLocalDate,
  isCountableFocusSession,
} from './progress'

function createSession(
  focusedMinutes: number,
  overrides: Partial<FocusSession> = {},
): FocusSession {
  return {
    id: `session-${focusedMinutes}`,
    journeyId: 'journey-1',
    nextStepId: null,
    plannedMinutes: 25,
    focusedMinutes,
    status: 'completed',
    source: 'timer',
    startedAt: '2026-07-12T18:00:00.000Z',
    endedAt: '2026-07-12T18:25:00.000Z',
    reflection: '',
    ...overrides,
  }
}

describe('focus progress', () => {
  it('excludes sessions under five focused minutes', () => {
    const sessions = [createSession(4), createSession(4.99), createSession(5)]

    expect(sessions.map(isCountableFocusSession)).toEqual([
      false,
      false,
      true,
    ])
    expect(getFocusedMinutes(sessions)).toBe(5)
  })

  it('preserves partial progress as actual minutes', () => {
    expect(derivePomodoroProgress(5)).toEqual({
      focusedMinutes: 5,
      totalPomodoros: 0.2,
      fullPomodoros: 0,
      partialMinutes: 5,
      partialPomodoro: 0.2,
    })
  })

  it('derives full and multi-pomodoro progress from completed sessions', () => {
    const progress = deriveProgressFromSessions([
      createSession(25),
      createSession(50, { id: 'session-50' }),
    ])

    expect(progress).toMatchObject({
      focusedMinutes: 75,
      totalPomodoros: 3,
      fullPomodoros: 3,
      partialMinutes: 0,
    })
  })

  it('ignores incomplete sessions and sessions for other journeys', () => {
    const sessions = [
      createSession(25),
      createSession(25, { id: 'running', status: 'running' }),
      createSession(25, { id: 'other', journeyId: 'journey-2' }),
    ]

    expect(getFocusedMinutes(sessions, 'journey-1')).toBe(25)
  })

  it('selects sessions using the requested local calendar date', () => {
    const requestedDate = new Date(2026, 6, 13, 12)
    const sameDay = new Date(2026, 6, 13, 8).toISOString()
    const previousDay = new Date(2026, 6, 12, 23, 59).toISOString()
    const sessions = [
      createSession(25, { id: 'same-day', endedAt: sameDay }),
      createSession(25, { id: 'previous-day', endedAt: previousDay }),
      createSession(25, { id: 'unfinished', endedAt: null }),
    ]

    expect(getSessionsForLocalDate(sessions, requestedDate)).toEqual([
      sessions[0],
    ])
  })

  it('derives target progress without maintaining a separate total', () => {
    const journey: Journey = {
      id: 'journey-1',
      name: 'Learn guitar',
      reason: '',
      targetMinutes: 100,
      status: 'active',
      createdAt: '2026-07-12T18:00:00.000Z',
      updatedAt: '2026-07-12T18:00:00.000Z',
      lastActiveAt: '2026-07-12T18:00:00.000Z',
    }

    expect(
      deriveJourneyProgress(journey, [createSession(25), createSession(50)]),
    ).toMatchObject({
      focusedMinutes: 75,
      targetMinutes: 100,
      targetPomodoros: 4,
      targetProgress: 0.75,
      targetPercentage: 75,
    })
  })

  it('derives the seeded 72% progress toward the 25-hour milestone', () => {
    expect(deriveTargetProgress(1_075, 25 * 60).targetPercentage).toBeCloseTo(
      71.67,
      2,
    )
  })
})
