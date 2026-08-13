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
  type AppRepository,
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

const otherJourney: Journey = {
  id: 'journey-write-book',
  name: 'Write a book',
  reason: 'Share a story.',
  targetMinutes: 10_000,
  status: 'active',
  createdAt: '2026-07-10T18:00:00.000Z',
  updatedAt: '2026-07-17T18:00:00.000Z',
  lastActiveAt: '2026-07-17T18:00:00.000Z',
};

const otherCurrentNextStep: NextStep = {
  id: 'next-step-outline-chapter',
  journeyId: otherJourney.id,
  title: 'Outline the first chapter',
  description: '',
  status: 'current',
  position: 0,
  createdAt: '2026-07-17T18:00:00.000Z',
  completedAt: null,
};

const otherUpcomingNextStep: NextStep = {
  id: 'next-step-draft-chapter',
  journeyId: otherJourney.id,
  title: 'Draft the first chapter',
  description: '',
  status: 'upcoming',
  position: 1,
  createdAt: '2026-07-17T18:05:00.000Z',
  completedAt: null,
};

function createStateWithOtherJourney() {
  const state = createSeedAppState();

  return {
    ...state,
    journeys: [...state.journeys, otherJourney],
    nextSteps: [...state.nextSteps, otherCurrentNextStep, otherUpcomingNextStep],
  };
}

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
      nextStepId: null,
      activity: 'Practice scales',
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
      activity: '',
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

  it('renames a Journey without changing its related records', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: () => state,
    });
    const initial = repository.load();
    if (initial.status !== 'ready') throw new Error('Expected persisted state to load');
    const listener = vi.fn();
    repository.subscribe(listener);

    const result = repository.renameJourney('journey-learn-guitar', '  Practice guitar  ');
    const saved = repository.load();

    expect(result.status).toBe('saved');
    if (saved.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(saved.state).toEqual({
      ...initial.state,
      journeys: initial.state.journeys.map((journey) =>
        journey.id === 'journey-learn-guitar' ? { ...journey, name: 'Practice guitar' } : journey
      ),
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('renames an active Next step without changing its identity or references', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: () => state,
    });
    const initial = repository.load();
    if (initial.status !== 'ready') throw new Error('Expected persisted state to load');
    const listener = vi.fn();
    repository.subscribe(listener);

    const result = repository.renameNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '  Practice the F shape  '
    );
    const saved = repository.load();

    expect(result.status).toBe('saved');
    if (saved.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(saved.state).toEqual({
      ...initial.state,
      nextSteps: initial.state.nextSteps.map((nextStep) =>
        nextStep.id === 'next-step-f-chord'
          ? { ...nextStep, title: 'Practice the F shape' }
          : nextStep
      ),
    });
    expect(
      saved.state.focusSessions.filter(({ nextStepId }) => nextStepId === 'next-step-f-chord')
    ).toEqual(
      initial.state.focusSessions.filter(({ nextStepId }) => nextStepId === 'next-step-f-chord')
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid, unknown, and completed rename targets without notifying', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const initial = repository.load();
    if (initial.status !== 'ready') throw new Error('Expected persisted state to load');
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.renameJourney('journey-learn-guitar', ' ');
    repository.renameJourney('journey-learn-guitar', 'x'.repeat(81));
    repository.renameJourney('missing-journey', 'A valid Journey');
    repository.renameNextStep('journey-learn-guitar', 'next-step-f-chord', ' ');
    repository.renameNextStep('journey-learn-guitar', 'next-step-f-chord', 'x'.repeat(121));
    repository.renameNextStep('journey-learn-guitar', 'missing-step', 'A valid title');
    repository.renameNextStep(
      'journey-learn-guitar',
      'next-step-posture-tuning',
      'A completed step'
    );
    const saved = repository.load();

    expect(saved.status).toBe('ready');
    if (saved.status === 'ready' && initial.status === 'ready') {
      expect(saved.state).toEqual(initial.state);
    }
    expect(listener).not.toHaveBeenCalled();
  });

  it('adds a trimmed Next step at the normalized end without duplicating an id', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: () => state,
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

    const activeQueue = result.state.nextSteps
      .filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
      .sort((left, right) => left.position - right.position);
    expect(activeQueue.map(({ id, position, status }) => ({ id, position, status }))).toEqual([
      { id: 'next-step-f-chord', position: 0, status: 'current' },
      { id: 'next-step-strumming-pattern', position: 1, status: 'upcoming' },
      { id: 'next-step-play-first-song', position: 2, status: 'upcoming' },
      { id: 'next-step-learn-bridge', position: 3, status: 'upcoming' },
    ]);
    expect(activeQueue.at(-1)).toMatchObject({
      title: 'Learn the bridge slowly',
      createdAt: '2026-07-17T18:00:00.000Z',
      completedAt: null,
    });
    expect(
      result.state.nextSteps.filter(
        ({ journeyId, status }) => journeyId === 'journey-learn-guitar' && status === 'completed'
      )
    ).toEqual(state.nextSteps.filter(({ status }) => status === 'completed'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('adds a position-zero current Next step when its Journey has no active queue', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const completedSteps = state.nextSteps.map((nextStep) => ({
      ...nextStep,
      status: 'completed' as const,
      completedAt: '2026-07-17T17:00:00.000Z',
    }));
    storage.setItem(APP_STORAGE_KEY, JSON.stringify({ ...state, nextSteps: completedSteps }));
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
      position: 0,
    });
    expect(result.state.nextSteps.filter(({ status }) => status === 'completed')).toEqual(
      completedSteps
    );
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

  it('normalizes an exact Upcoming reorder and promotes the user-ordered first step next', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: createSeedAppState,
    });
    repository.load();
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.reorderUpcomingNextSteps('journey-learn-guitar', [
      'next-step-play-first-song',
      'next-step-strumming-pattern',
    ]);
    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:30:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    const reorderedSteps = result.state.nextSteps
      .filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
      .sort((left, right) => left.position - right.position);
    expect(reorderedSteps.map(({ id }) => id)).toEqual([
      'next-step-play-first-song',
      'next-step-strumming-pattern',
    ]);
    expect(reorderedSteps.map(({ position }) => position)).toEqual([0, 1]);
    expect(reorderedSteps[0]?.status).toBe('current');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not notify for invalid, cross-Journey, or already-normalized reorder requests', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const normalizedState = {
      ...state,
      nextSteps: state.nextSteps.map((nextStep) => {
        if (nextStep.id === 'next-step-f-chord') return { ...nextStep, position: 0 };
        if (nextStep.id === 'next-step-strumming-pattern') return { ...nextStep, position: 1 };
        if (nextStep.id === 'next-step-play-first-song') return { ...nextStep, position: 2 };
        return nextStep;
      }),
    };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(normalizedState));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const initial = repository.load();
    if (initial.status !== 'ready') throw new Error('Expected persisted state to load');
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.reorderUpcomingNextSteps('journey-learn-guitar', ['next-step-play-first-song']);
    repository.reorderUpcomingNextSteps('journey-learn-guitar', [
      'next-step-play-first-song',
      'next-step-play-first-song',
    ]);
    repository.reorderUpcomingNextSteps('journey-learn-guitar', [
      'next-step-play-first-song',
      'next-step-missing',
    ]);
    repository.reorderUpcomingNextSteps('missing-journey', [
      'next-step-play-first-song',
      'next-step-strumming-pattern',
    ]);
    repository.reorderUpcomingNextSteps('journey-learn-guitar', [
      'next-step-strumming-pattern',
      'next-step-play-first-song',
    ]);

    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps).toEqual(initial.state.nextSteps);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    [
      'reordering',
      (repository: AppRepository) =>
        repository.reorderUpcomingNextSteps('journey-learn-guitar', [
          'next-step-strumming-pattern',
          otherUpcomingNextStep.id,
        ]),
    ],
    [
      'making current',
      (repository: AppRepository) =>
        repository.makeNextStepCurrent('journey-learn-guitar', otherUpcomingNextStep.id),
    ],
    [
      'completing',
      (repository: AppRepository) =>
        repository.completeUpcomingNextStep(
          'journey-learn-guitar',
          otherUpcomingNextStep.id,
          '2026-07-17T18:30:00.000Z'
        ),
    ],
    [
      'deleting',
      (repository: AppRepository) =>
        repository.deleteUpcomingNextStep('journey-learn-guitar', otherUpcomingNextStep.id),
    ],
  ] as const)('does not notify or change state when %s uses an actual Next step from another Journey', (_operation, mutate) => {
    const storage = new MemoryStorage();
    const state = createStateWithOtherJourney();
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const initial = repository.load();
    if (initial.status !== 'ready') throw new Error('Expected persisted state to load');
    const beforeMutation = storage.getItem(APP_STORAGE_KEY);
    const listener = vi.fn();
    repository.subscribe(listener);

    mutate(repository);

    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state).toEqual(initial.state);
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeMutation);
    expect(listener).not.toHaveBeenCalled();
  });

  it('repairs duplicate current records while normalizing a successful reorder', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((nextStep) => {
      if (nextStep.id === 'next-step-strumming-pattern') {
        return { ...nextStep, status: 'current' as const, position: 7 };
      }
      if (nextStep.id === 'next-step-play-first-song') {
        return { ...nextStep, position: 9 };
      }
      return nextStep;
    });
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    repository.reorderUpcomingNextSteps('journey-learn-guitar', ['next-step-play-first-song']);
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    const activeQueue = result.state.nextSteps
      .filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
      .sort((left, right) => left.position - right.position);
    expect(activeQueue.map(({ id, status, position }) => ({ id, status, position }))).toEqual([
      { id: 'next-step-f-chord', status: 'current', position: 0 },
      { id: 'next-step-strumming-pattern', status: 'upcoming', position: 1 },
      { id: 'next-step-play-first-song', status: 'upcoming', position: 2 },
    ]);
  });

  it.each([
    [
      'reordering Upcoming steps without changing their order',
      (repository: AppRepository) =>
        repository.reorderUpcomingNextSteps('journey-learn-guitar', [
          'next-step-f-chord',
          'next-step-strumming-pattern',
          'next-step-play-first-song',
        ]),
      [
        { id: 'next-step-f-chord', status: 'current', position: 0 },
        { id: 'next-step-strumming-pattern', status: 'upcoming', position: 1 },
        { id: 'next-step-play-first-song', status: 'upcoming', position: 2 },
      ],
    ],
    [
      'reordering Upcoming steps',
      (repository: AppRepository) =>
        repository.reorderUpcomingNextSteps('journey-learn-guitar', [
          'next-step-play-first-song',
          'next-step-f-chord',
          'next-step-strumming-pattern',
        ]),
      [
        { id: 'next-step-play-first-song', status: 'current', position: 0 },
        { id: 'next-step-f-chord', status: 'upcoming', position: 1 },
        { id: 'next-step-strumming-pattern', status: 'upcoming', position: 2 },
      ],
    ],
    [
      'completing an Upcoming step',
      (repository: AppRepository) =>
        repository.completeUpcomingNextStep(
          'journey-learn-guitar',
          'next-step-strumming-pattern',
          '2026-07-17T18:30:00.000Z'
        ),
      [
        { id: 'next-step-f-chord', status: 'current', position: 0 },
        { id: 'next-step-play-first-song', status: 'upcoming', position: 1 },
      ],
    ],
    [
      'deleting an Upcoming step',
      (repository: AppRepository) =>
        repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-strumming-pattern'),
      [
        { id: 'next-step-f-chord', status: 'current', position: 0 },
        { id: 'next-step-play-first-song', status: 'upcoming', position: 1 },
      ],
    ],
  ] as const)('repairs a nonempty Upcoming queue without a current step when %s', (_operation, mutate, expectedQueue) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((nextStep) =>
      nextStep.id === 'next-step-f-chord' ? { ...nextStep, status: 'upcoming' as const } : nextStep
    );
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const listener = vi.fn();
    repository.subscribe(listener);
    const setItem = vi.spyOn(storage, 'setItem');

    const mutationResult = mutate(repository);
    const result = repository.load();

    expect(mutationResult.status).toBe('saved');
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    const activeQueue = result.state.nextSteps
      .filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
      .sort((left, right) => left.position - right.position);
    expect(activeQueue.map(({ id, status, position }) => ({ id, status, position }))).toEqual(
      expectedQueue
    );
  });

  it.each([
    [
      'completing',
      'first',
      'next-step-f-chord',
      [
        { id: 'next-step-strumming-pattern', status: 'current', position: 0 },
        { id: 'next-step-play-first-song', status: 'upcoming', position: 1 },
      ],
    ],
    [
      'completing',
      'last',
      'next-step-play-first-song',
      [
        { id: 'next-step-f-chord', status: 'current', position: 0 },
        { id: 'next-step-strumming-pattern', status: 'upcoming', position: 1 },
      ],
    ],
    [
      'deleting',
      'first',
      'next-step-f-chord',
      [
        { id: 'next-step-strumming-pattern', status: 'current', position: 0 },
        { id: 'next-step-play-first-song', status: 'upcoming', position: 1 },
      ],
    ],
    [
      'deleting',
      'last',
      'next-step-play-first-song',
      [
        { id: 'next-step-f-chord', status: 'current', position: 0 },
        { id: 'next-step-strumming-pattern', status: 'upcoming', position: 1 },
      ],
    ],
  ] as const)('%s the %s item in a three-item zero-current queue promotes the first remaining step', (operation, _boundary, nextStepId, expectedQueue) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((nextStep) =>
      nextStep.id === 'next-step-f-chord' ? { ...nextStep, status: 'upcoming' as const } : nextStep
    );
    state.focusSessions = [];
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    const mutationResult =
      operation === 'completing'
        ? repository.completeUpcomingNextStep(
            'journey-learn-guitar',
            nextStepId,
            '2026-07-17T18:30:00.000Z'
          )
        : repository.deleteUpcomingNextStep('journey-learn-guitar', nextStepId);
    const result = repository.load();

    expect(mutationResult.status).toBe('saved');
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    const activeQueue = result.state.nextSteps
      .filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
      .sort((left, right) => left.position - right.position);
    expect(activeQueue.map(({ id, status, position }) => ({ id, status, position }))).toEqual(
      expectedQueue
    );
  });

  it.each([
    [
      'completing',
      (repository: AppRepository) =>
        repository.completeUpcomingNextStep(
          'journey-learn-guitar',
          'next-step-strumming-pattern',
          '2026-07-17T18:30:00.000Z'
        ),
    ],
    [
      'deleting',
      (repository: AppRepository) =>
        repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-strumming-pattern'),
    ],
  ] as const)('leaves no active queue when %s its sole Upcoming step', (_operation, mutate) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((nextStep) => {
      if (nextStep.status === 'current' || nextStep.status === 'upcoming') {
        return nextStep.id === 'next-step-strumming-pattern'
          ? { ...nextStep, status: 'upcoming' as const, position: 1 }
          : {
              ...nextStep,
              status: 'completed' as const,
              completedAt: '2026-07-17T18:00:00.000Z',
            };
      }

      return nextStep;
    });
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    expect(mutate(repository).status).toBe('saved');
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(
      result.state.nextSteps.filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
    ).toEqual([]);
  });

  it('promotes C in current A and Upcoming B/C/D to current C and Upcoming A/B/D', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const stepD: NextStep = {
      id: 'next-step-d',
      journeyId: 'journey-learn-guitar',
      title: 'Step D',
      description: '',
      status: 'upcoming',
      position: 3,
      createdAt: '2026-07-17T18:00:00.000Z',
      completedAt: null,
    };
    const queueState = {
      ...state,
      nextSteps: [
        ...state.nextSteps.map((nextStep) => {
          if (nextStep.id === 'next-step-f-chord') {
            return { ...nextStep, title: 'Step A', position: 0 };
          }
          if (nextStep.id === 'next-step-strumming-pattern') {
            return { ...nextStep, title: 'Step B', position: 1 };
          }
          if (nextStep.id === 'next-step-play-first-song') {
            return { ...nextStep, title: 'Step C', position: 2 };
          }
          return nextStep;
        }),
        stepD,
      ],
    };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(queueState));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.makeNextStepCurrent('journey-learn-guitar', 'next-step-play-first-song');
    repository.makeNextStepCurrent('journey-learn-guitar', 'next-step-posture-tuning');
    repository.makeNextStepCurrent('missing-journey', 'next-step-strumming-pattern');
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    const activeQueue = result.state.nextSteps
      .filter(
        ({ journeyId, status }) =>
          journeyId === 'journey-learn-guitar' && (status === 'current' || status === 'upcoming')
      )
      .sort((left, right) => left.position - right.position);
    expect(activeQueue.map(({ title, status, position }) => ({ title, status, position }))).toEqual(
      [
        { title: 'Step C', status: 'current', position: 0 },
        { title: 'Step A', status: 'upcoming', position: 1 },
        { title: 'Step B', status: 'upcoming', position: 2 },
        { title: 'Step D', status: 'upcoming', position: 3 },
      ]
    );
    expect(result.state.focusSessions).toEqual(state.focusSessions);
    expect(result.state.milestones).toEqual(state.milestones);
    expect(result.state.journeys).toEqual(state.journeys);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an already-completed Next step', 'next-step-posture-tuning'],
    ['a missing Next step', 'next-step-missing'],
  ])('does not notify or change state when completing %s', (_target, nextStepId) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const beforeMutation = storage.getItem(APP_STORAGE_KEY);
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.completeUpcomingNextStep(
      'journey-learn-guitar',
      nextStepId,
      '2026-07-17T18:30:00.000Z'
    );

    const result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state).toEqual(state);
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeMutation);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    'running',
    'paused',
  ] as const)('blocks completing an Upcoming step used by the %s Focus session', (sessionStatus) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const session: FocusSession = {
      ...activeSession,
      id: `session-${sessionStatus}-upcoming`,
      nextStepId: 'next-step-strumming-pattern',
      status: sessionStatus,
    };
    storage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        ...state,
        focusSessions: [...state.focusSessions, session],
        activeTimer: { ...activeTimer, sessionId: session.id, status: sessionStatus },
      })
    );
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.completeUpcomingNextStep(
      'journey-learn-guitar',
      'next-step-strumming-pattern',
      '2026-07-17T18:30:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps).toEqual(state.nextSteps);
    expect(result.state.focusSessions).toContainEqual(session);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    'completed',
    'cancelled',
  ] as const)('allows completing an Upcoming step referenced by a %s Focus session', (sessionStatus) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const session: FocusSession = {
      ...activeSession,
      id: `session-${sessionStatus}-upcoming`,
      nextStepId: 'next-step-strumming-pattern',
      status: sessionStatus,
      focusedMinutes: sessionStatus === 'completed' ? 25 : 0,
      endedAt: '2026-07-17T18:25:00.000Z',
    };
    storage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        ...state,
        focusSessions: [...state.focusSessions, session],
        activeTimer: null,
      })
    );
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const listener = vi.fn();
    repository.subscribe(listener);

    const mutationResult = repository.completeUpcomingNextStep(
      'journey-learn-guitar',
      'next-step-strumming-pattern',
      '2026-07-17T18:30:00.000Z'
    );
    const result = repository.load();

    expect(mutationResult.status).toBe('saved');
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({
      status: 'completed',
      completedAt: '2026-07-17T18:30:00.000Z',
    });
    expect(result.state.focusSessions).toContainEqual(session);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('completes an unused Upcoming step, keeps current, and normalizes the remaining queue', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: () => state,
    });
    repository.load();
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.completeUpcomingNextStep(
      'journey-learn-guitar',
      'next-step-strumming-pattern',
      '2026-07-17T18:30:00.000Z'
    );
    repository.completeUpcomingNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:31:00.000Z'
    );
    repository.completeUpcomingNextStep(
      'missing-journey',
      'next-step-play-first-song',
      '2026-07-17T18:32:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({
      status: 'completed',
      completedAt: '2026-07-17T18:30:00.000Z',
    });
    const activeQueue = result.state.nextSteps
      .filter(({ status }) => status === 'current' || status === 'upcoming')
      .sort((left, right) => left.position - right.position);
    expect(activeQueue.map(({ id, status, position }) => ({ id, status, position }))).toEqual([
      { id: 'next-step-f-chord', status: 'current', position: 0 },
      { id: 'next-step-play-first-song', status: 'upcoming', position: 1 },
    ]);
    expect(result.state.focusSessions).toEqual(state.focusSessions);
    expect(result.state.milestones).toEqual(state.milestones);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each([
    'running',
    'paused',
  ] as const)('blocks deleting an Upcoming step used by the %s Focus session', (sessionStatus) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const session: FocusSession = {
      ...activeSession,
      id: `session-${sessionStatus}-upcoming-delete`,
      nextStepId: 'next-step-strumming-pattern',
      status: sessionStatus,
    };
    const savedState = {
      ...state,
      focusSessions: [...state.focusSessions, session],
      activeTimer: { ...activeTimer, sessionId: session.id, status: sessionStatus },
    };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(savedState));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const beforeMutation = storage.getItem(APP_STORAGE_KEY);
    const listener = vi.fn();
    repository.subscribe(listener);
    const setItem = vi.spyOn(storage, 'setItem');

    const mutationResult = repository.deleteUpcomingNextStep(
      'journey-learn-guitar',
      'next-step-strumming-pattern'
    );
    const result = repository.load();

    expect(mutationResult.status).toBe('saved');
    expect(setItem).not.toHaveBeenCalled();
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeMutation);
    expect(listener).not.toHaveBeenCalled();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps).toEqual(state.nextSteps);
    expect(result.state.focusSessions).toContainEqual(session);
  });

  it('blocks deletion of any session-referenced step and deletes only an unused Upcoming step', () => {
    const storage = new MemoryStorage();
    const state = createStateWithOtherJourney();
    const historicalUpcomingSession: FocusSession = {
      ...activeSession,
      id: 'session-historical-upcoming',
      nextStepId: 'next-step-strumming-pattern',
      status: 'completed',
      focusedMinutes: 25,
      endedAt: '2026-07-17T18:25:00.000Z',
    };
    const focusSessions = [...state.focusSessions, historicalUpcomingSession, activeSession];
    const savedState = { ...state, focusSessions, activeTimer };
    const otherJourneySteps = savedState.nextSteps.filter(
      ({ journeyId }) => journeyId === otherJourney.id
    );
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(savedState));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-strumming-pattern');
    let result = repository.load();
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps.some(({ id }) => id === 'next-step-strumming-pattern')).toBe(
      true
    );
    expect(listener).not.toHaveBeenCalled();

    repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-play-first-song');
    repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-f-chord');
    repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-posture-tuning');
    repository.deleteUpcomingNextStep('missing-journey', 'next-step-strumming-pattern');
    repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-missing');
    result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps.some(({ id }) => id === 'next-step-strumming-pattern')).toBe(
      true
    );
    expect(result.state.nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(false);
    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-posture-tuning')).toEqual(
      savedState.nextSteps.find(({ id }) => id === 'next-step-posture-tuning')
    );
    expect(result.state.focusSessions).toEqual(focusSessions);
    expect(result.state.journeys).toEqual(state.journeys);
    expect(result.state.milestones).toEqual(state.milestones);
    expect(result.state.weeklyGoal).toEqual(state.weeklyGoal);
    expect(result.state.onboardingDraft).toEqual(state.onboardingDraft);
    expect(result.state.activeTimer).toEqual(activeTimer);
    expect(result.state.lastActiveJourneyId).toBe(state.lastActiveJourneyId);
    expect(result.state.lastCompletedSessionId).toBe(state.lastCompletedSessionId);
    expect(result.state.nextSteps.filter(({ journeyId }) => journeyId === otherJourney.id)).toEqual(
      otherJourneySteps
    );
    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-f-chord')).toMatchObject({
      status: 'current',
      position: 0,
    });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'upcoming', position: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
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
    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-play-first-song',
      '2026-07-17T18:32:00.000Z'
    );
    repository.completeCurrentNextStep(
      'missing-journey',
      'next-step-strumming-pattern',
      '2026-07-17T18:33:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');

    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-f-chord')).toMatchObject({
      status: 'completed',
      completedAt: '2026-07-17T18:30:00.000Z',
    });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'current', position: 0, completedAt: null });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-play-first-song')
    ).toMatchObject({ status: 'upcoming', position: 1, completedAt: null });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each([
    'running',
    'paused',
  ] as const)('blocks completing the current Next step used by the %s Focus session', (sessionStatus) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const session: FocusSession = {
      ...activeSession,
      id: `session-${sessionStatus}-current`,
      status: sessionStatus,
    };
    const savedState = {
      ...state,
      focusSessions: [...state.focusSessions, session],
      activeTimer: {
        ...activeTimer,
        sessionId: session.id,
        status: sessionStatus,
        pausedAt: sessionStatus === 'paused' ? '2026-07-12T19:05:00.000Z' : null,
      },
    };
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(savedState));
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const beforeMutation = storage.getItem(APP_STORAGE_KEY);
    const listener = vi.fn();
    repository.subscribe(listener);

    const mutationResult = repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:30:00.000Z'
    );
    const result = repository.load();

    expect(mutationResult.status).toBe('saved');
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state).toEqual(savedState);
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeMutation);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    'completed',
    'cancelled',
  ] as const)('allows completing the current Next step referenced by a %s Focus session', (sessionStatus) => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const session: FocusSession = {
      ...activeSession,
      id: `session-${sessionStatus}-current`,
      status: sessionStatus,
      focusedMinutes: sessionStatus === 'completed' ? 25 : 0,
      endedAt: '2026-07-17T18:25:00.000Z',
    };
    storage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        ...state,
        focusSessions: [...state.focusSessions, session],
        activeTimer: null,
      })
    );
    const repository = createLocalStorageRepository({ getStorage: () => storage });
    const listener = vi.fn();
    repository.subscribe(listener);

    const mutationResult = repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:30:00.000Z'
    );
    const result = repository.load();

    expect(mutationResult.status).toBe('saved');
    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-f-chord')).toMatchObject({
      status: 'completed',
      completedAt: '2026-07-17T18:30:00.000Z',
    });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'current', position: 0 });
    expect(result.state.focusSessions).toContainEqual(session);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('normalizes a remaining duplicate current record when the selected current step completes', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((nextStep) =>
      nextStep.id === 'next-step-strumming-pattern'
        ? { ...nextStep, status: 'current' as const, position: 6 }
        : nextStep
    );
    storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    const repository = createLocalStorageRepository({ getStorage: () => storage });

    repository.completeCurrentNextStep(
      'journey-learn-guitar',
      'next-step-f-chord',
      '2026-07-17T18:30:00.000Z'
    );
    const result = repository.load();

    if (result.status !== 'ready') throw new Error('Expected persisted state to load');
    expect(result.state.nextSteps.find(({ id }) => id === 'next-step-f-chord')).toMatchObject({
      status: 'completed',
    });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'current', position: 0 });
    expect(
      result.state.nextSteps.find(({ id }) => id === 'next-step-play-first-song')
    ).toMatchObject({ status: 'upcoming', position: 1 });
  });

  it('leaves no current Next step after the final incomplete item is completed', () => {
    const storage = new MemoryStorage();
    const state = createSeedAppState();
    const earnedMilestones = state.milestones.filter(({ earnedAt }) => earnedAt !== null);
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: () => state,
    });
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
    expect(result.state.journeys).toEqual(state.journeys);
    expect(result.state.focusSessions).toEqual(state.focusSessions);
    expect(result.state.milestones).toEqual(state.milestones);
    expect(earnedMilestones.length).toBeGreaterThan(0);
    expect(result.state.milestones.filter(({ earnedAt }) => earnedAt !== null)).toEqual(
      earnedMilestones
    );
    expect(result.state.weeklyGoal).toEqual(state.weeklyGoal);
    expect(result.state.lastCompletedSessionId).toBe(state.lastCompletedSessionId);
  });

  it.each([
    [
      'reordering Upcoming steps',
      (repository: AppRepository) =>
        repository.reorderUpcomingNextSteps('journey-learn-guitar', [
          'next-step-play-first-song',
          'next-step-strumming-pattern',
        ]),
    ],
    [
      'completing an Upcoming step',
      (repository: AppRepository) =>
        repository.completeUpcomingNextStep(
          'journey-learn-guitar',
          'next-step-strumming-pattern',
          '2026-07-17T18:30:00.000Z'
        ),
    ],
    [
      'deleting an Upcoming step',
      (repository: AppRepository) =>
        repository.deleteUpcomingNextStep('journey-learn-guitar', 'next-step-play-first-song'),
    ],
  ] as const)('keeps saved state and subscribers unchanged when %s fails to write', (_, mutate) => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: createSeedAppState,
    });
    repository.load();
    const beforeWrite = storage.getItem(APP_STORAGE_KEY);
    const listener = vi.fn();
    repository.subscribe(listener);
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    const result = mutate(repository);

    expect(result.status).toBe('error');
    expect(result.status === 'error' ? result.error.code : undefined).toBe('storage-write-failed');
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeWrite);
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps saved state and subscribers unchanged when making a step current fails to write', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageRepository({
      getStorage: () => storage,
      createSeedState: createSeedAppState,
    });
    repository.load();
    const beforeWrite = storage.getItem(APP_STORAGE_KEY);
    const listener = vi.fn();
    repository.subscribe(listener);
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    const result = repository.makeNextStepCurrent(
      'journey-learn-guitar',
      'next-step-play-first-song'
    );

    expect(result.status).toBe('error');
    expect(result.status === 'error' ? result.error.code : undefined).toBe('storage-write-failed');
    expect(storage.getItem(APP_STORAGE_KEY)).toBe(beforeWrite);
    expect(listener).not.toHaveBeenCalled();
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

  describe('deleteJourney', () => {
    it('deletes a journey and cascades through its owned records while preserving unrelated data', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Learn Guitar',
        reason: 'Music',
        targetMinutes: 600,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      const j2: Journey = {
        id: 'j-2',
        name: 'Learn Spanish',
        reason: 'Travel',
        targetMinutes: 300,
        status: 'active',
        createdAt: '2026-08-02T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
        lastActiveAt: '2026-08-02T00:00:00.000Z',
      };

      const step1: NextStep = {
        id: 'step-1',
        journeyId: 'j-1',
        title: 'Practice C Chord',
        description: '',
        status: 'current',
        position: 0,
        createdAt: '2026-08-01T00:00:00.000Z',
        completedAt: null,
      };
      const step2: NextStep = {
        id: 'step-2',
        journeyId: 'j-2',
        title: 'Learn Basic Words',
        description: '',
        status: 'current',
        position: 0,
        createdAt: '2026-08-02T00:00:00.000Z',
        completedAt: null,
      };

      const session1: FocusSession = {
        id: 'sess-1',
        journeyId: 'j-1',
        nextStepId: 'step-1',
        plannedMinutes: 25,
        focusedMinutes: 25,
        status: 'completed',
        source: 'timer',
        startedAt: '2026-08-01T10:00:00.000Z',
        endedAt: '2026-08-01T10:25:00.000Z',
        reflection: 'Good session',
      };
      const session2: FocusSession = {
        id: 'sess-2',
        journeyId: 'j-2',
        nextStepId: 'step-2',
        plannedMinutes: 25,
        focusedMinutes: 25,
        status: 'completed',
        source: 'timer',
        startedAt: '2026-08-02T10:00:00.000Z',
        endedAt: '2026-08-02T10:25:00.000Z',
        reflection: '',
      };

      const milestone1: Milestone = {
        id: 'm-1',
        journeyId: 'j-1',
        name: 'First Pomodoro',
        targetFocusedMinutes: 25,
        earnedAt: '2026-08-01T10:25:00.000Z',
      };
      const milestone2: Milestone = {
        id: 'm-2',
        journeyId: 'j-2',
        name: 'First Pomodoro',
        targetFocusedMinutes: 25,
        earnedAt: '2026-08-02T10:25:00.000Z',
      };

      repository.upsertJourney(j1);
      repository.upsertJourney(j2);
      repository.upsertNextStep(step1);
      repository.upsertNextStep(step2);
      repository.completeSession(session1);
      repository.completeSession(session2);
      repository.upsertMilestone(milestone1);
      repository.upsertMilestone(milestone2);
      repository.saveOnboardingDraft(draft);
      repository.setWeeklyGoal({
        id: 'wg-1',
        journeyId: 'j-1',
        targetPomodoros: 10,
        weekStartsOn: 1,
        createdAt: '2026-08-01T00:00:00.000Z',
      });

      // Verify setup state
      const initial = repository.load();
      if (initial.status !== 'ready') throw new Error('Setup failed');
      expect(initial.state.journeys).toHaveLength(2);
      expect(initial.state.lastActiveJourneyId).toBe('j-2');
      expect(initial.state.lastCompletedSessionId).toBe('sess-2');

      // Now delete j-1
      const result = repository.deleteJourney('j-1');
      expect(result.status).toBe('saved');

      const reloaded = repository.load();
      if (reloaded.status !== 'ready') throw new Error('Reload failed');

      // Check remaining items
      expect(reloaded.state.journeys.map((j) => j.id)).toEqual(['j-2']);
      expect(reloaded.state.nextSteps.map((s) => s.id)).toEqual(['step-2']);
      expect(reloaded.state.focusSessions.map((s) => s.id)).toEqual(['sess-2']);
      expect(reloaded.state.milestones.map((m) => m.id)).toEqual(['m-2']);

      // Weekly goal for j-1 cleared
      expect(reloaded.state.weeklyGoal).toBeNull();

      // Pointers: lastActiveJourneyId was j-2, so preserved
      expect(reloaded.state.lastActiveJourneyId).toBe('j-2');
      // lastCompletedSessionId was sess-2, so preserved
      expect(reloaded.state.lastCompletedSessionId).toBe('sess-2');

      // Onboarding draft preserved
      expect(reloaded.state.onboardingDraft).toEqual(draft);
    });

    it('falls back to remaining journey when deleted journey was lastActiveJourneyId', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Journey 1',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      const j2: Journey = {
        id: 'j-2',
        name: 'Journey 2',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-02T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
        lastActiveAt: '2026-08-02T00:00:00.000Z',
      };

      repository.upsertJourney(j1);
      repository.upsertJourney(j2);

      // Set j-2 as last active journey
      repository.update((state) => ({ ...state, lastActiveJourneyId: 'j-2' }));

      // Delete j-2
      repository.deleteJourney('j-2');

      const reloaded = repository.load();
      if (reloaded.status !== 'ready') throw new Error('Reload failed');

      expect(reloaded.state.journeys.map((j) => j.id)).toEqual(['j-1']);
      expect(reloaded.state.lastActiveJourneyId).toBe('j-1');
    });

    it('clears all pointers and active timer when deleting the last journey', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Solo Journey',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      const session1: FocusSession = {
        id: 'sess-1',
        journeyId: 'j-1',
        nextStepId: null,
        plannedMinutes: 25,
        focusedMinutes: 0,
        status: 'running',
        source: 'timer',
        startedAt: '2026-08-01T10:00:00.000Z',
        endedAt: null,
        reflection: '',
      };
      const timer1: ActiveTimer = {
        sessionId: 'sess-1',
        status: 'running',
        remainingSeconds: 1500,
        accumulatedFocusedSeconds: 0,
        targetEndAt: '2026-08-01T10:25:00.000Z',
        pausedAt: null,
      };

      repository.upsertJourney(j1);
      repository.startFocusSession(session1, timer1);
      repository.update((state) => ({
        ...state,
        lastCompletedSessionId: 'sess-1',
        lastActiveJourneyId: 'j-1',
      }));

      // Delete the only journey
      repository.deleteJourney('j-1');

      const reloaded = repository.load();
      if (reloaded.status !== 'ready') throw new Error('Reload failed');

      expect(reloaded.state.journeys).toEqual([]);
      expect(reloaded.state.nextSteps).toEqual([]);
      expect(reloaded.state.focusSessions).toEqual([]);
      expect(reloaded.state.milestones).toEqual([]);
      expect(reloaded.state.activeTimer).toBeNull();
      expect(reloaded.state.lastActiveJourneyId).toBeNull();
      expect(reloaded.state.lastCompletedSessionId).toBeNull();
    });

    it('preserves active timer if it belongs to another journey', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Journey 1',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      const j2: Journey = {
        id: 'j-2',
        name: 'Journey 2',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-02T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
        lastActiveAt: '2026-08-02T00:00:00.000Z',
      };
      const session2: FocusSession = {
        id: 'sess-2',
        journeyId: 'j-2',
        nextStepId: null,
        plannedMinutes: 25,
        focusedMinutes: 0,
        status: 'running',
        source: 'timer',
        startedAt: '2026-08-02T10:00:00.000Z',
        endedAt: null,
        reflection: '',
      };
      const timer2: ActiveTimer = {
        sessionId: 'sess-2',
        status: 'running',
        remainingSeconds: 1500,
        accumulatedFocusedSeconds: 0,
        targetEndAt: '2026-08-02T10:25:00.000Z',
        pausedAt: null,
      };

      repository.upsertJourney(j1);
      repository.upsertJourney(j2);
      repository.startFocusSession(session2, timer2);

      // Delete j-1 (timer belongs to j-2)
      repository.deleteJourney('j-1');

      const reloaded = repository.load();
      if (reloaded.status !== 'ready') throw new Error('Reload failed');

      expect(reloaded.state.activeTimer).toEqual(timer2);
    });

    it('preserves global weekly goal without journeyId when a journey is deleted', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Journey 1',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      repository.upsertJourney(j1);
      const globalGoal = {
        id: 'wg-global',
        journeyId: null,
        targetPomodoros: 15,
        weekStartsOn: 1 as const,
        createdAt: '2026-08-01T00:00:00.000Z',
      };
      repository.setWeeklyGoal(globalGoal);

      repository.deleteJourney('j-1');

      const reloaded = repository.load();
      if (reloaded.status !== 'ready') throw new Error('Reload failed');

      expect(reloaded.state.weeklyGoal).toEqual(globalGoal);
    });

    it('is a no-op when deleting an unknown journey ID', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Journey 1',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      repository.upsertJourney(j1);

      const beforeState = repository.load();
      const result = repository.deleteJourney('unknown-id');

      expect(result.status).toBe('saved');
      expect(repository.load()).toEqual(beforeState);
    });

    it('handles persistence write failure gracefully', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Journey 1',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      repository.upsertJourney(j1);

      // Make storage setItem throw error
      storage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      const result = repository.deleteJourney('j-1');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error.code).toBe('storage-write-failed');
      }
    });

    it('produces clean exports that exclude deleted journey data', () => {
      const storage = new MemoryStorage();
      const repository = createLocalStorageRepository({ getStorage: () => storage });
      repository.load();

      const j1: Journey = {
        id: 'j-1',
        name: 'Journey 1',
        reason: '',
        targetMinutes: 100,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      };
      repository.upsertJourney(j1);
      repository.deleteJourney('j-1');

      const state = repository.load();
      if (state.status !== 'ready') throw new Error('State not ready');

      const exportData = createAppExport(state.state);
      const parsedState = parseAppExport(exportData);

      expect(parsedState).not.toBeNull();
      expect(parsedState?.journeys).toEqual([]);
    });
  });
});
