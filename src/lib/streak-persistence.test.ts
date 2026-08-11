import { describe, expect, it } from 'vitest';

import { createEmptyAppState } from './mock-data';
import type {
  ActiveTimer,
  AppState,
  FocusSession,
  Journey,
  Milestone,
  OnboardingDraft,
  WeeklyGoal,
} from './models';
import {
  createAppExport,
  createLocalStorageRepository,
  type RepositoryLoadResult,
  type RepositorySaveResult,
  type StorageLike,
} from './repository';
import { deriveStreakSummary } from './streaks';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const primaryJourney: Journey = {
  id: 'journey-primary',
  name: 'Build the product',
  reason: 'Make something useful.',
  targetMinutes: 1_000,
  status: 'active',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-14T12:25:00.000Z',
  lastActiveAt: '2026-08-14T12:25:00.000Z',
};

const otherJourney: Journey = {
  id: 'journey-other',
  name: 'Learn piano',
  reason: 'Play a favorite song.',
  targetMinutes: 600,
  status: 'active',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-14T12:25:00.000Z',
  lastActiveAt: '2026-08-14T12:25:00.000Z',
};

const otherMilestone: Milestone = {
  id: 'milestone-other',
  journeyId: otherJourney.id,
  name: 'First hour',
  targetFocusedMinutes: 60,
  earnedAt: localTimestamp('2026-08-11'),
};

const globalWeeklyGoal: WeeklyGoal = {
  id: 'weekly-goal-global',
  journeyId: null,
  targetPomodoros: 8,
  weekStartsOn: 1,
  createdAt: localTimestamp('2026-08-01'),
};

const onboardingDraft: OnboardingDraft = {
  journeyName: 'Write a short story',
  reason: 'Practice finishing.',
  targetMinutes: 500,
  nextStepTitle: 'Outline the opening scene',
  startedAt: localTimestamp('2026-08-15', 9),
  updatedAt: localTimestamp('2026-08-15', 10),
};

function localTimestamp(dateKey: string, hour = 12) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, hour).toISOString();
}

function createCompletedSession(
  dateKey: string,
  journeyId = primaryJourney.id,
  id = `session-${journeyId}-${dateKey}`,
  source: FocusSession['source'] = 'timer'
): FocusSession {
  const endedAt = localTimestamp(dateKey);

  return {
    id,
    journeyId,
    nextStepId: null,
    plannedMinutes: 25,
    focusedMinutes: 25,
    status: 'completed',
    source,
    startedAt: new Date(new Date(endedAt).getTime() - 25 * 60 * 1_000).toISOString(),
    endedAt,
    reflection: '',
  };
}

function createSessionRange(
  startDay: number,
  endDay: number,
  journeyId = primaryJourney.id,
  source: FocusSession['source'] = 'timer'
) {
  return Array.from({ length: endDay - startDay + 1 }, (_, index) => {
    const day = String(startDay + index).padStart(2, '0');
    const dateKey = `2026-08-${day}`;
    return createCompletedSession(dateKey, journeyId, undefined, source);
  });
}

function expectReady(result: RepositoryLoadResult) {
  if (result.status !== 'ready')
    throw new Error(`Expected ready result, received ${result.status}`);
  return result.state;
}

function expectSaved(result: RepositorySaveResult) {
  if (result.status !== 'saved')
    throw new Error(`Expected saved result, received ${result.status}`);
  return result.state;
}

function createRunningSession(): { session: FocusSession; timer: ActiveTimer } {
  const startedAt = localTimestamp('2026-08-16', 8);
  const session: FocusSession = {
    id: 'session-other-running',
    journeyId: otherJourney.id,
    nextStepId: null,
    plannedMinutes: 25,
    focusedMinutes: 3,
    status: 'running',
    source: 'timer',
    startedAt,
    endedAt: null,
    reflection: '',
  };

  return {
    session,
    timer: {
      sessionId: session.id,
      status: 'running',
      remainingSeconds: 1_320,
      accumulatedFocusedSeconds: 180,
      targetEndAt: localTimestamp('2026-08-16', 8),
      pausedAt: null,
    },
  };
}

describe('streak persistence boundaries', () => {
  it('replays an identical full summary after a fresh repository reload', () => {
    const storage = new MemoryStorage();
    const sessions = [
      ...createSessionRange(1, 7),
      createCompletedSession('2026-08-09', primaryJourney.id, 'session-manual-backfill', 'manual'),
    ];
    const state: AppState = {
      ...createEmptyAppState(),
      journeys: [primaryJourney],
      focusSessions: sessions,
      lastActiveJourneyId: primaryJourney.id,
      lastCompletedSessionId: sessions.at(-1)?.id ?? null,
    };
    const now = new Date(2026, 7, 9, 18);
    const firstRepository = createLocalStorageRepository({ getStorage: () => storage });
    const savedState = expectSaved(firstRepository.save(state));
    const beforeReload = deriveStreakSummary(
      savedState.focusSessions,
      savedState.journeys.map(({ id }) => id),
      now
    );

    const reloadedState = expectReady(
      createLocalStorageRepository({ getStorage: () => storage }).load()
    );
    const afterReload = deriveStreakSummary(
      reloadedState.focusSessions,
      reloadedState.journeys.map(({ id }) => id),
      now
    );

    expect(beforeReload).toMatchObject({
      currentStreak: 8,
      longestStreak: 8,
      freezesAvailable: 0,
      totalFreezesEarned: 1,
      totalFreezesUsed: 1,
    });
    expect(reloadedState).toEqual(state);
    expect(afterReload).toEqual(beforeReload);
  });

  it('preserves the complete state and derived summary through versioned export and import', () => {
    const running = createRunningSession();
    const completedSessions = [
      ...createSessionRange(1, 7),
      createCompletedSession('2026-08-09', otherJourney.id, 'session-other-manual', 'manual'),
    ];
    const sourceState: AppState = {
      ...createEmptyAppState(),
      journeys: [primaryJourney, otherJourney],
      nextSteps: [
        {
          id: 'next-step-other',
          journeyId: otherJourney.id,
          title: 'Practice the opening bars',
          description: '',
          status: 'current',
          position: 0,
          createdAt: localTimestamp('2026-08-01'),
          completedAt: null,
        },
      ],
      focusSessions: [...completedSessions, running.session],
      milestones: [otherMilestone],
      weeklyGoal: globalWeeklyGoal,
      onboardingDraft,
      activeTimer: running.timer,
      lastActiveJourneyId: otherJourney.id,
      lastCompletedSessionId: completedSessions.at(-1)?.id ?? null,
    };
    const now = new Date(2026, 7, 9, 18);
    const beforeImport = deriveStreakSummary(
      sourceState.focusSessions,
      sourceState.journeys.map(({ id }) => id),
      now
    );
    const freshStorage = new MemoryStorage();
    const freshRepository = createLocalStorageRepository({ getStorage: () => freshStorage });

    const importedState = expectSaved(
      freshRepository.importState(createAppExport(sourceState, '2026-08-16T20:00:00.000Z'))
    );
    const reloadedState = expectReady(
      createLocalStorageRepository({ getStorage: () => freshStorage }).load()
    );
    const afterImport = deriveStreakSummary(
      reloadedState.focusSessions,
      reloadedState.journeys.map(({ id }) => id),
      now
    );

    expect(importedState).toEqual(sourceState);
    expect(reloadedState).toEqual(sourceState);
    expect(reloadedState).toMatchObject({
      nextSteps: sourceState.nextSteps,
      milestones: [otherMilestone],
      weeklyGoal: globalWeeklyGoal,
      onboardingDraft,
      activeTimer: running.timer,
      lastActiveJourneyId: otherJourney.id,
      lastCompletedSessionId: completedSessions.at(-1)?.id,
    });
    expect(afterImport).toEqual(beforeImport);
  });

  it('recalculates rewards after Journey deletion while preserving unrelated global data', () => {
    const running = createRunningSession();
    const deletedSessions = createSessionRange(1, 8, primaryJourney.id);
    const retainedSessions = createSessionRange(9, 14, otherJourney.id);
    const deletedMilestone: Milestone = {
      id: 'milestone-primary',
      journeyId: primaryJourney.id,
      name: 'First hour',
      targetFocusedMinutes: 60,
      earnedAt: localTimestamp('2026-08-03'),
    };
    const state: AppState = {
      ...createEmptyAppState(),
      journeys: [primaryJourney, otherJourney],
      focusSessions: [...deletedSessions, ...retainedSessions, running.session],
      milestones: [deletedMilestone, otherMilestone],
      weeklyGoal: globalWeeklyGoal,
      onboardingDraft,
      activeTimer: running.timer,
      lastActiveJourneyId: otherJourney.id,
      lastCompletedSessionId: retainedSessions.at(-1)?.id ?? null,
    };
    const now = new Date(2026, 7, 16, 12);
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    expectSaved(repository.save(state));
    const beforeDeletion = deriveStreakSummary(
      state.focusSessions,
      state.journeys.map(({ id }) => id),
      now
    );

    const deletedState = expectSaved(repository.deleteJourney(primaryJourney.id));
    const reloadedState = expectReady(
      createLocalStorageRepository({ getStorage: () => storage }).load()
    );
    const afterDeletion = deriveStreakSummary(
      reloadedState.focusSessions,
      reloadedState.journeys.map(({ id }) => id),
      now
    );

    expect(beforeDeletion).toMatchObject({
      currentStreak: 14,
      longestStreak: 14,
      freezesAvailable: 1,
      totalFreezesEarned: 2,
      totalFreezesUsed: 1,
    });
    expect(deletedState.journeys).toEqual([otherJourney]);
    expect(deletedState.focusSessions).toEqual([...retainedSessions, running.session]);
    expect(deletedState.milestones).toEqual([otherMilestone]);
    expect(deletedState.weeklyGoal).toEqual(globalWeeklyGoal);
    expect(deletedState.onboardingDraft).toEqual(onboardingDraft);
    expect(deletedState.activeTimer).toEqual(running.timer);
    expect(reloadedState).toEqual(deletedState);
    expect(afterDeletion).toMatchObject({
      currentStreak: 0,
      longestStreak: 6,
      freezesAvailable: 0,
      totalFreezesEarned: 0,
      totalFreezesUsed: 0,
    });
    expect(afterDeletion.daysByDate['2026-08-15']?.state).toBe('missed');
  });
});
