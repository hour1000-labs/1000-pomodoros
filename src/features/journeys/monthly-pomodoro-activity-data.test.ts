import { describe, expect, it } from 'vitest';

import { createEmptyAppState } from '@/lib/mock-data';
import type { AppState, FocusSession, Journey } from '@/lib/models';

import { deriveMonthlyPomodoroActivity } from './monthly-pomodoro-activity-data';

function createJourney(id: string, status: Journey['status'] = 'active'): Journey {
  return {
    id,
    name: id,
    reason: '',
    targetMinutes: 1_000,
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: '2026-01-01T00:00:00.000Z',
  };
}

function localTimestamp(dateKey: string, hour = 12) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, hour).toISOString();
}

function createSession(
  id: string,
  dateKey: string,
  overrides: Partial<FocusSession> = {}
): FocusSession {
  const endedAt = localTimestamp(dateKey);

  return {
    id,
    journeyId: 'journey-active',
    nextStepId: null,
    plannedMinutes: 25,
    focusedMinutes: 25,
    status: 'completed',
    source: 'timer',
    startedAt: new Date(new Date(endedAt).getTime() - 25 * 60 * 1_000).toISOString(),
    endedAt,
    reflection: '',
    ...overrides,
  };
}

function createState(journeys: Journey[], focusSessions: FocusSession[]): AppState {
  return {
    ...createEmptyAppState(),
    journeys,
    focusSessions,
  };
}

describe('deriveMonthlyPomodoroActivity', () => {
  it('preserves exact partial progress at the zero-, four-, five-, 24-, 25-, 37.5-, and 50-minute boundaries', () => {
    const journey = createJourney('journey-active');
    const state = createState(
      [journey],
      [
        createSession('zero', '2026-08-01', { focusedMinutes: 0 }),
        createSession('four', '2026-08-02', { focusedMinutes: 4 }),
        createSession('five', '2026-08-03', { focusedMinutes: 5 }),
        createSession('twenty-four', '2026-08-04', { focusedMinutes: 24 }),
        createSession('twenty-five', '2026-08-05', { focusedMinutes: 25 }),
        createSession('thirty-seven-and-a-half', '2026-08-06', {
          focusedMinutes: 37.5,
        }),
        createSession('fifty', '2026-08-07', { focusedMinutes: 50 }),
      ]
    );

    const data = deriveMonthlyPomodoroActivity(state, {
      year: 2026,
      monthIndex: 7,
      now: new Date(2026, 7, 31, 12),
    });

    expect(data).toEqual({
      year: 2026,
      monthIndex: 7,
      focusedMinutes: 141.5,
      totalPomodoros: 141.5 / 25,
      days: [
        {
          dateKey: '2026-08-03',
          focusedMinutes: 5,
          totalPomodoros: 0.2,
          fullPomodoros: 0,
          partialPomodoro: 0.2,
        },
        {
          dateKey: '2026-08-04',
          focusedMinutes: 24,
          totalPomodoros: 0.96,
          fullPomodoros: 0,
          partialPomodoro: 0.96,
        },
        {
          dateKey: '2026-08-05',
          focusedMinutes: 25,
          totalPomodoros: 1,
          fullPomodoros: 1,
          partialPomodoro: 0,
        },
        {
          dateKey: '2026-08-06',
          focusedMinutes: 37.5,
          totalPomodoros: 1.5,
          fullPomodoros: 1,
          partialPomodoro: 0.5,
        },
        {
          dateKey: '2026-08-07',
          focusedMinutes: 50,
          totalPomodoros: 2,
          fullPomodoros: 2,
          partialPomodoro: 0,
        },
      ],
    });

    expect(
      deriveMonthlyPomodoroActivity(state, {
        year: 2026,
        monthIndex: 8,
        now: new Date(2026, 8, 30, 12),
      })
    ).toEqual({
      year: 2026,
      monthIndex: 8,
      focusedMinutes: 0,
      totalPomodoros: 0,
      days: [],
    });
  });

  it('combines qualifying same-day sessions before allocation while keeping cross-day partials separate', () => {
    const state = createState(
      [createJourney('journey-active')],
      [
        createSession('same-day-timer', '2026-08-10', { focusedMinutes: 12 }),
        createSession('same-day-manual', '2026-08-10', {
          focusedMinutes: 13,
          source: 'manual',
        }),
        createSession('cross-day-first', '2026-08-20', { focusedMinutes: 10 }),
        createSession('cross-day-second', '2026-08-21', {
          focusedMinutes: 15,
          source: 'manual',
        }),
      ]
    );

    const data = deriveMonthlyPomodoroActivity(state, {
      year: 2026,
      monthIndex: 7,
      now: new Date(2026, 7, 31, 12),
    });

    expect(data.focusedMinutes).toBe(50);
    expect(data.totalPomodoros).toBe(2);
    expect(data.days).toEqual([
      {
        dateKey: '2026-08-10',
        focusedMinutes: 25,
        totalPomodoros: 1,
        fullPomodoros: 1,
        partialPomodoro: 0,
      },
      {
        dateKey: '2026-08-20',
        focusedMinutes: 10,
        totalPomodoros: 0.4,
        fullPomodoros: 0,
        partialPomodoro: 0.4,
      },
      {
        dateKey: '2026-08-21',
        focusedMinutes: 15,
        totalPomodoros: 0.6,
        fullPomodoros: 0,
        partialPomodoro: 0.6,
      },
    ]);
  });

  it('includes every existing Journey status globally and applies an exact optional Journey scope', () => {
    const journeys = [
      createJourney('journey-active', 'active'),
      createJourney('journey-paused', 'paused'),
      createJourney('journey-completed', 'completed'),
      createJourney('journey-archived', 'archived'),
    ];
    const state = createState(journeys, [
      createSession('active', '2026-08-01', {
        journeyId: 'journey-active',
        focusedMinutes: 5,
      }),
      createSession('paused', '2026-08-02', {
        journeyId: 'journey-paused',
        focusedMinutes: 10,
      }),
      createSession('completed', '2026-08-03', {
        journeyId: 'journey-completed',
        focusedMinutes: 15,
      }),
      createSession('archived', '2026-08-04', {
        journeyId: 'journey-archived',
        focusedMinutes: 20,
      }),
    ]);
    const options = {
      year: 2026,
      monthIndex: 7,
      now: new Date(2026, 7, 31, 12),
    };

    expect(deriveMonthlyPomodoroActivity(state, options)).toMatchObject({
      focusedMinutes: 50,
      totalPomodoros: 2,
    });
    expect(
      deriveMonthlyPomodoroActivity(state, {
        ...options,
        journeyId: 'journey-completed',
      })
    ).toMatchObject({
      focusedMinutes: 15,
      totalPomodoros: 0.6,
      days: [{ dateKey: '2026-08-03' }],
    });
    expect(
      deriveMonthlyPomodoroActivity(state, { ...options, journeyId: 'journey-missing' })
    ).toMatchObject({ focusedMinutes: 0, totalPomodoros: 0, days: [] });
  });

  it('rejects malformed, future-local-date, orphan, duplicate, incomplete, and non-finite records', () => {
    const state = createState(
      [createJourney('journey-active')],
      [
        createSession('valid', '2026-08-01'),
        createSession('same-day-later-time', '2026-08-15', {
          endedAt: localTimestamp('2026-08-15', 23),
        }),
        createSession('null-ended-at', '2026-08-02', { endedAt: null }),
        createSession('non-canonical-ended-at', '2026-08-03', {
          endedAt: '2026-08-03',
        }),
        createSession('impossible-ended-at', '2026-08-04', {
          endedAt: '2026-08-32T12:00:00.000Z',
        }),
        createSession('future-local-date', '2026-08-16'),
        createSession('orphan', '2026-08-05', { journeyId: 'journey-deleted' }),
        createSession('duplicated', '2026-08-06'),
        createSession('duplicated', '2026-08-07', { source: 'manual' }),
        createSession('running', '2026-08-08', { status: 'running' }),
        createSession('paused', '2026-08-09', { status: 'paused' }),
        createSession('cancelled', '2026-08-10', { status: 'cancelled' }),
        createSession('sub-five', '2026-08-11', { focusedMinutes: 4.99 }),
        createSession('not-a-number', '2026-08-12', { focusedMinutes: Number.NaN }),
        createSession('infinite', '2026-08-13', {
          focusedMinutes: Number.POSITIVE_INFINITY,
        }),
        createSession('   ', '2026-08-14'),
        createSession('invalid-source', '2026-08-14', {
          source: 'imported' as FocusSession['source'],
        }),
      ]
    );

    const data = deriveMonthlyPomodoroActivity(state, {
      year: 2026,
      monthIndex: 7,
      now: new Date(2026, 7, 15, 9),
    });

    expect(data).toMatchObject({
      focusedMinutes: 50,
      totalPomodoros: 2,
    });
    expect(data.days.map((day) => day.dateKey)).toEqual(['2026-08-01', '2026-08-15']);
  });

  it('normalizes month overflow across years and keeps only the selected local month', () => {
    const state = createState(
      [createJourney('journey-active')],
      [
        createSession('december', '2023-12-31'),
        createSession('january-first', '2024-01-01'),
        createSession('january-last', '2024-01-31'),
        createSession('february', '2024-02-01'),
      ]
    );

    const january = deriveMonthlyPomodoroActivity(state, {
      year: 2023,
      monthIndex: 12,
      now: new Date(2024, 2, 1, 12),
    });
    const december = deriveMonthlyPomodoroActivity(state, {
      year: 2024,
      monthIndex: -1,
      now: new Date(2024, 2, 1, 12),
    });

    expect(january).toMatchObject({
      year: 2024,
      monthIndex: 0,
      focusedMinutes: 50,
      days: [{ dateKey: '2024-01-01' }, { dateKey: '2024-01-31' }],
    });
    expect(december).toMatchObject({
      year: 2023,
      monthIndex: 11,
      focusedMinutes: 25,
      days: [{ dateKey: '2023-12-31' }],
    });
  });

  it('includes leap day while excluding adjacent-month activity', () => {
    const state = createState(
      [createJourney('journey-active')],
      [
        createSession('january-last', '2024-01-31'),
        createSession('february-twenty-eight', '2024-02-28'),
        createSession('leap-day', '2024-02-29'),
        createSession('march-first', '2024-03-01'),
      ]
    );

    const data = deriveMonthlyPomodoroActivity(state, {
      year: 2023,
      monthIndex: 13,
      now: new Date(2024, 2, 2, 12),
    });

    expect(data).toMatchObject({
      year: 2024,
      monthIndex: 1,
      focusedMinutes: 50,
      totalPomodoros: 2,
      days: [{ dateKey: '2024-02-28' }, { dateKey: '2024-02-29' }],
    });
  });
});
