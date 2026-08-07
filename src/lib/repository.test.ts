import { describe, expect, it, vi } from 'vitest';

import { createEmptyAppState, createSeedAppState } from './mock-data';
import type {
  ActiveTimer,
  FocusSession,
  Journey,
  Milestone,
  NextStep,
  OnboardingDraft,
} from './models';
import {
  APP_STORAGE_KEY,
  createAppExport,
  createLocalStorageRepository,
  parseAppExport,
  type StorageLike,
} from './repository';

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
  it('initializes an empty state by default when saved state is absent', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    const result = repository.load();

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' && result.state).toEqual(createEmptyAppState());
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(JSON.stringify(createEmptyAppState()));
  });

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

  it('round-trips a complete saved state through the versioned export format', () => {
    const state = createSeedAppState();
    const backup = createAppExport(state, '2026-07-12T19:00:00.000Z');

    expect(parseAppExport(JSON.parse(JSON.stringify(backup)))).toEqual(state);
  });

  it('imports a valid backup by replacing saved state and notifying subscribers', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    const listener = vi.fn();
    repository.subscribe(listener);
    const importedState = createSeedAppState();

    const result = repository.importState(createAppExport(importedState));

    expect(result.status).toBe('saved');
    expect(repository.load()).toMatchObject({ status: 'ready', state: importedState });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('rejects an invalid backup without changing the current saved state', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const currentState = createSeedAppState();
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(currentState));
    const beforeImport = storage.getItem(APP_STORAGE_KEY);

    const result = repository.importState({
      ...createAppExport(currentState),
      version: 999,
    });

    expect(result.status).toBe('error');
    expect(result.status === 'error' ? result.error.code : undefined).toBe('invalid-import-file');
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeImport);
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

  it('starts one focus session atomically and ignores a duplicate active start', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    const listener = vi.fn();
    repository.subscribe(listener);

    const firstResult = repository.startFocusSession(activeSession, activeTimer);
    const duplicateSession = { ...activeSession, id: 'session-duplicate' };
    const duplicateTimer = { ...activeTimer, sessionId: duplicateSession.id };
    const duplicateResult = repository.startFocusSession(duplicateSession, duplicateTimer);

    expect(firstResult.status).toBe('saved');
    expect(duplicateResult.status).toBe('saved');
    expect(listener).toHaveBeenCalledTimes(1);

    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toEqual(activeTimer);
    expect(result.state.focusSessions.filter(({ status }) => status === 'running')).toEqual([
      activeSession,
    ]);
    expect(result.state.lastActiveJourneyId).toBe(activeSession.journeyId);
  });

  it('pauses a running session atomically from its persisted target timestamp', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.startFocusSession(activeSession, activeTimer);

    repository.pauseFocusSession(activeSession.id, '2026-07-12T19:06:15.000Z');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toEqual({
      ...activeTimer,
      status: 'paused',
      remainingSeconds: 1_125,
      accumulatedFocusedSeconds: 375,
      targetEndAt: null,
      pausedAt: '2026-07-12T19:06:15.000Z',
    });
    expect(result.state.focusSessions.find(({ id }) => id === activeSession.id)?.status).toBe(
      'paused'
    );
  });

  it('resumes a paused session atomically without counting paused wall time', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.startFocusSession(activeSession, activeTimer);
    repository.pauseFocusSession(activeSession.id, '2026-07-12T19:06:15.000Z');

    repository.resumeFocusSession(activeSession.id, '2026-07-12T20:00:00.000Z');
    repository.resumeFocusSession(activeSession.id, '2026-07-12T20:01:00.000Z');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toMatchObject({
      sessionId: activeSession.id,
      status: 'running',
      remainingSeconds: 1_125,
      accumulatedFocusedSeconds: 375,
      targetEndAt: '2026-07-12T20:18:45.000Z',
      pausedAt: null,
    });
    expect(result.state.focusSessions.find(({ id }) => id === activeSession.id)?.status).toBe(
      'running'
    );
  });

  it('finishes an eligible paused session once and rejects one below five minutes', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.startFocusSession(activeSession, activeTimer);
    repository.pauseFocusSession(activeSession.id, '2026-07-12T19:04:59.000Z');

    repository.finishPausedFocusSession(activeSession.id, '2026-07-12T19:05:00.000Z');
    const tooEarlyResult = repository.load();
    expect(
      tooEarlyResult.status === 'ready' ? tooEarlyResult.state.activeTimer : null
    ).not.toBeNull();

    repository.resumeFocusSession(activeSession.id, '2026-07-12T19:05:00.000Z');
    repository.pauseFocusSession(activeSession.id, '2026-07-12T19:05:01.000Z');
    repository.finishPausedFocusSession(activeSession.id, '2026-07-12T19:05:02.000Z');
    repository.finishPausedFocusSession(activeSession.id, '2026-07-12T19:05:03.000Z');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toBeNull();
    expect(result.state.lastCompletedSessionId).toBe(activeSession.id);
    expect(result.state.focusSessions.filter(({ id }) => id === activeSession.id)).toEqual([
      {
        ...activeSession,
        focusedMinutes: 5,
        status: 'completed',
        endedAt: '2026-07-12T19:05:02.000Z',
      },
    ]);
  });

  it('cancels a paused session once without awarding focused progress', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.startFocusSession(activeSession, activeTimer);
    repository.pauseFocusSession(activeSession.id, '2026-07-12T19:06:15.000Z');
    const beforeCancel = repository.load();
    if (beforeCancel.status !== 'ready') throw new Error('Expected persisted state to load');
    const previousLastCompletedSessionId = beforeCancel.state.lastCompletedSessionId;

    repository.cancelFocusSession(activeSession.id, '2026-07-12T19:07:00.000Z');
    repository.cancelFocusSession(activeSession.id, '2026-07-12T19:08:00.000Z');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toBeNull();
    expect(result.state.lastCompletedSessionId).toBe(previousLastCompletedSessionId);
    expect(result.state.focusSessions.filter(({ id }) => id === activeSession.id)).toEqual([
      {
        ...activeSession,
        focusedMinutes: 0,
        status: 'cancelled',
        endedAt: '2026-07-12T19:07:00.000Z',
      },
    ]);
  });

  it('completes an elapsed running session once and refuses early completion', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    repository.startFocusSession(activeSession, activeTimer);

    repository.completeRunningFocusSession(activeSession.id, '2026-07-12T19:24:59.000Z');
    const tooEarlyResult = repository.load();
    expect(tooEarlyResult.status === 'ready' ? tooEarlyResult.state.activeTimer : null).toEqual(
      activeTimer
    );

    repository.completeRunningFocusSession(activeSession.id, '2026-07-12T19:25:00.000Z');
    repository.completeRunningFocusSession(activeSession.id, '2026-07-12T19:26:00.000Z');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.activeTimer).toBeNull();
    expect(result.state.lastCompletedSessionId).toBe(activeSession.id);
    expect(result.state.focusSessions.filter(({ id }) => id === activeSession.id)).toEqual([
      {
        ...activeSession,
        focusedMinutes: 25,
        status: 'completed',
        endedAt: activeTimer.targetEndAt,
      },
    ]);
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

  it('appends valid manual sessions for the same date and rejects invalid records', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: createSeedAppState,
    });
    repository.load();
    const firstManualSession: FocusSession = {
      ...activeSession,
      id: 'manual-session-first',
      plannedMinutes: 10,
      focusedMinutes: 10,
      status: 'completed',
      source: 'manual',
      startedAt: '2026-08-05T17:50:00.000Z',
      endedAt: '2026-08-05T18:00:00.000Z',
    };
    const secondManualSession: FocusSession = {
      ...firstManualSession,
      id: 'manual-session-second',
      plannedMinutes: 15,
      focusedMinutes: 15,
      startedAt: '2026-08-05T18:05:00.000Z',
      endedAt: '2026-08-05T18:20:00.000Z',
    };

    repository.addManualFocusSession(firstManualSession);
    repository.addManualFocusSession(secondManualSession);
    repository.addManualFocusSession({ ...firstManualSession, focusedMinutes: 4 });
    repository.addManualFocusSession({
      ...firstManualSession,
      id: 'manual-session-no-step',
      nextStepId: null,
    });
    repository.addManualFocusSession(firstManualSession);

    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.focusSessions.filter(({ source }) => source === 'manual')).toEqual([
      firstManualSession,
      secondManualSession,
    ]);
    expect(result.state.lastCompletedSessionId).toBe(secondManualSession.id);
  });

  it('awards every crossed milestone in the same idempotent completion write', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const crossedMilestone: Milestone = {
      id: 'milestone-learn-guitar-1100-minutes',
      journeyId: activeSession.journeyId,
      name: '1,100 focused minutes',
      targetFocusedMinutes: 1_100,
      earnedAt: null,
    };
    storage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({ ...state, milestones: [...state.milestones, crossedMilestone] })
    );
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    repository.startFocusSession(activeSession, activeTimer);
    repository.completeRunningFocusSession(activeSession.id, '2026-07-12T19:25:00.000Z');
    repository.completeRunningFocusSession(activeSession.id, '2026-07-12T19:26:00.000Z');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.focusSessions.filter(({ id }) => id === activeSession.id)).toHaveLength(1);
    expect(result.state.milestones.find(({ id }) => id === crossedMilestone.id)).toEqual({
      ...crossedMilestone,
      earnedAt: activeTimer.targetEndAt,
    });
  });

  it('updates only the reflection on a completed session within the 280-character limit', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();
    const completedSession: FocusSession = {
      ...activeSession,
      focusedMinutes: 25,
      status: 'completed',
      endedAt: '2026-07-12T19:25:00.000Z',
    };
    repository.completeSession(completedSession);

    repository.updateSessionReflection(completedSession.id, 'Practiced a clean transition.');
    repository.updateSessionReflection(completedSession.id, 'x'.repeat(281));
    repository.updateSessionReflection('missing-session', 'Should not replace completed data.');
    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.focusSessions.find(({ id }) => id === completedSession.id)).toEqual({
      ...completedSession,
      reflection: 'Practiced a clean transition.',
    });
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

  it('adds a trimmed Next step at the end of its Journey without duplicating an id', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: createSeedAppState,
    });
    repository.load();
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.addNextStep(
      'journey-learn-guitar',
      '  Learn the bridge slowly  ',
      '2026-07-17T18:00:00.000Z',
      'next-step-learn-bridge'
    );
    repository.addNextStep(
      'journey-learn-guitar',
      'A duplicate submission',
      '2026-07-17T18:01:00.000Z',
      'next-step-learn-bridge'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.nextSteps.filter(({ id }) => id === 'next-step-learn-bridge')).toEqual([
      {
        id: 'next-step-learn-bridge',
        journeyId: 'journey-learn-guitar',
        title: 'Learn the bridge slowly',
        description: '',
        status: 'upcoming',
        position: 3,
        createdAt: '2026-07-17T18:00:00.000Z',
        completedAt: null,
      },
    ]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('makes an added Next step current when its Journey has no current step', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    storage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        ...state,
        nextSteps: state.nextSteps.map((nextStep) => ({
          ...nextStep,
          status: 'completed' as const,
          completedAt: '2026-07-17T17:00:00.000Z',
        })),
      })
    );
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    repository.addNextStep(
      'journey-learn-guitar',
      'Practice a new song',
      '2026-07-17T18:00:00.000Z',
      'next-step-new-song'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-new-song')).toMatchObject({
      status: 'current',
      position: 3,
    });
  });

  it('rejects invalid or unknown-Journey Next steps', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const initial = repository.load();
    if (initial.status !== 'ready') throw new Error('Expected persisted state to load');
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.addNextStep(
      'journey-learn-guitar',
      ' ',
      '2026-07-17T18:00:00.000Z',
      'next-step-empty'
    );
    repository.addNextStep(
      'journey-learn-guitar',
      'x'.repeat(121),
      '2026-07-17T18:00:00.000Z',
      'next-step-too-long'
    );
    repository.addNextStep(
      'missing-journey',
      'A valid title',
      '2026-07-17T18:00:00.000Z',
      'next-step-missing-journey'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.nextSteps).toEqual(initial.state.nextSteps);
    expect(listener).not.toHaveBeenCalled();
  });

  it('completes the current Next step and promotes the first upcoming step atomically', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: createSeedAppState,
    });
    repository.load();
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:30:00.000Z'
    );
    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:31:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-f-chord')).toMatchObject({
      status: 'completed',
      completedAt: '2026-07-17T18:30:00.000Z',
    });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'current', completedAt: null });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-play-first-song')
    ).toMatchObject({ status: 'upcoming', completedAt: null });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('leaves no current Next step after the final incomplete item is completed', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    repository.load();

    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:30:00.000Z'
    );
    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-strumming-pattern',
      '2026-07-17T19:00:00.000Z'
    );
    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-play-first-song',
      '2026-07-17T19:30:00.000Z'
    );
    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-play-first-song',
      '2026-07-17T20:00:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    const journeySteps = result.state.nextSteps.filter(
      ({ journeyId }) => journeyId === 'journey-learn-guitar'
    );
    expect(journeySteps.every(({ status }) => status === 'completed')).toBe(true);
    expect(journeySteps.find(({ status }) => status === 'current')).toBeUndefined();
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
