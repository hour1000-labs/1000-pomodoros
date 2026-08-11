import { describe, expect, it, vi } from 'vitest';

import type { FocusSession } from './models';
import { deriveStreakMonth, deriveStreakSessionImpact, deriveStreakSummary } from './streaks';

const PERSISTED_JOURNEY_IDS = ['journey-1', 'journey-2'] as const;

function localTimestamp(dateKey: string, hour = 12) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, hour).toISOString();
}

function createSession(dateKey: string, overrides: Partial<FocusSession> = {}): FocusSession {
  const id = overrides.id ?? `session-${dateKey}-${overrides.source ?? 'timer'}`;
  const endedAt = localTimestamp(dateKey);

  return {
    id,
    journeyId: 'journey-1',
    nextStepId: 'next-step-1',
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

function createSessions(dateKeys: readonly string[]) {
  return dateKeys.map((dateKey, index) =>
    createSession(dateKey, { id: `session-${index + 1}-${dateKey}` })
  );
}

function rangeDateKeys(startDay: number, endDay: number, month = '01', year = 2026) {
  return Array.from(
    { length: endDay - startDay + 1 },
    (_, index) => `${year}-${month}-${String(startDay + index).padStart(2, '0')}`
  );
}

describe('streak derivation', () => {
  it('counts an exact five-minute timer or manual completion and ignores ineligible records', () => {
    const sessions = [
      createSession('2026-01-01', { id: 'exact-five', focusedMinutes: 5 }),
      createSession('2026-01-02', {
        id: 'manual',
        journeyId: 'journey-2',
        source: 'manual',
        focusedMinutes: 10,
      }),
      createSession('2026-01-01', { id: 'short', focusedMinutes: 4.99 }),
      createSession('2026-01-01', { id: 'running', status: 'running' }),
      createSession('2026-01-01', { id: 'paused', status: 'paused' }),
      createSession('2026-01-01', { id: 'cancelled', status: 'cancelled' }),
      createSession('2026-01-01', { id: 'missing-end', endedAt: null }),
      createSession('2026-01-01', { id: 'invalid-end', endedAt: 'not-a-date' }),
      createSession('2026-01-01', { id: 'nan-minutes', focusedMinutes: Number.NaN }),
      createSession('2026-01-03', { id: 'future' }),
    ];

    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-02'))
    );

    expect(summary.totalPracticedDays).toBe(2);
    expect(summary.currentStreak).toBe(2);
    expect(summary.days.map(({ dateKey, state }) => [dateKey, state])).toEqual([
      ['2026-01-01', 'practiced'],
      ['2026-01-02', 'practiced'],
    ]);
  });

  it('uses a timer completion date even when the session started the previous day', () => {
    const session = createSession('2026-01-02', {
      id: 'cross-midnight',
      startedAt: localTimestamp('2026-01-01', 23),
      endedAt: new Date(2026, 0, 2, 0, 5).toISOString(),
      focusedMinutes: 10,
    });
    const summary = deriveStreakSummary([session], PERSISTED_JOURNEY_IDS, new Date(2026, 0, 2, 12));

    expect(summary.daysByDate['2026-01-01']).toBeUndefined();
    expect(summary.daysByDate['2026-01-02']?.state).toBe('practiced');
    expect(summary.currentStreak).toBe(1);
  });

  it('rejects a future same-day timer while allowing a manual current-date noon', () => {
    const now = new Date(2026, 0, 2, 9);
    const futureTimer = createSession('2026-01-02', {
      id: 'future-same-day-timer',
      startedAt: new Date(2026, 0, 2, 9, 35).toISOString(),
      endedAt: new Date(2026, 0, 2, 10).toISOString(),
      source: 'timer',
    });
    const manualCurrentDate = createSession('2026-01-02', {
      id: 'manual-current-date',
      endedAt: new Date(2026, 0, 2, 12).toISOString(),
      source: 'manual',
    });
    const summary = deriveStreakSummary(
      [futureTimer, manualCurrentDate],
      PERSISTED_JOURNEY_IDS,
      now
    );

    expect(summary.currentStreak).toBe(1);
    expect(summary.daysByDate['2026-01-02']).toMatchObject({
      focusedMinutes: manualCurrentDate.focusedMinutes,
      qualifyingSessionCount: 1,
    });
  });

  it('rejects orphan Journeys, invalid sources, blank IDs, and non-canonical timestamps', () => {
    const sessions = [
      createSession('2026-01-01', { id: 'orphan', journeyId: 'journey-deleted' }),
      createSession('2026-01-01', {
        id: 'invalid-source',
        source: 'imported' as FocusSession['source'],
      }),
      createSession('2026-01-01', { id: '   ' }),
      createSession('2026-01-01', {
        id: 'non-iso',
        endedAt: '2026-01-01',
      }),
      createSession('2026-01-01', {
        id: 'impossible-date',
        endedAt: '2026-02-30T12:00:00.000Z',
      }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-03-01'))
    );

    expect(summary.totalPracticedDays).toBe(0);
    expect(summary.currentStreak).toBe(0);
  });

  it('rejects malformed and chronologically impossible start timestamps', () => {
    const sessions = [
      createSession('2026-01-01', { id: 'non-canonical-start', startedAt: '2026-01-01' }),
      createSession('2026-01-01', {
        id: 'impossible-start',
        startedAt: '2026-02-30T11:35:00.000Z',
      }),
      createSession('2026-01-01', {
        id: 'start-after-end',
        startedAt: localTimestamp('2026-01-01', 13),
      }),
      createSession('2026-01-01', { id: 'valid' }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-01', 23))
    );

    expect(summary.totalPracticedDays).toBe(1);
    expect(summary.daysByDate['2026-01-01']).toMatchObject({
      focusedMinutes: 25,
      qualifyingSessionCount: 1,
    });
  });

  it('rejects every record sharing a duplicated session ID, even across dates', () => {
    const sessions = [
      createSession('2026-01-01', { id: 'duplicated' }),
      createSession('2026-01-02', { id: 'duplicated', source: 'manual' }),
      createSession('2026-01-02', { id: 'unique' }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-02'))
    );

    expect(summary.totalPracticedDays).toBe(1);
    expect(summary.daysByDate['2026-01-01']).toBeUndefined();
    expect(summary.daysByDate['2026-01-02']).toMatchObject({
      focusedMinutes: 25,
      qualifyingSessionCount: 1,
    });
  });

  it('deduplicates same-day sessions while retaining focused-time detail', () => {
    const summary = deriveStreakSummary(
      [
        createSession('2026-01-01', { id: 'morning', focusedMinutes: 5 }),
        createSession('2026-01-01', {
          id: 'evening',
          source: 'manual',
          focusedMinutes: 45,
        }),
      ],
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-01', 23))
    );

    expect(summary.currentStreak).toBe(1);
    expect(summary.totalPracticedDays).toBe(1);
    expect(summary.daysByDate['2026-01-01']).toMatchObject({
      state: 'practiced',
      focusedMinutes: 50,
      qualifyingSessionCount: 2,
    });
  });

  it('leaves an unfinished current day open without spending an available freeze', () => {
    const summary = deriveStreakSummary(
      createSessions(rangeDateKeys(1, 7)),
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-08', 23))
    );

    expect(summary.currentStreak).toBe(7);
    expect(summary.longestStreak).toBe(7);
    expect(summary.freezesAvailable).toBe(1);
    expect(summary.totalFreezesUsed).toBe(0);
    expect(summary.todayState).toBe('open');
    expect(summary.daysByDate['2026-01-08']).toBeUndefined();
  });

  it('closes a missed date only after local midnight', () => {
    const sessions = createSessions(rangeDateKeys(1, 7));
    const beforeMidnight = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(2026, 0, 8, 23, 59)
    );
    const afterMidnight = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(2026, 0, 9, 0, 1)
    );

    expect(beforeMidnight.daysByDate['2026-01-08']).toBeUndefined();
    expect(beforeMidnight.freezesAvailable).toBe(1);
    expect(afterMidnight.daysByDate['2026-01-08']?.state).toBe('freeze-used');
    expect(afterMidnight.freezesAvailable).toBe(0);
    expect(afterMidnight.currentStreak).toBe(7);
    expect(afterMidnight.todayState).toBe('open');
  });

  it('awards one freeze on each seventh practiced day, including day 21', () => {
    const summary = deriveStreakSummary(
      createSessions(rangeDateKeys(1, 21)),
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-21'))
    );

    expect(summary.currentStreak).toBe(21);
    expect(summary.longestStreak).toBe(21);
    expect(summary.totalFreezesEarned).toBe(3);
    expect(summary.freezesAvailable).toBe(3);
    expect(summary.qualifyingDaysTowardNextFreeze).toBe(0);
    expect(summary.qualifyingDaysUntilNextFreeze).toBe(7);
    expect(summary.daysByDate['2026-01-07']?.freezeAwarded).toBe(true);
    expect(summary.daysByDate['2026-01-14']?.freezeAwarded).toBe(true);
    expect(summary.daysByDate['2026-01-21']?.freezeAwarded).toBe(true);
  });

  it('uses freezes oldest-first, then resets on the first unprotected closed day', () => {
    const sessions = [
      ...createSessions(rangeDateKeys(1, 7)),
      createSession('2026-01-10', { id: 'restart' }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-10'))
    );

    expect(summary.daysByDate['2026-01-08']?.state).toBe('freeze-used');
    expect(summary.daysByDate['2026-01-09']?.state).toBe('missed');
    expect(summary.currentStreak).toBe(1);
    expect(summary.longestStreak).toBe(7);
    expect(summary.freezesAvailable).toBe(0);
  });

  it('spends one freeze per consecutive closed miss until inventory is exhausted', () => {
    const summary = deriveStreakSummary(
      createSessions(rangeDateKeys(1, 14)),
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-18'))
    );

    expect(summary.daysByDate['2026-01-15']?.state).toBe('freeze-used');
    expect(summary.daysByDate['2026-01-16']?.state).toBe('freeze-used');
    expect(summary.daysByDate['2026-01-17']?.state).toBe('missed');
    expect(summary.totalFreezesUsed).toBe(2);
    expect(summary.freezesAvailable).toBe(0);
    expect(summary.currentStreak).toBe(0);
  });

  it('counts practiced dates, not protected dates, in current and longest streaks', () => {
    const sessions = [
      ...createSessions(rangeDateKeys(1, 7)),
      createSession('2026-01-09', { id: 'after-freeze-1' }),
      createSession('2026-01-10', { id: 'after-freeze-2' }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-10'))
    );

    expect(summary.daysByDate['2026-01-08']?.state).toBe('freeze-used');
    expect(summary.currentStreak).toBe(9);
    expect(summary.longestStreak).toBe(9);
    expect(summary.totalPracticedDays).toBe(9);
    expect(summary.qualifyingDaysTowardNextFreeze).toBe(2);
    expect(summary.daysByDate['2026-01-08']).toMatchObject({
      freezeAwarded: false,
      qualifyingDaysTowardNextFreezeAfterDay: 0,
    });
  });

  it('preserves nonzero reward progress across a protected date', () => {
    const summary = deriveStreakSummary(
      [...createSessions(rangeDateKeys(1, 10)), createSession('2026-01-12', { id: 'day-twelve' })],
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-12'))
    );

    expect(summary.daysByDate['2026-01-10']).toMatchObject({
      state: 'practiced',
      qualifyingDaysTowardNextFreezeAfterDay: 3,
    });
    expect(summary.daysByDate['2026-01-11']).toMatchObject({
      state: 'freeze-used',
      qualifyingDaysTowardNextFreezeAfterDay: 3,
    });
    expect(summary.daysByDate['2026-01-12']).toMatchObject({
      state: 'practiced',
      qualifyingDaysTowardNextFreezeAfterDay: 4,
    });
    expect(summary.qualifyingDaysTowardNextFreeze).toBe(4);
  });

  it('records one unprotected miss per active sequence and ignores later blank days', () => {
    const sessions = [
      ...createSessions(rangeDateKeys(1, 7)),
      createSession('2026-01-12', { id: 'restart' }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-16'))
    );

    expect(summary.daysByDate['2026-01-08']?.state).toBe('freeze-used');
    expect(summary.daysByDate['2026-01-09']?.state).toBe('missed');
    expect(summary.daysByDate['2026-01-10']).toBeUndefined();
    expect(summary.daysByDate['2026-01-11']).toBeUndefined();
    expect(summary.daysByDate['2026-01-13']?.state).toBe('missed');
    expect(summary.daysByDate['2026-01-14']).toBeUndefined();
    expect(summary.daysByDate['2026-01-15']).toBeUndefined();
    expect(summary.currentStreak).toBe(0);
  });

  it('moves a used freeze after a historical backfill even when the current streak stays zero', () => {
    const originalSessions = createSessions(rangeDateKeys(1, 7));
    const before = deriveStreakSummary(
      originalSessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-12'))
    );
    const after = deriveStreakSummary(
      [
        ...originalSessions,
        createSession('2026-01-08', { id: 'historical-manual', source: 'manual' }),
      ],
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-12'))
    );

    expect(before.currentStreak).toBe(0);
    expect(before.daysByDate['2026-01-08']?.state).toBe('freeze-used');
    expect(before.daysByDate['2026-01-09']?.state).toBe('missed');
    expect(after.currentStreak).toBe(0);
    expect(after.daysByDate['2026-01-08']?.state).toBe('practiced');
    expect(after.daysByDate['2026-01-09']?.state).toBe('freeze-used');
    expect(after.daysByDate['2026-01-10']?.state).toBe('missed');
  });

  it('recomputes the same history deterministically after backfill and deletion', () => {
    const originalSessions = [
      ...createSessions(rangeDateKeys(1, 7)),
      createSession('2026-01-09', { id: 'day-nine' }),
      createSession('2026-01-11', { id: 'today' }),
    ];
    const now = new Date(localTimestamp('2026-01-11'));
    const before = deriveStreakSummary(originalSessions, PERSISTED_JOURNEY_IDS, now);
    const backfill = createSession('2026-01-08', {
      id: 'day-eight-backfill',
      source: 'manual',
    });
    const afterBackfill = deriveStreakSummary(
      [...originalSessions, backfill],
      PERSISTED_JOURNEY_IDS,
      now
    );
    const afterDeletion = deriveStreakSummary(originalSessions, PERSISTED_JOURNEY_IDS, now);

    expect(before.currentStreak).toBe(1);
    expect(afterBackfill.currentStreak).toBe(10);
    expect(afterBackfill.daysByDate['2026-01-10']?.state).toBe('freeze-used');
    expect(afterDeletion).toEqual(before);
  });

  it('derives month totals from unique practiced and protected dates', () => {
    const sessions = [
      ...createSessions(rangeDateKeys(1, 7)),
      createSession('2026-01-09', { id: 'jan-nine' }),
      createSession('2026-02-01', { id: 'feb-one' }),
    ];
    const summary = deriveStreakSummary(
      sessions,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-02-01'))
    );
    const january = deriveStreakMonth(summary, 2026, 0);
    const february = deriveStreakMonth(summary, 2026, 1);

    expect(january).toMatchObject({ practicedDays: 8, freezesUsed: 1, focusedMinutes: 200 });
    expect(february).toMatchObject({ practicedDays: 1, freezesUsed: 0, focusedMinutes: 25 });
    expect(january?.dateKeys).toHaveLength(31);
  });

  it('handles empty, invalid-now, and multi-year histories', () => {
    expect(
      deriveStreakSummary([], PERSISTED_JOURNEY_IDS, new Date(localTimestamp('2026-01-01')))
    ).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      freezesAvailable: 0,
      todayState: 'not-started',
    });
    expect(
      deriveStreakSummary([], PERSISTED_JOURNEY_IDS, new Date('invalid')).asOfDateKey
    ).toBeNull();

    const sessions: FocusSession[] = [];
    const cursor = new Date(2024, 0, 1, 12);
    const end = new Date(2026, 11, 31, 12);
    let index = 0;
    while (cursor <= end) {
      const dateKey = [cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()]
        .map((value, partIndex) =>
          partIndex === 0 ? String(value) : String(value).padStart(2, '0')
        )
        .join('-');
      sessions.push(createSession(dateKey, { id: `long-${index}` }));
      cursor.setDate(cursor.getDate() + 1);
      index += 1;
    }

    const summary = deriveStreakSummary(sessions, PERSISTED_JOURNEY_IDS, end);
    expect(summary.currentStreak).toBe(sessions.length);
    expect(summary.longestStreak).toBe(sessions.length);
    expect(summary.totalFreezesEarned).toBe(Math.floor(sessions.length / 7));
    expect(summary.freezesAvailable).toBe(summary.totalFreezesEarned);
  });

  it('jumps over a centuries-long inactive gap after recording its first missed date', () => {
    const ancientSession = createSession('2026-01-01', {
      id: 'ancient',
      startedAt: '0000-01-01T11:35:00.000Z',
      endedAt: '0000-01-01T12:00:00.000Z',
    });
    const setDate = vi.spyOn(Date.prototype, 'setDate');

    try {
      const summary = deriveStreakSummary(
        [ancientSession],
        PERSISTED_JOURNEY_IDS,
        new Date(localTimestamp('2026-01-01'))
      );

      expect(summary.days.map(({ dateKey, state }) => [dateKey, state])).toEqual([
        ['0000-01-01', 'practiced'],
        ['0000-01-02', 'missed'],
      ]);
      expect(setDate).toHaveBeenCalledTimes(1);
    } finally {
      setDate.mockRestore();
    }
  });
});

describe('streak session impact', () => {
  it('reports first-day progress, a seventh-day freeze, and a personal best', () => {
    const first = createSession('2026-01-01', { id: 'first' });
    const firstImpact = deriveStreakSessionImpact(
      [],
      first,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-01'))
    );
    const firstSix = createSessions(rangeDateKeys(1, 6));
    const seventh = createSession('2026-01-07', { id: 'seventh' });
    const seventhImpact = deriveStreakSessionImpact(
      firstSix,
      seventh,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-07'))
    );

    expect(firstImpact).toMatchObject({
      state: 'counted',
      counted: true,
      currentStreakAfter: 1,
      newPersonalBest: true,
    });
    expect(seventhImpact).toMatchObject({
      state: 'counted',
      currentStreakAfter: 7,
      freezesEarnedDelta: 1,
      freezesAvailableDelta: 1,
      newPersonalBest: true,
    });
  });

  it('reports an eligible session on an already-practiced date without incrementing', () => {
    const existing = createSession('2026-01-01', { id: 'existing' });
    const additional = createSession('2026-01-01', { id: 'additional', source: 'manual' });
    const impact = deriveStreakSessionImpact(
      [existing],
      additional,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-01'))
    );

    expect(impact).toMatchObject({
      state: 'already-counted',
      counted: false,
      alreadyCounted: true,
      currentStreakBefore: 1,
      currentStreakAfter: 1,
      freezesAvailableDelta: 0,
    });
  });

  it('reports a historical manual session that restores the current sequence', () => {
    const sessions = [
      ...createSessions(rangeDateKeys(1, 7)),
      createSession('2026-01-09', { id: 'day-nine' }),
      createSession('2026-01-11', { id: 'today' }),
    ];
    const backfill = createSession('2026-01-08', {
      id: 'backfill',
      source: 'manual',
    });
    const impact = deriveStreakSessionImpact(
      sessions,
      backfill,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-11'))
    );

    expect(impact).toMatchObject({
      state: 'restored',
      counted: true,
      restored: true,
      currentStreakBefore: 1,
      currentStreakAfter: 10,
      freezesAvailableBefore: 0,
      freezesAvailableAfter: 0,
    });
  });

  it('reports inventory refunded by a historical manual backfill', () => {
    const firstWeek = createSessions(rangeDateKeys(1, 7));
    const backfill = createSession('2026-01-08', {
      id: 'protected-date-backfill',
      source: 'manual',
    });
    const impact = deriveStreakSessionImpact(
      firstWeek,
      backfill,
      PERSISTED_JOURNEY_IDS,
      new Date(localTimestamp('2026-01-09'))
    );

    expect(impact).toMatchObject({
      state: 'restored',
      freezesAvailableBefore: 0,
      freezesAvailableAfter: 1,
      freezesAvailableDelta: 1,
      freezesUsedDelta: -1,
      currentStreakBefore: 7,
      currentStreakAfter: 8,
    });
  });

  it('rejects short, incomplete, invalid, and future-date impacts', () => {
    const now = new Date(localTimestamp('2026-01-02'));

    for (const session of [
      createSession('2026-01-01', { id: 'short', focusedMinutes: 4 }),
      createSession('2026-01-01', { id: 'running', status: 'running' }),
      createSession('2026-01-01', { id: 'invalid', endedAt: 'invalid' }),
      createSession('2026-01-03', { id: 'future' }),
    ]) {
      expect(deriveStreakSessionImpact([], session, PERSISTED_JOURNEY_IDS, now).state).toBe(
        'not-eligible'
      );
    }
  });
});
