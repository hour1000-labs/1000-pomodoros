import { describe, expect, it, vi } from 'vitest';

import { createEmptyAppState } from '@/lib/mock-data';
import type { AppState, FocusSession, Journey } from '@/lib/models';
import { createAppExport, createLocalStorageRepository, type StorageLike } from '@/lib/repository';

import { createManualFocusSession } from './manual-session';
import { deriveMonthlyPomodoroActivity } from './monthly-pomodoro-activity-data';

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

const JOURNEY_ID = 'journey-persistence';
const NOW = new Date(2026, 7, 31, 12);

function createJourney(): Journey {
  return {
    id: JOURNEY_ID,
    name: 'Persistence checks',
    reason: '',
    targetMinutes: 1_000,
    status: 'active',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
    lastActiveAt: '2026-08-01T12:00:00.000Z',
  };
}

function createTimerSession(id: string, focusedMinutes: number): FocusSession {
  const endedAt = new Date(2026, 7, 13, 12);

  return {
    id,
    journeyId: JOURNEY_ID,
    nextStepId: null,
    plannedMinutes: focusedMinutes,
    focusedMinutes,
    status: 'completed',
    source: 'timer',
    startedAt: new Date(endedAt.getTime() - focusedMinutes * 60_000).toISOString(),
    endedAt: endedAt.toISOString(),
    reflection: '',
  };
}

function createState(focusSessions: FocusSession[] = []): AppState {
  return {
    ...createEmptyAppState(),
    journeys: [createJourney()],
    focusSessions,
  };
}

function getActivity(storage: MemoryStorage) {
  const loaded = createLocalStorageRepository({ getStorage: () => storage }).load();
  if (loaded.status !== 'ready') throw new Error('Expected saved state to load');

  return deriveMonthlyPomodoroActivity(loaded.state, {
    year: NOW.getFullYear(),
    monthIndex: NOW.getMonth(),
    now: NOW,
    journeyId: JOURNEY_ID,
  });
}

describe('monthly activity persistence lifecycle', () => {
  it('refreshes derived totals after timer, manual, reload, import, and Journey deletion', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.save(createState());

    const listener = vi.fn(() => getActivity(storage));
    repository.subscribe(listener);

    expect(repository.completeSession(createTimerSession('timer-session', 25)).status).toBe(
      'saved'
    );
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.results.at(-1)?.value.totalPomodoros).toBe(1);

    const manualSession = createManualFocusSession({
      id: 'manual-session',
      journeyId: JOURNEY_ID,
      activity: 'Backfill ledger coverage',
      completedDate: '2026-08-13',
      focusedMinutes: 25,
    });
    expect(repository.addManualFocusSession(manualSession).status).toBe('saved');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.results.at(-1)?.value.totalPomodoros).toBe(2);

    expect(getActivity(storage).totalPomodoros).toBe(2);

    const importedState = createState([createTimerSession('imported-session', 50)]);
    expect(
      repository.importState(createAppExport(importedState, '2026-08-31T12:00:00.000Z')).status
    ).toBe('saved');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.results.at(-1)?.value.totalPomodoros).toBe(2);

    expect(repository.deleteJourney(JOURNEY_ID).status).toBe('saved');
    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener.mock.results.at(-1)?.value.totalPomodoros).toBe(0);
    expect(getActivity(storage)).toMatchObject({ focusedMinutes: 0, totalPomodoros: 0, days: [] });
  });
});
