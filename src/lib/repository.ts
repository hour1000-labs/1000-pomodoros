import {
  canFinishPausedFocusSession,
  cancelPausedFocusSession as createCancelledPausedSession,
  completePausedFocusSession as createCompletedPausedSession,
  completeRunningFocusSession as createCompletedRunningSession,
  resumePausedFocusSession as createResumedPausedSession,
  getRemainingSeconds,
  pauseRunningFocusSession,
} from './focus-timer';
import { getJourneyNameError } from './journey-name';
import { createEmptyAppState } from './mock-data';
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
import { getNextStepError } from './next-step';
import { getFocusedMinutes, MINIMUM_FOCUSED_MINUTES } from './progress';

export const SESSION_REFLECTION_MAX_LENGTH = 280;

export const APP_STORAGE_KEY = '1000-pomodoros:app-state:v1';
export const APP_EXPORT_FORMAT = '1000-pomodoros.app-state';
export const APP_EXPORT_VERSION = 1 as const;

export interface AppExport {
  format: typeof APP_EXPORT_FORMAT;
  version: typeof APP_EXPORT_VERSION;
  exportedAt: string;
  state: AppState;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type RepositoryErrorCode =
  | 'storage-read-failed'
  | 'storage-write-failed'
  | 'invalid-saved-state'
  | 'invalid-import-file';

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
  importState(data: unknown): RepositorySaveResult;
  update(updateState: (state: AppState) => AppState): RepositorySaveResult;
  reset(): RepositoryLoadResult;
  subscribe(listener: () => void): () => void;
  saveOnboardingDraft(draft: OnboardingDraft | null): RepositorySaveResult;
  upsertJourney(journey: Journey): RepositorySaveResult;
  renameJourney(journeyId: string, name: string): RepositorySaveResult;
  deleteJourney(journeyId: string): RepositorySaveResult;
  upsertNextStep(nextStep: NextStep): RepositorySaveResult;
  renameNextStep(journeyId: string, nextStepId: string, title: string): RepositorySaveResult;
  addNextStep(
    journeyId: string,
    title: string,
    createdAt: string,
    id: string
  ): RepositorySaveResult;
  reorderUpcomingNextSteps(
    journeyId: string,
    orderedNextStepIds: readonly string[]
  ): RepositorySaveResult;
  makeNextStepCurrent(journeyId: string, nextStepId: string): RepositorySaveResult;
  completeUpcomingNextStep(
    journeyId: string,
    nextStepId: string,
    completedAt: string
  ): RepositorySaveResult;
  deleteUpcomingNextStep(journeyId: string, nextStepId: string): RepositorySaveResult;
  completeCurrentNextStep(
    journeyId: string,
    nextStepId: string,
    completedAt: string
  ): RepositorySaveResult;
  upsertFocusSession(session: FocusSession): RepositorySaveResult;
  setActiveTimer(activeTimer: ActiveTimer | null): RepositorySaveResult;
  startFocusSession(session: FocusSession, activeTimer: ActiveTimer): RepositorySaveResult;
  pauseFocusSession(sessionId: string, pausedAt: string): RepositorySaveResult;
  resumeFocusSession(sessionId: string, resumedAt: string): RepositorySaveResult;
  finishPausedFocusSession(sessionId: string, completedAt: string): RepositorySaveResult;
  cancelFocusSession(sessionId: string, cancelledAt: string): RepositorySaveResult;
  completeRunningFocusSession(sessionId: string, completedAt: string): RepositorySaveResult;
  upsertMilestone(milestone: Milestone): RepositorySaveResult;
  setWeeklyGoal(weeklyGoal: WeeklyGoal | null): RepositorySaveResult;
  finishOnboarding(
    journey: Journey,
    firstNextStep: NextStep,
    firstMilestone: Milestone
  ): RepositorySaveResult;
  completeSession(
    session: FocusSession,
    earnedMilestones?: readonly Milestone[]
  ): RepositorySaveResult;
  addManualFocusSession(session: FocusSession): RepositorySaveResult;
  updateSessionReflection(sessionId: string, reflection: string): RepositorySaveResult;
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

export function createAppExport(state: AppState, exportedAt = new Date().toISOString()): AppExport {
  return {
    format: APP_EXPORT_FORMAT,
    version: APP_EXPORT_VERSION,
    exportedAt,
    state,
  };
}

export function parseAppExport(value: unknown): AppState | null {
  if (
    !isRecord(value) ||
    value.format !== APP_EXPORT_FORMAT ||
    value.version !== APP_EXPORT_VERSION ||
    !isString(value.exportedAt) ||
    !isAppState(value.state)
  ) {
    return null;
  }

  return value.state;
}

function upsertById<T extends { id: string }>(items: readonly T[], item: T) {
  const existingIndex = items.findIndex(({ id }) => id === item.id);

  if (existingIndex === -1) {
    return [...items, item];
  }

  return items.map((existingItem, index) => (index === existingIndex ? item : existingItem));
}

function compareNextStepOrder(left: NextStep, right: NextStep) {
  return (
    left.position - right.position ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function getActiveNextStepOrder(nextSteps: readonly NextStep[], journeyId: string) {
  const currentSteps = nextSteps
    .filter((nextStep) => nextStep.journeyId === journeyId && nextStep.status === 'current')
    .sort(compareNextStepOrder);
  const upcomingSteps = nextSteps
    .filter((nextStep) => nextStep.journeyId === journeyId && nextStep.status === 'upcoming')
    .sort(compareNextStepOrder);

  return { currentSteps, upcomingSteps };
}

function applyActiveNextStepOrder(
  nextSteps: readonly NextStep[],
  journeyId: string,
  currentStepId: string | null,
  orderedUpcomingStepIds: readonly string[]
) {
  const upcomingPositionById = new Map(
    orderedUpcomingStepIds.map((nextStepId, index) => [nextStepId, index + 1])
  );
  let changed = false;
  const orderedNextSteps: readonly NextStep[] = nextSteps.map((nextStep) => {
    if (nextStep.journeyId !== journeyId) {
      return nextStep;
    }

    let status: 'current' | 'upcoming';
    let position: number;

    if (nextStep.id === currentStepId) {
      status = 'current';
      position = 0;
    } else {
      const upcomingPosition = upcomingPositionById.get(nextStep.id);

      if (upcomingPosition === undefined) {
        return nextStep;
      }

      status = 'upcoming';
      position = upcomingPosition;
    }

    if (nextStep.status === status && nextStep.position === position) {
      return nextStep;
    }

    changed = true;
    return { ...nextStep, status, position };
  });

  return changed ? orderedNextSteps : nextSteps;
}

function completeSessionInState(
  state: AppState,
  session: FocusSession,
  earnedMilestones: readonly Milestone[] = []
) {
  const existingSession = state.focusSessions.find(({ id }) => id === session.id);
  const completedSession =
    existingSession?.status === 'completed'
      ? existingSession
      : { ...session, status: 'completed' as const };
  const completionTime = completedSession.endedAt ?? completedSession.startedAt;
  const focusSessions = upsertById(state.focusSessions, completedSession);
  const previousFocusedMinutes = getFocusedMinutes(
    state.focusSessions.filter(({ id }) => id !== completedSession.id),
    completedSession.journeyId
  );
  const updatedFocusedMinutes = getFocusedMinutes(focusSessions, completedSession.journeyId);
  const milestonesWithAutomaticAwards = state.milestones.map((milestone) =>
    milestone.journeyId === completedSession.journeyId &&
    milestone.earnedAt === null &&
    previousFocusedMinutes < milestone.targetFocusedMinutes &&
    updatedFocusedMinutes >= milestone.targetFocusedMinutes
      ? { ...milestone, earnedAt: completionTime }
      : milestone
  );
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
    focusSessions,
    milestones: earnedMilestones.reduce(
      (milestones, milestone) => upsertById(milestones, milestone),
      milestonesWithAutomaticAwards
    ),
    activeTimer: state.activeTimer?.sessionId === session.id ? null : state.activeTimer,
    lastActiveJourneyId: completedSession.journeyId,
    lastCompletedSessionId: session.id,
  };
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
  const createSeedState = options.createSeedState ?? createEmptyAppState;
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

  function importState(data: unknown): RepositorySaveResult {
    const state = parseAppExport(data);

    if (state === null) {
      return toSaveError(
        'invalid-import-file',
        'This file is not a supported 1000 Pomodoros backup.'
      );
    }

    return save(state);
  }

  function update(updateState: (state: AppState) => AppState): RepositorySaveResult {
    const result = load();

    if (result.status === 'unavailable') {
      return { status: 'unavailable', state: null };
    }

    if (result.status === 'error') {
      return { status: 'error', state: null, error: result.error };
    }

    const nextState = updateState(result.state);

    if (Object.is(nextState, result.state)) {
      return { status: 'saved', state: result.state };
    }

    return save(nextState);
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

  function renameJourney(journeyId: string, name: string) {
    return update((state) => {
      if (getJourneyNameError(name) !== null) return state;

      const journey = state.journeys.find(({ id }) => id === journeyId);
      const trimmedName = name.trim();
      if (journey === undefined || journey.name === trimmedName) return state;

      return {
        ...state,
        journeys: state.journeys.map((currentJourney) =>
          currentJourney.id === journeyId
            ? { ...currentJourney, name: trimmedName }
            : currentJourney
        ),
      };
    });
  }

  function deleteJourney(journeyId: string) {
    return update((state) => {
      const journeyToDelete = state.journeys.find((journey) => journey.id === journeyId);

      if (!journeyToDelete) {
        return state;
      }

      const remainingJourneys = state.journeys.filter((journey) => journey.id !== journeyId);
      const remainingNextSteps = state.nextSteps.filter((step) => step.journeyId !== journeyId);

      const deletedSessionIds = new Set(
        state.focusSessions
          .filter((session) => session.journeyId === journeyId)
          .map((session) => session.id)
      );
      const remainingFocusSessions = state.focusSessions.filter(
        (session) => session.journeyId !== journeyId
      );

      const remainingMilestones = state.milestones.filter(
        (milestone) => milestone.journeyId !== journeyId
      );

      const weeklyGoal = state.weeklyGoal?.journeyId === journeyId ? null : state.weeklyGoal;

      const activeTimer =
        state.activeTimer !== null && deletedSessionIds.has(state.activeTimer.sessionId)
          ? null
          : state.activeTimer;

      const lastCompletedSessionId =
        state.lastCompletedSessionId !== null && deletedSessionIds.has(state.lastCompletedSessionId)
          ? null
          : state.lastCompletedSessionId;

      let lastActiveJourneyId = state.lastActiveJourneyId;
      if (
        lastActiveJourneyId === journeyId ||
        (lastActiveJourneyId !== null &&
          !remainingJourneys.some((journey) => journey.id === lastActiveJourneyId))
      ) {
        lastActiveJourneyId = remainingJourneys.length > 0 ? remainingJourneys[0].id : null;
      }

      return {
        ...state,
        journeys: remainingJourneys,
        nextSteps: remainingNextSteps,
        focusSessions: remainingFocusSessions,
        milestones: remainingMilestones,
        weeklyGoal,
        activeTimer,
        lastCompletedSessionId,
        lastActiveJourneyId,
      };
    });
  }

  function upsertNextStep(nextStep: NextStep) {
    return update((state) => ({
      ...state,
      nextSteps: upsertById(state.nextSteps, nextStep),
    }));
  }

  function renameNextStep(journeyId: string, nextStepId: string, title: string) {
    return update((state) => {
      if (getNextStepError(title) !== null) return state;

      const nextStep = state.nextSteps.find(
        ({ id, journeyId: ownerId, status }) =>
          id === nextStepId &&
          ownerId === journeyId &&
          (status === 'current' || status === 'upcoming')
      );
      const trimmedTitle = title.trim();
      if (nextStep === undefined || nextStep.title === trimmedTitle) return state;

      return {
        ...state,
        nextSteps: state.nextSteps.map((currentStep) =>
          currentStep.id === nextStepId ? { ...currentStep, title: trimmedTitle } : currentStep
        ),
      };
    });
  }

  function addNextStep(journeyId: string, title: string, createdAt: string, id: string) {
    return update((state) => {
      if (
        getNextStepError(title) !== null ||
        !state.journeys.some((journey) => journey.id === journeyId) ||
        state.nextSteps.some((nextStep) => nextStep.id === id)
      ) {
        return state;
      }

      const { currentSteps, upcomingSteps } = getActiveNextStepOrder(state.nextSteps, journeyId);
      const currentStep = currentSteps[0] ?? null;
      const nextStep: NextStep = {
        id,
        journeyId,
        title: title.trim(),
        description: '',
        status: currentStep === null ? 'current' : 'upcoming',
        position: 0,
        createdAt,
        completedAt: null,
      };
      const nextStepsWithAddedStep = [...state.nextSteps, nextStep];
      const orderedUpcomingStepIds =
        currentStep === null
          ? upcomingSteps.map(({ id: upcomingStepId }) => upcomingStepId)
          : [
              ...currentSteps.slice(1).map(({ id: currentStepId }) => currentStepId),
              ...upcomingSteps.map(({ id: upcomingStepId }) => upcomingStepId),
              id,
            ];
      const nextSteps = applyActiveNextStepOrder(
        nextStepsWithAddedStep,
        journeyId,
        currentStep?.id ?? id,
        orderedUpcomingStepIds
      );

      return { ...state, nextSteps: [...nextSteps] };
    });
  }

  function reorderUpcomingNextSteps(journeyId: string, orderedNextStepIds: readonly string[]) {
    return update((state) => {
      if (!state.journeys.some((journey) => journey.id === journeyId)) {
        return state;
      }

      const { currentSteps, upcomingSteps } = getActiveNextStepOrder(state.nextSteps, journeyId);
      const requestedIds = new Set(orderedNextStepIds);
      const hasExactMembership =
        orderedNextStepIds.length === upcomingSteps.length &&
        requestedIds.size === upcomingSteps.length &&
        upcomingSteps.every(({ id }) => requestedIds.has(id));

      if (!hasExactMembership) {
        return state;
      }

      const currentIds = upcomingSteps.map(({ id }) => id);
      const orderChanged = currentIds.some((id, index) => id !== orderedNextStepIds[index]);
      const positionsAreNormalized =
        currentSteps.length <= 1 &&
        (currentSteps[0]?.position === 0 ||
          (currentSteps.length === 0 && upcomingSteps.length === 0)) &&
        upcomingSteps.every((nextStep, index) => nextStep.position === index + 1);

      if (!orderChanged && positionsAreNormalized) {
        return state;
      }

      const orderedActiveStepIds = [...currentSteps.map(({ id }) => id), ...orderedNextStepIds];
      const nextSteps = applyActiveNextStepOrder(
        state.nextSteps,
        journeyId,
        orderedActiveStepIds[0] ?? null,
        orderedActiveStepIds.slice(1)
      );

      return nextSteps === state.nextSteps ? state : { ...state, nextSteps: [...nextSteps] };
    });
  }

  function makeNextStepCurrent(journeyId: string, nextStepId: string) {
    return update((state) => {
      const selectedStep = state.nextSteps.find(
        (nextStep) => nextStep.journeyId === journeyId && nextStep.id === nextStepId
      );

      if (selectedStep?.status !== 'upcoming') {
        return state;
      }

      const { currentSteps, upcomingSteps } = getActiveNextStepOrder(state.nextSteps, journeyId);
      const orderedUpcomingStepIds = [
        ...currentSteps.map(({ id }) => id),
        ...upcomingSteps.filter(({ id }) => id !== selectedStep.id).map(({ id }) => id),
      ];
      const nextSteps = applyActiveNextStepOrder(
        state.nextSteps,
        journeyId,
        selectedStep.id,
        orderedUpcomingStepIds
      );

      return { ...state, nextSteps: [...nextSteps] };
    });
  }

  function completeUpcomingNextStep(journeyId: string, nextStepId: string, completedAt: string) {
    return update((state) => {
      const selectedStep = state.nextSteps.find(
        (nextStep) => nextStep.journeyId === journeyId && nextStep.id === nextStepId
      );

      const isActiveSessionStep = state.focusSessions.some(
        (session) =>
          session.nextStepId === selectedStep?.id &&
          (session.status === 'running' || session.status === 'paused')
      );

      if (selectedStep?.status !== 'upcoming' || isActiveSessionStep) {
        return state;
      }

      const { currentSteps, upcomingSteps } = getActiveNextStepOrder(state.nextSteps, journeyId);
      const completedNextSteps = state.nextSteps.map((nextStep) =>
        nextStep.journeyId === journeyId && nextStep.id === selectedStep.id
          ? { ...nextStep, status: 'completed' as const, completedAt }
          : nextStep
      );
      const remainingActiveStepIds = [
        ...currentSteps.map(({ id }) => id),
        ...upcomingSteps.filter(({ id }) => id !== selectedStep.id).map(({ id }) => id),
      ];
      const nextSteps = applyActiveNextStepOrder(
        completedNextSteps,
        journeyId,
        remainingActiveStepIds[0] ?? null,
        remainingActiveStepIds.slice(1)
      );

      return { ...state, nextSteps: [...nextSteps] };
    });
  }

  function deleteUpcomingNextStep(journeyId: string, nextStepId: string) {
    return update((state) => {
      const selectedStep = state.nextSteps.find(
        (nextStep) => nextStep.journeyId === journeyId && nextStep.id === nextStepId
      );
      const hasSessionReference = state.focusSessions.some(
        ({ nextStepId: referencedNextStepId }) => referencedNextStepId === selectedStep?.id
      );

      if (selectedStep?.status !== 'upcoming' || hasSessionReference) {
        return state;
      }

      const { currentSteps, upcomingSteps } = getActiveNextStepOrder(state.nextSteps, journeyId);
      const remainingNextSteps = state.nextSteps.filter(
        (nextStep) => !(nextStep.journeyId === journeyId && nextStep.id === selectedStep.id)
      );
      const remainingActiveStepIds = [
        ...currentSteps.map(({ id }) => id),
        ...upcomingSteps.filter(({ id }) => id !== selectedStep.id).map(({ id }) => id),
      ];
      const nextSteps = applyActiveNextStepOrder(
        remainingNextSteps,
        journeyId,
        remainingActiveStepIds[0] ?? null,
        remainingActiveStepIds.slice(1)
      );

      return { ...state, nextSteps: [...nextSteps] };
    });
  }

  function completeCurrentNextStep(journeyId: string, nextStepId: string, completedAt: string) {
    return update((state) => {
      const expectedCurrentStep = state.nextSteps.find(
        (nextStep) => nextStep.journeyId === journeyId && nextStep.id === nextStepId
      );
      const isActiveSessionStep = state.focusSessions.some(
        (session) =>
          session.nextStepId === expectedCurrentStep?.id &&
          (session.status === 'running' || session.status === 'paused')
      );

      if (expectedCurrentStep?.status !== 'current' || isActiveSessionStep) {
        return state;
      }

      const { currentSteps, upcomingSteps } = getActiveNextStepOrder(state.nextSteps, journeyId);
      const remainingActiveSteps = [
        ...currentSteps.filter(({ id }) => id !== expectedCurrentStep.id),
        ...upcomingSteps,
      ];
      const promotedStep = remainingActiveSteps[0] ?? null;
      const completedNextSteps = state.nextSteps.map((nextStep) =>
        nextStep.journeyId === journeyId && nextStep.id === expectedCurrentStep.id
          ? { ...nextStep, status: 'completed' as const, completedAt }
          : nextStep
      );
      const nextSteps = applyActiveNextStepOrder(
        completedNextSteps,
        journeyId,
        promotedStep?.id ?? null,
        remainingActiveSteps.slice(1).map(({ id }) => id)
      );

      return { ...state, nextSteps: [...nextSteps] };
    });
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

  function startFocusSession(
    session: FocusSession,
    activeTimer: ActiveTimer
  ): RepositorySaveResult {
    const result = load();

    if (result.status === 'unavailable') {
      return { status: 'unavailable', state: null };
    }

    if (result.status === 'error') {
      return { status: 'error', state: null, error: result.error };
    }

    const hasActiveSession = result.state.focusSessions.some(
      ({ status }) => status === 'running' || status === 'paused'
    );

    if (result.state.activeTimer !== null || hasActiveSession) {
      return { status: 'saved', state: result.state };
    }

    return save({
      ...result.state,
      focusSessions: upsertById(result.state.focusSessions, session),
      activeTimer,
      lastActiveJourneyId: session.journeyId,
    });
  }

  function pauseFocusSession(sessionId: string, pausedAt: string) {
    return update((state) => {
      const activeTimer = state.activeTimer;
      const session = state.focusSessions.find(({ id }) => id === sessionId);

      if (
        activeTimer?.sessionId !== sessionId ||
        activeTimer.status !== 'running' ||
        session?.status !== 'running'
      ) {
        return state;
      }

      const paused = pauseRunningFocusSession(session, activeTimer, pausedAt);

      return {
        ...state,
        activeTimer: paused.activeTimer,
        focusSessions: upsertById(state.focusSessions, paused.session),
      };
    });
  }

  function resumeFocusSession(sessionId: string, resumedAt: string) {
    return update((state) => {
      const activeTimer = state.activeTimer;
      const session = state.focusSessions.find(({ id }) => id === sessionId);

      if (
        activeTimer?.sessionId !== sessionId ||
        activeTimer.status !== 'paused' ||
        session?.status !== 'paused'
      ) {
        return state;
      }

      const resumed = createResumedPausedSession(session, activeTimer, resumedAt);

      return {
        ...state,
        activeTimer: resumed.activeTimer,
        focusSessions: upsertById(state.focusSessions, resumed.session),
      };
    });
  }

  function finishPausedFocusSession(sessionId: string, completedAt: string) {
    return update((state) => {
      const activeTimer = state.activeTimer;
      const session = state.focusSessions.find(({ id }) => id === sessionId);

      if (
        activeTimer?.sessionId !== sessionId ||
        activeTimer.status !== 'paused' ||
        session?.status !== 'paused' ||
        !canFinishPausedFocusSession(activeTimer)
      ) {
        return state;
      }

      const completedSession = createCompletedPausedSession(session, activeTimer, completedAt);
      return completeSessionInState(state, completedSession);
    });
  }

  function cancelFocusSession(sessionId: string, cancelledAt: string) {
    return update((state) => {
      const activeTimer = state.activeTimer;
      const session = state.focusSessions.find(({ id }) => id === sessionId);

      if (
        activeTimer?.sessionId !== sessionId ||
        activeTimer.status !== 'paused' ||
        session?.status !== 'paused'
      ) {
        return state;
      }

      return {
        ...state,
        activeTimer: null,
        focusSessions: upsertById(
          state.focusSessions,
          createCancelledPausedSession(session, cancelledAt)
        ),
      };
    });
  }

  function completeRunningFocusSession(sessionId: string, completedAt: string) {
    return update((state) => {
      const activeTimer = state.activeTimer;
      const session = state.focusSessions.find(({ id }) => id === sessionId);

      if (
        activeTimer?.sessionId !== sessionId ||
        activeTimer.status !== 'running' ||
        session?.status !== 'running' ||
        getRemainingSeconds(activeTimer.targetEndAt, new Date(completedAt).getTime()) > 0
      ) {
        return state;
      }

      const completedSession = createCompletedRunningSession(session, activeTimer, completedAt);
      return completeSessionInState(state, completedSession);
    });
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

  function finishOnboarding(journey: Journey, firstNextStep: NextStep, firstMilestone: Milestone) {
    return update((state) => ({
      ...state,
      journeys: upsertById(state.journeys, journey),
      nextSteps: upsertById(state.nextSteps, firstNextStep),
      milestones: upsertById(state.milestones, firstMilestone),
      onboardingDraft: null,
      lastActiveJourneyId: journey.id,
    }));
  }

  function completeSession(session: FocusSession, earnedMilestones: readonly Milestone[] = []) {
    return update((state) => completeSessionInState(state, session, earnedMilestones));
  }

  function addManualFocusSession(session: FocusSession) {
    return update((state) => {
      const nextStep =
        session.nextStepId === null
          ? null
          : state.nextSteps.find(
              (candidate) =>
                candidate.id === session.nextStepId && candidate.journeyId === session.journeyId
            );
      const canAdd =
        session.source === 'manual' &&
        session.status === 'completed' &&
        session.endedAt !== null &&
        Number.isFinite(session.focusedMinutes) &&
        session.focusedMinutes >= MINIMUM_FOCUSED_MINUTES &&
        state.journeys.some(({ id }) => id === session.journeyId) &&
        nextStep !== null &&
        !state.focusSessions.some(({ id }) => id === session.id);

      return canAdd ? completeSessionInState(state, session) : state;
    });
  }

  function updateSessionReflection(sessionId: string, reflection: string) {
    return update((state) => {
      const session = state.focusSessions.find(({ id }) => id === sessionId);

      if (session?.status !== 'completed' || reflection.length > SESSION_REFLECTION_MAX_LENGTH) {
        return state;
      }

      return {
        ...state,
        focusSessions: upsertById(state.focusSessions, { ...session, reflection }),
      };
    });
  }

  return {
    load,
    save,
    importState,
    update,
    reset,
    subscribe,
    saveOnboardingDraft,
    upsertJourney,
    renameJourney,
    deleteJourney,
    upsertNextStep,
    renameNextStep,
    addNextStep,
    reorderUpcomingNextSteps,
    makeNextStepCurrent,
    completeUpcomingNextStep,
    deleteUpcomingNextStep,
    completeCurrentNextStep,
    upsertFocusSession,
    setActiveTimer,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    finishPausedFocusSession,
    cancelFocusSession,
    completeRunningFocusSession,
    upsertMilestone,
    setWeeklyGoal,
    finishOnboarding,
    completeSession,
    addManualFocusSession,
    updateSessionReflection,
  };
}

export const appRepository = createLocalStorageRepository();
