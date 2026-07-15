import { describe, expect, it, vi } from 'vitest';

import { createSeedAppState } from './mock-data';
import type {
  ActiveTimer,
  FocusSession,
  Journey,
  Milestone,
  NextStep,
  OnboardingDraft,
} from './models';
import { APP_STORAGE_KEY, createLocalStorageRepository, type StorageLike } from './repository';

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

const draft: OnboardingDraft = {
  journeyName: 'Build a portfolio',
  reason: 'Ship work I am proud of.',
  targetMinutes: 10 * 60,
  nextStepTitle: 'Sketch the home page',
  startedAt: '2026-07-12T19:00:00.000Z',
  updatedAt: '2026-07-12T19:05:00.000Z',
};

const activeSession: FocusSession = {
  id: 'session-active',
  journeyId: 'journey-learn-guitar',
  nextStepId: 'next-step-f-chord',
  plannedMinutes: 25,
  focusedMinutes: 0,
  status: 'running',
  source: 'timer',
  startedAt: '2026-07-12T19:00:00.000Z',
  endedAt: null,
  reflection: '',
};

const activeTimer: ActiveTimer = {
  sessionId: activeSession.id,
  status: 'running',
  remainingSeconds: 1_500,
  accumulatedFocusedSeconds: 0,
  targetEndAt: '2026-07-12T19:25:00.000Z',
  pausedAt: null,
};

describe('localStorage repository', () => {
  it('seeds once only when saved state is absent', () => {
    const storage = new MemoryStorage();
    const createSeedState = vi.fn(createSeedAppState);
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState,
    });

    const firstLoad = repository.load();
    const secondLoad = repository.load();

    expect(firstLoad.status).toBe('ready');
    expect(firstLoad.status === 'ready' && firstLoad.seeded).toBe(true);
    expect(secondLoad.status).toBe('ready');
    expect(secondLoad.status === 'ready' && secondLoad.seeded).toBe(false);
    expect(createSeedState).toHaveBeenCalledTimes(1);
  });

  it('preserves returning-user state instead of merging in seed data', () => {
    const storage = new MemoryStorage();
    const returningState = {
      ...createSeedAppState(),
      journeys: [],
      focusSessions: [],
      lastActiveJourneyId: null,
      lastCompletedSessionId: null,
    };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(returningState));
    const createSeedState = vi.fn(createSeedAppState);
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState,
    });

    const result = repository.load();

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' && result.state).toEqual(returningState);
    expect(createSeedState).not.toHaveBeenCalled();
  });

  it('returns unavailable without touching browser APIs during SSR', () => {
    const createSeedState = vi.fn(createSeedAppState);
    const repository = createLocalStorageRepository({
      getStorage: () => null,
      createSeedState,
    });

    expect(repository.load()).toEqual({
      status: 'unavailable',
      state: null,
      seeded: false,
    });
    expect(repository.save(createSeedAppState())).toEqual({
      status: 'unavailable',
      state: null,
    });
    expect(createSeedState).not.toHaveBeenCalled();
  });

  it('persists onboarding, active session, timer, completion, and milestones', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();

    expect(repository.saveOnboardingDraft(draft).status).toBe('saved');
    expect(repository.upsertFocusSession(activeSession).status).toBe('saved');
    expect(repository.setActiveTimer(activeTimer).status).toBe('saved');

    const activeReload = createLocalStorageRepository({
      getStorage: () => storage,
    }).load();
    expect(activeReload.status).toBe('ready');
    expect(activeReload.status === 'ready' && activeReload.state.activeTimer).toEqual(activeTimer);

    const earnedMilestone: Milestone = {
      id: 'milestone-earned-by-session',
      journeyId: activeSession.journeyId,
      name: 'First pomodoro',
      targetFocusedMinutes: 25,
      earnedAt: '2026-07-12T19:25:00.000Z',
    };
    const completedSession: FocusSession = {
      ...activeSession,
      status: 'completed',
      focusedMinutes: 25,
      endedAt: '2026-07-12T19:25:00.000Z',
    };

    expect(repository.completeSession(completedSession, [earnedMilestone]).status).toBe('saved');

    const completedReload = createLocalStorageRepository({
      getStorage: () => storage,
    }).load();
    expect(completedReload.status).toBe('ready');

    if (completedReload.status !== 'ready') {
      throw new Error('Expected persisted state to load');
    }

    expect(completedReload.state.onboardingDraft).toEqual(draft);
    expect(completedReload.state.activeTimer).toBeNull();
    expect(
      completedReload.state.focusSessions.find(({ id }) => id === completedSession.id)
    ).toEqual(completedSession);
    expect(completedReload.state.milestones.find(({ id }) => id === earnedMilestone.id)).toEqual(
      earnedMilestone
    );
    expect(completedReload.state.lastCompletedSessionId).toBe(completedSession.id);
  });

  it('completes a session idempotently', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    const completedSession: FocusSession = {
      ...activeSession,
      status: 'completed',
      focusedMinutes: 25,
      endedAt: '2026-07-12T19:25:00.000Z',
    };

    repository.completeSession(completedSession);
    repository.completeSession({ ...completedSession, focusedMinutes: 50 });
    const result = repository.load();

    if (result.status !== 'ready') {
      throw new Error('Expected persisted state to load');
    }

    const matchingSessions = result.state.focusSessions.filter(
      ({ id }) => id === completedSession.id
    );
    expect(matchingSessions).toHaveLength(1);
    expect(matchingSessions[0]?.focusedMinutes).toBe(25);
  });

  it('finishes onboarding atomically without creating duplicate records', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.saveOnboardingDraft(draft);
    const journey: Journey = {
      id: 'journey-portfolio',
      name: draft.journeyName,
      reason: draft.reason,
      targetMinutes: draft.targetMinutes,
      status: 'active',
      createdAt: draft.startedAt,
      updatedAt: draft.updatedAt,
      lastActiveAt: draft.updatedAt,
    };
    const nextStep: NextStep = {
      id: 'next-step-portfolio-home',
      journeyId: journey.id,
      title: draft.nextStepTitle,
      description: '',
      status: 'current',
      position: 0,
      createdAt: draft.updatedAt,
      completedAt: null,
    };
    const milestone: Milestone = {
      id: 'milestone-portfolio-10-pomodoros',
      journeyId: journey.id,
      name: '10 pomodoros',
      targetFocusedMinutes: 250,
      earnedAt: null,
    };

    repository.finishOnboarding(journey, nextStep, milestone);
    repository.finishOnboarding(journey, nextStep, milestone);
    const result = repository.load();

    if (result.status !== 'ready') {
      throw new Error('Expected persisted state to load');
    }

    expect(result.state.journeys.filter(({ id }) => id === journey.id)).toHaveLength(1);
    expect(result.state.nextSteps.filter(({ id }) => id === nextStep.id)).toHaveLength(1);
    expect(result.state.milestones.filter(({ id }) => id === milestone.id)).toHaveLength(1);
    expect(result.state.milestones).toContainEqual(milestone);
    expect(result.state.onboardingDraft).toBeNull();
    expect(result.state.lastActiveJourneyId).toBe(journey.id);
  });

  it('keeps invalid saved data intact and returns a recoverable error', () => {
    const storage = new MemoryStorage();
    const invalidSavedState = '{"unexpected":true}';
    storage.setItem(APP_STORAGE_KEY, invalidSavedState);
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    const result = repository.load();

    expect(result.status).toBe('error');
    expect(result.status === 'error' ? result.error.code : undefined).toBe('invalid-saved-state');
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(invalidSavedState);
  });

  it('rejects malformed records nested inside saved-state arrays', () => {
    const storage = new MemoryStorage();
    const invalidState = { ...createSeedAppState(), journeys: [null] };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(invalidState));
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    const result = repository.load();

    expect(result.status).toBe('error');
    expect(result.status === 'error' && result.error.code).toBe('invalid-saved-state');
  });

  it('resets invalid saved data to a valid seed state', () => {
    const storage = new MemoryStorage();
    storage.setItem(APP_STORAGE_KEY, '{"unexpected":true}');
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    const result = repository.reset();

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' && result.seeded).toBe(true);
    expect(repository.load().status).toBe('ready');
  });

  it('replays completion side effects without overwriting a completed session', () => {
    const storage = new MemoryStorage();
    const completedSession: FocusSession = {
      ...activeSession,
      status: 'completed',
      focusedMinutes: 25,
      endedAt: '2026-07-12T19:25:00.000Z',
    };
    const state = {
      ...createSeedAppState(),
      focusSessions: [completedSession],
      activeTimer,
      lastActiveJourneyId: null,
      lastCompletedSessionId: null,
    };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const milestone: Milestone = {
      id: 'replayed-milestone',
      journeyId: completedSession.journeyId,
      name: 'Replayed milestone',
      targetFocusedMinutes: 25,
      earnedAt: completedSession.endedAt,
    };

    repository.completeSession({ ...completedSession, focusedMinutes: 50 }, [milestone]);
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toBeNull();
    expect(result.state.lastActiveJourneyId).toBe(completedSession.journeyId);
    expect(result.state.lastCompletedSessionId).toBe(completedSession.id);
    expect(result.state.focusSessions[0]?.focusedMinutes).toBe(25);
    expect(result.state.milestones).toContainEqual(milestone);
  });

  it('uses the preserved completed session Journey when replay input conflicts', () => {
    const storage = new MemoryStorage();
    const completedSession: FocusSession = {
      ...activeSession,
      status: 'completed',
      focusedMinutes: 25,
      endedAt: '2026-07-12T19:25:00.000Z',
    };
    const otherJourney: Journey = {
      id: 'journey-other',
      name: 'Other Journey',
      reason: '',
      targetMinutes: 600,
      status: 'active',
      createdAt: '2026-07-01T12:00:00.000Z',
      updatedAt: '2026-07-01T12:00:00.000Z',
      lastActiveAt: '2026-07-01T12:00:00.000Z',
    };
    const state = createSeedAppState();
    storage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        ...state,
        journeys: [...state.journeys, otherJourney],
        focusSessions: [completedSession],
        lastActiveJourneyId: otherJourney.id,
        lastCompletedSessionId: null,
      })
    );
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    repository.completeSession({
      ...completedSession,
      journeyId: otherJourney.id,
      focusedMinutes: 50,
    });
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.lastActiveJourneyId).toBe(completedSession.journeyId);
    expect(
      result.state.journeys.find(({ id }) => id === completedSession.journeyId)?.updatedAt
    ).toBe(completedSession.endedAt);
    expect(result.state.journeys.find(({ id }) => id === otherJourney.id)?.updatedAt).toBe(
      otherJourney.updatedAt
    );
  });

  it('notifies subscribers after successful writes', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    repository.saveOnboardingDraft(draft);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    repository.saveOnboardingDraft(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not report a successful write as failed when a subscriber throws', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.subscribe(() => {
      throw new Error('subscriber failed');
    });

    const result = repository.saveOnboardingDraft(draft);

    expect(result.status).toBe('saved');
    expect(repository.load().status).toBe('ready');
  });
});
