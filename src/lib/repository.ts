import { createSeedAppState } from './mock-data';
import {
  type ActiveTimer,
  APP_STATE_SCHEMA_VERSION,
  type AppState,
  type FocusSession,
  type Journey,
  type Milestone,
  type NextStep,
  type OnboardingDraft,
  type WeeklyGoal,
} from './models';

export const APP_STORAGE_KEY = '1000-pomodoros:app-state:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type RepositoryErrorCode =
  | 'storage-read-failed'
  | 'storage-write-failed'
  | 'invalid-saved-state';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'RepositoryError';
    this.code = code;
  }
}

export type RepositoryLoadResult =
  | {
      status: 'ready';
      state: AppState;
      seeded: boolean;
    }
  | {
      status: 'unavailable';
      state: null;
      seeded: false;
    }
  | {
      status: 'error';
      state: null;
      seeded: false;
      error: RepositoryError;
    };

export type RepositorySaveResult =
  | {
      status: 'saved';
      state: AppState;
    }
  | {
      status: 'unavailable';
      state: null;
    }
  | {
      status: 'error';
      state: null;
      error: RepositoryError;
    };

export interface AppRepository {
  load(): RepositoryLoadResult;
  save(state: AppState): RepositorySaveResult;
  update(updateState: (state: AppState) => AppState): RepositorySaveResult;
  reset(): RepositoryLoadResult;
  subscribe(listener: () => void): () => void;
  saveOnboardingDraft(draft: OnboardingDraft | null): RepositorySaveResult;
  upsertJourney(journey: Journey): RepositorySaveResult;
  upsertNextStep(nextStep: NextStep): RepositorySaveResult;
  upsertFocusSession(session: FocusSession): RepositorySaveResult;
  setActiveTimer(activeTimer: ActiveTimer | null): RepositorySaveResult;
  upsertMilestone(milestone: Milestone): RepositorySaveResult;
  setWeeklyGoal(weeklyGoal: WeeklyGoal | null): RepositorySaveResult;
  finishOnboarding(journey: Journey, firstNextStep: NextStep): RepositorySaveResult;
  completeSession(
    session: FocusSession,
    earnedMilestones?: readonly Milestone[]
  ): RepositorySaveResult;
}

interface RepositoryOptions {
  getStorage?: () => StorageLike | null;
  createSeedState?: () => AppState;
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return isString(value) && options.includes(value as T);
}

function isJourney(value: unknown): value is Journey {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.reason) &&
    isNonNegativeNumber(value.targetMinutes) &&
    isOneOf(value.status, ['active', 'paused', 'completed', 'archived']) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isString(value.lastActiveAt)
  );
}

function isNextStep(value: unknown): value is NextStep {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.journeyId) &&
    isString(value.title) &&
    isString(value.description) &&
    isOneOf(value.status, ['current', 'upcoming', 'completed', 'skipped']) &&
    isNonNegativeNumber(value.position) &&
    isString(value.createdAt) &&
    isNullableString(value.completedAt)
  );
}

function isFocusSession(value: unknown): value is FocusSession {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.journeyId) &&
    isNullableString(value.nextStepId) &&
    isNonNegativeNumber(value.plannedMinutes) &&
    isNonNegativeNumber(value.focusedMinutes) &&
    isOneOf(value.status, ['running', 'paused', 'completed', 'cancelled']) &&
    isOneOf(value.source, ['timer', 'manual']) &&
    isString(value.startedAt) &&
    isNullableString(value.endedAt) &&
    isString(value.reflection)
  );
}

function isActiveTimer(value: unknown): value is ActiveTimer {
  return (
    isRecord(value) &&
    isString(value.sessionId) &&
    isOneOf(value.status, ['running', 'paused']) &&
    isNonNegativeNumber(value.remainingSeconds) &&
    isNonNegativeNumber(value.accumulatedFocusedSeconds) &&
    isNullableString(value.targetEndAt) &&
    isNullableString(value.pausedAt)
  );
}

function isMilestone(value: unknown): value is Milestone {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.journeyId) &&
    isString(value.name) &&
    isNonNegativeNumber(value.targetFocusedMinutes) &&
    isNullableString(value.earnedAt)
  );
}

function isWeeklyGoal(value: unknown): value is WeeklyGoal {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isNullableString(value.journeyId) &&
    isNonNegativeNumber(value.targetPomodoros) &&
    (value.weekStartsOn === 0 || value.weekStartsOn === 1) &&
    isString(value.createdAt)
  );
}

function isOnboardingDraft(value: unknown): value is OnboardingDraft {
  return (
    isRecord(value) &&
    isString(value.journeyName) &&
    isString(value.reason) &&
    isNonNegativeNumber(value.targetMinutes) &&
    isString(value.nextStepTitle) &&
    isString(value.startedAt) &&
    isString(value.updatedAt)
  );
}

export function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === APP_STATE_SCHEMA_VERSION &&
    Array.isArray(value.journeys) &&
    value.journeys.every(isJourney) &&
    Array.isArray(value.nextSteps) &&
    value.nextSteps.every(isNextStep) &&
    Array.isArray(value.focusSessions) &&
    value.focusSessions.every(isFocusSession) &&
    Array.isArray(value.milestones) &&
    value.milestones.every(isMilestone) &&
    (value.weeklyGoal === null || isWeeklyGoal(value.weeklyGoal)) &&
    (value.onboardingDraft === null || isOnboardingDraft(value.onboardingDraft)) &&
    (value.activeTimer === null || isActiveTimer(value.activeTimer)) &&
    isNullableString(value.lastActiveJourneyId) &&
    isNullableString(value.lastCompletedSessionId)
  );
}

function upsertById<T extends { id: string }>(items: readonly T[], item: T) {
  const existingIndex = items.findIndex(({ id }) => id === item.id);

  if (existingIndex === -1) {
    return [...items, item];
  }

  return items.map((existingItem, index) => (index === existingIndex ? item : existingItem));
}

function toLoadError(
  code: RepositoryErrorCode,
  message: string,
  cause?: unknown
): RepositoryLoadResult {
  return {
    status: 'error',
    state: null,
    seeded: false,
    error: new RepositoryError(code, message, cause),
  };
}

function toSaveError(
  code: RepositoryErrorCode,
  message: string,
  cause?: unknown
): RepositorySaveResult {
  return {
    status: 'error',
    state: null,
    error: new RepositoryError(code, message, cause),
  };
}

export function createLocalStorageRepository(options: RepositoryOptions = {}): AppRepository {
  const getStorage = options.getStorage ?? getBrowserStorage;
  const createSeedState = options.createSeedState ?? createSeedAppState;
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
        // A subscriber cannot turn a successful persistence operation into a failure.
      }
    }
  }

  function resolveStorage():
    | { status: 'ready'; storage: StorageLike }
    | { status: 'unavailable' }
    | { status: 'error'; error: unknown } {
    try {
      const storage = getStorage();

      return storage === null ? { status: 'unavailable' } : { status: 'ready', storage };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  function load(): RepositoryLoadResult {
    const resolvedStorage = resolveStorage();

    if (resolvedStorage.status === 'unavailable') {
      return { status: 'unavailable', state: null, seeded: false };
    }

    if (resolvedStorage.status === 'error') {
      return toLoadError(
        'storage-read-failed',
        'Saved progress could not be accessed.',
        resolvedStorage.error
      );
    }

    let savedState: string | null;

    try {
      savedState = resolvedStorage.storage.getItem(APP_STORAGE_KEY);
    } catch (error) {
      return toLoadError('storage-read-failed', 'Saved progress could not be read.', error);
    }

    if (savedState === null) {
      const state = createSeedState();

      if (!isAppState(state)) {
        return toLoadError('invalid-saved-state', 'The initial progress data is invalid.');
      }

      try {
        resolvedStorage.storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        return toLoadError('storage-write-failed', 'Initial progress could not be saved.', error);
      }

      return { status: 'ready', state, seeded: true };
    }

    try {
      const state: unknown = JSON.parse(savedState);

      if (!isAppState(state)) {
        return toLoadError('invalid-saved-state', 'Saved progress is not in a supported format.');
      }

      return { status: 'ready', state, seeded: false };
    } catch (error) {
      return toLoadError('invalid-saved-state', 'Saved progress could not be understood.', error);
    }
  }

  function save(state: AppState): RepositorySaveResult {
    if (!isAppState(state)) {
      return toSaveError(
        'invalid-saved-state',
        'Progress was not saved because its format is invalid.'
      );
    }

    const resolvedStorage = resolveStorage();

    if (resolvedStorage.status === 'unavailable') {
      return { status: 'unavailable', state: null };
    }

    if (resolvedStorage.status === 'error') {
      return toSaveError(
        'storage-write-failed',
        'Progress storage could not be accessed.',
        resolvedStorage.error
      );
    }

    try {
      resolvedStorage.storage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      return toSaveError('storage-write-failed', 'Progress could not be saved.', error);
    }

    notify();
    return { status: 'saved', state };
  }

  function update(updateState: (state: AppState) => AppState): RepositorySaveResult {
    const result = load();

    if (result.status === 'unavailable') {
      return { status: 'unavailable', state: null };
    }

    if (result.status === 'error') {
      return { status: 'error', state: null, error: result.error };
    }

    return save(updateState(result.state));
  }

  function reset(): RepositoryLoadResult {
    const resolvedStorage = resolveStorage();

    if (resolvedStorage.status === 'unavailable') {
      return { status: 'unavailable', state: null, seeded: false };
    }

    if (resolvedStorage.status === 'error') {
      return toLoadError(
        'storage-write-failed',
        'Saved progress could not be reset.',
        resolvedStorage.error
      );
    }

    try {
      resolvedStorage.storage.removeItem(APP_STORAGE_KEY);
    } catch (error) {
      return toLoadError('storage-write-failed', 'Saved progress could not be reset.', error);
    }

    const result = load();

    if (result.status === 'ready') {
      notify();
    }

    return result;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function saveOnboardingDraft(draft: OnboardingDraft | null) {
    return update((state) => ({ ...state, onboardingDraft: draft }));
  }

  function upsertJourney(journey: Journey) {
    return update((state) => ({
      ...state,
      journeys: upsertById(state.journeys, journey),
    }));
  }

  function upsertNextStep(nextStep: NextStep) {
    return update((state) => ({
      ...state,
      nextSteps: upsertById(state.nextSteps, nextStep),
    }));
  }

  function upsertFocusSession(session: FocusSession) {
    return update((state) => ({
      ...state,
      focusSessions: upsertById(state.focusSessions, session),
    }));
  }

  function setActiveTimer(activeTimer: ActiveTimer | null) {
    return update((state) => ({ ...state, activeTimer }));
  }

  function upsertMilestone(milestone: Milestone) {
    return update((state) => ({
      ...state,
      milestones: upsertById(state.milestones, milestone),
    }));
  }

  function setWeeklyGoal(weeklyGoal: WeeklyGoal | null) {
    return update((state) => ({ ...state, weeklyGoal }));
  }

  function finishOnboarding(journey: Journey, firstNextStep: NextStep) {
    return update((state) => ({
      ...state,
      journeys: upsertById(state.journeys, journey),
      nextSteps: upsertById(state.nextSteps, firstNextStep),
      onboardingDraft: null,
      lastActiveJourneyId: journey.id,
    }));
  }

  function completeSession(session: FocusSession, earnedMilestones: readonly Milestone[] = []) {
    return update((state) => {
      const existingSession = state.focusSessions.find(({ id }) => id === session.id);

      const completedSession =
        existingSession?.status === 'completed'
          ? existingSession
          : { ...session, status: 'completed' as const };
      const completionTime = completedSession.endedAt ?? completedSession.startedAt;
      const journeys = state.journeys.map((journey) =>
        journey.id === completedSession.journeyId
          ? {
              ...journey,
              updatedAt: completionTime,
              lastActiveAt: completionTime,
            }
          : journey
      );

      return {
        ...state,
        journeys,
        focusSessions: upsertById(state.focusSessions, completedSession),
        milestones: earnedMilestones.reduce(
          (milestones, milestone) => upsertById(milestones, milestone),
          state.milestones
        ),
        activeTimer: state.activeTimer?.sessionId === session.id ? null : state.activeTimer,
        lastActiveJourneyId: completedSession.journeyId,
        lastCompletedSessionId: session.id,
      };
    });
  }

  return {
    load,
    save,
    update,
    reset,
    subscribe,
    saveOnboardingDraft,
    upsertJourney,
    upsertNextStep,
    upsertFocusSession,
    setActiveTimer,
    upsertMilestone,
    setWeeklyGoal,
    finishOnboarding,
    completeSession,
  };
}

export const appRepository = createLocalStorageRepository();
