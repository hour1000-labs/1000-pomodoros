// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, FocusSession, Journey, NextStep } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository } from '@/lib/repository';
import { getRouter } from '@/router';

import {
  createFocusSessionRecords,
  getCustomDurationError,
  resolveFocusSelection,
  SelectionDialog,
} from './focus-session-screen';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.localStorage.clear();
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
  Object.defineProperty(Element.prototype, 'requestFullscreen', {
    configurable: true,
    value: undefined,
  });
});

async function renderFocus(state: AppState, initialEntry = '/focus') {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

function readSavedState() {
  const savedState = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!savedState) throw new Error('Expected app state to be saved');

  return JSON.parse(savedState) as AppState;
}

function createSecondJourney() {
  const journey: Journey = {
    id: 'journey-write-book',
    name: 'Write a book',
    reason: 'Finish a meaningful manuscript.',
    targetMinutes: 60_000,
    status: 'active',
    createdAt: '2026-07-15T18:00:00.000Z',
    updatedAt: '2026-07-15T18:00:00.000Z',
    lastActiveAt: '2026-07-15T18:00:00.000Z',
  };
  const currentNextStep: NextStep = {
    id: 'next-step-outline-chapter',
    journeyId: journey.id,
    title: 'Outline the first chapter',
    description: '',
    status: 'current',
    position: 0,
    createdAt: journey.createdAt,
    completedAt: null,
  };
  const upcomingNextStep: NextStep = {
    ...currentNextStep,
    id: 'next-step-draft-opening',
    title: 'Draft the opening scene',
    status: 'upcoming',
    position: 1,
  };

  return { journey, currentNextStep, upcomingNextStep };
}

function createRunningState({
  accumulatedFocusedSeconds = 0,
  remainingSeconds = 1_500,
  targetEndAt = new Date(Date.now() + remainingSeconds * 1_000).toISOString(),
}: {
  accumulatedFocusedSeconds?: number;
  remainingSeconds?: number;
  targetEndAt?: string;
} = {}) {
  const state = createSeedAppState();
  const session: FocusSession = {
    id: 'session-running',
    journeyId: 'journey-learn-guitar',
    nextStepId: 'next-step-f-chord',
    plannedMinutes: 25,
    focusedMinutes: 0,
    status: 'running',
    source: 'timer',
    startedAt: new Date(Date.now() - accumulatedFocusedSeconds * 1_000).toISOString(),
    endedAt: null,
    reflection: '',
  };
  state.focusSessions.push(session);
  state.activeTimer = {
    sessionId: session.id,
    status: 'running',
    remainingSeconds,
    accumulatedFocusedSeconds,
    targetEndAt,
    pausedAt: null,
  };

  return state;
}

function createPausedState({
  accumulatedFocusedSeconds = 375,
  remainingSeconds = 1_125,
}: {
  accumulatedFocusedSeconds?: number;
  remainingSeconds?: number;
} = {}) {
  const state = createRunningState({ accumulatedFocusedSeconds, remainingSeconds });
  const session = state.focusSessions.find(({ id }) => id === 'session-running');
  if (!session || !state.activeTimer) throw new Error('Expected active focus session');

  session.status = 'paused';
  state.activeTimer = {
    ...state.activeTimer,
    status: 'paused',
    targetEndAt: null,
    pausedAt: new Date().toISOString(),
  };

  return state;
}

describe('Timer Setup', () => {
  it('renders the distraction-free ready state with the latest Journey and 25 minutes selected', async () => {
    await renderFocus(createSeedAppState());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Start a focus session' })
    ).toBeTruthy();
    expect(screen.getAllByText('Learn guitar').length).toBeGreaterThan(0);
    expect(screen.getByText('Practice the F chord transition')).toBeTruthy();
    expect((screen.getByRole('radio', { name: /25/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/1 Pomodoro is 25 focused minutes/i)).toBeTruthy();
    expect(screen.queryByText(/pomodoro block/i)).toBeNull();
    expect(screen.getByRole('button', { name: 'Start focus session' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Change Journey' }).getAttribute('aria-haspopup')
    ).toBe('dialog');
    expect(
      screen.getByRole('button', { name: 'Change Next step' }).getAttribute('aria-haspopup')
    ).toBe('dialog');
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('prefers valid route search selections and falls back from invalid IDs', async () => {
    const state = createSeedAppState();
    const second = createSecondJourney();
    state.journeys.push(second.journey);
    state.nextSteps.push(second.currentNextStep, second.upcomingNextStep);

    expect(
      resolveFocusSelection(state, {
        journeyId: second.journey.id,
        nextStepId: second.upcomingNextStep.id,
      })
    ).toEqual({ journey: second.journey, nextStep: second.upcomingNextStep });
    expect(
      resolveFocusSelection(state, { journeyId: 'missing', nextStepId: 'missing' })?.journey.id
    ).toBe(state.lastActiveJourneyId);

    await renderFocus(
      state,
      `/focus?journeyId=${second.journey.id}&nextStepId=${second.upcomingNextStep.id}`
    );
    expect(await screen.findByText(second.upcomingNextStep.title)).toBeTruthy();
    expect(screen.getAllByText(second.journey.name).length).toBeGreaterThan(0);
  });

  it('redirects to Journey onboarding when no active Journey exists', async () => {
    const state: AppState = {
      ...createSeedAppState(),
      journeys: [],
      nextSteps: [],
      focusSessions: [],
      milestones: [],
      lastActiveJourneyId: null,
      lastCompletedSessionId: null,
    };
    const router = await renderFocus(state);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/journey');
    });
  });

  it('reveals one Custom minutes input and validates the 5-to-240 whole-minute boundary', async () => {
    expect(getCustomDurationError('5')).toBeNull();
    expect(getCustomDurationError('240')).toBeNull();
    expect(getCustomDurationError('4')).toContain('5 to 240');
    expect(getCustomDurationError('241')).toContain('5 to 240');
    expect(getCustomDurationError('5.5')).toContain('whole number');

    await renderFocus(createSeedAppState());
    fireEvent.click(await screen.findByRole('radio', { name: /Custom/ }));
    const input = screen.getByRole('spinbutton', { name: 'Minutes' });
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);

    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toContain('5 to 240');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(input, { target: { value: '5' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(screen.getByRole('img', { name: 'Pomodoro preview: 20% filled' })).toHaveProperty(
      'dataset.fillPercent',
      '20'
    );
  });

  it('persists one running session and restores the active state after repeated Start clicks', async () => {
    const startFocusSession = vi.spyOn(appRepository, 'startFocusSession');
    await renderFocus(createSeedAppState());
    const start = await screen.findByRole('button', { name: 'Start focus session' });

    fireEvent.click(start);
    fireEvent.click(start);

    expect(await screen.findByRole('heading', { name: '25:00' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start focus session' })).toBeNull();
    expect(startFocusSession).toHaveBeenCalledTimes(1);

    const state = readSavedState();
    const activeSession = state.focusSessions.find(({ id }) => id === state.activeTimer?.sessionId);
    expect(activeSession).toMatchObject({
      journeyId: 'journey-learn-guitar',
      nextStepId: 'next-step-f-chord',
      plannedMinutes: 25,
      focusedMinutes: 0,
      status: 'running',
      source: 'timer',
      endedAt: null,
    });
    expect(state.activeTimer).toMatchObject({
      status: 'running',
      remainingSeconds: 1_500,
      accumulatedFocusedSeconds: 0,
      pausedAt: null,
    });
  });

  it('keeps setup recoverable when session persistence fails', async () => {
    vi.spyOn(appRepository, 'startFocusSession').mockReturnValue({
      status: 'unavailable',
      state: null,
    });
    await renderFocus(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Start focus session' }));

    expect(
      await screen.findByText(
        "We couldn't start your focus session. Nothing was recorded. Try again."
      )
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Start focus session' }).hasAttribute('disabled')
    ).toBe(false);
    expect(readSavedState().activeTimer).toBeNull();
  });

  it('restores a paused active session instead of showing setup', async () => {
    await renderFocus(createPausedState());

    expect(await screen.findByRole('heading', { name: '18:45' })).toBeTruthy();
    expect(screen.getByText('Paused')).toBeTruthy();
    expect(screen.getByText('1000 Pomodoros')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finish early' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel session' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start focus session' })).toBeNull();
  });
});

describe('createFocusSessionRecords', () => {
  it('creates matching persisted running session and timer timestamps', () => {
    const records = createFocusSessionRecords({
      journeyId: 'journey-1',
      nextStepId: 'next-step-1',
      plannedMinutes: 50,
      sessionId: 'session-1',
      startedAt: '2026-07-15T18:00:00.000Z',
    });

    expect(records.session).toMatchObject({
      id: 'session-1',
      plannedMinutes: 50,
      status: 'running',
      startedAt: '2026-07-15T18:00:00.000Z',
    });
    expect(records.activeTimer).toEqual({
      sessionId: 'session-1',
      status: 'running',
      remainingSeconds: 3_000,
      accumulatedFocusedSeconds: 0,
      targetEndAt: '2026-07-15T18:50:00.000Z',
      pausedAt: null,
    });
  });
});

describe('Running Focus Timer', () => {
  it('renders the current Journey, Next step, timestamp-derived timer, and Pause action', async () => {
    await renderFocus(createRunningState());

    expect(await screen.findByRole('heading', { name: '25:00' })).toBeTruthy();
    expect(screen.getByText('Learn guitar')).toBeTruthy();
    expect(screen.getByText('Practice the F chord transition')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enter fullscreen' })).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByText(/analytics|streak|history/i)).toBeNull();
  });

  it('pauses from the persisted timestamp and announces the paused state', async () => {
    await renderFocus(createRunningState());

    fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));
    expect(await screen.findByText('Paused')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Focus session paused');

    const saved = readSavedState();
    expect(saved.activeTimer?.status).toBe('paused');
    expect(saved.activeTimer?.targetEndAt).toBeNull();
    expect(saved.focusSessions.find(({ id }) => id === 'session-running')?.status).toBe('paused');
  });

  it('keeps the timer running and reports an error when Pause cannot be persisted', async () => {
    vi.spyOn(appRepository, 'pauseFocusSession').mockReturnValue({
      status: 'unavailable',
      state: null,
    });
    await renderFocus(createRunningState());

    fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      "We couldn't pause the timer. It is still running. Try again."
    );
    expect(readSavedState().activeTimer?.status).toBe('running');
  });

  it('announces a resumed running session without announcing every second', async () => {
    await renderFocus(
      createRunningState({ accumulatedFocusedSeconds: 375, remainingSeconds: 1_125 })
    );

    expect((await screen.findByRole('status')).textContent).toContain('Focus session resumed.');
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('announces the five- and one-minute boundaries once after delayed refreshes', async () => {
    const baseTime = Date.now();
    const now = vi.spyOn(Date, 'now').mockReturnValue(baseTime);
    await renderFocus(
      createRunningState({ targetEndAt: new Date(baseTime + 301_000).toISOString() })
    );
    const status = await screen.findByRole('status');

    now.mockReturnValue(baseTime + 1_000);
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(() => expect(status.textContent).toContain('5 minutes remaining.'));

    now.mockReturnValue(baseTime + 2_000);
    fireEvent(document, new Event('visibilitychange'));
    expect(status.textContent).toContain('5 minutes remaining.');

    now.mockReturnValue(baseTime + 241_000);
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(() => expect(status.textContent).toContain('1 minute remaining.'));
  });

  it('blocks navigation with explanatory confirmation and keeps the timer running after leave', async () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    const router = await renderFocus(createRunningState());
    await screen.findByRole('heading', { name: '25:00' });

    void router.navigate({ to: '/home' });
    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining('timer will keep running'));
      expect(router.state.location.pathname).toBe('/focus');
    });

    confirm.mockReturnValue(true);
    void router.navigate({ to: '/home' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/home'));
    expect(readSavedState().activeTimer?.status).toBe('running');
  });

  it('shows and operates the fullscreen control only when the API is available', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    await renderFocus(createRunningState());
    fireEvent.click(await screen.findByRole('button', { name: 'Enter fullscreen' }));

    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledTimes(1));
  });

  it('finalizes an elapsed timer once and routes to completion', async () => {
    const complete = vi.spyOn(appRepository, 'completeRunningFocusSession');
    const router = await renderFocus(
      createRunningState({ targetEndAt: new Date(Date.now() - 1_000).toISOString() })
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/focus/complete'));
    expect(router.state.location.search).toEqual({ sessionId: 'session-running' });
    expect(complete).toHaveBeenCalledTimes(1);
    const saved = readSavedState();
    expect(saved.activeTimer).toBeNull();
    expect(saved.focusSessions.find(({ id }) => id === 'session-running')).toMatchObject({
      status: 'completed',
      focusedMinutes: 25,
    });
  });

  it('stays on the running screen when elapsed-session completion cannot be persisted', async () => {
    vi.spyOn(appRepository, 'completeRunningFocusSession').mockReturnValue({
      status: 'unavailable',
      state: null,
    });
    const router = await renderFocus(
      createRunningState({ targetEndAt: new Date(Date.now() - 1_000).toISOString() })
    );

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      "We couldn't save this completed session. Keep this screen open and try again."
    );
    expect(router.state.location.pathname).toBe('/focus');
    expect(readSavedState().activeTimer?.status).toBe('running');
  });
});

describe('Paused Focus Timer', () => {
  it('resumes from persisted time once and returns to the running timer', async () => {
    const resume = vi.spyOn(appRepository, 'resumeFocusSession');
    await renderFocus(createPausedState());

    const button = await screen.findByRole('button', { name: 'Resume' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(await screen.findByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(resume).toHaveBeenCalledTimes(1);
    const saved = readSavedState();
    expect(saved.activeTimer).toMatchObject({
      status: 'running',
      remainingSeconds: 1_125,
      accumulatedFocusedSeconds: 375,
      pausedAt: null,
    });
    expect(saved.focusSessions.find(({ id }) => id === 'session-running')?.status).toBe('running');
  });

  it('disables Finish early and explains the five-minute threshold before eligibility', async () => {
    await renderFocus(
      createPausedState({ accumulatedFocusedSeconds: 299, remainingSeconds: 1_201 })
    );

    const finish = await screen.findByRole('button', { name: 'Finish early' });
    expect(finish.hasAttribute('disabled')).toBe(true);
    expect(finish.getAttribute('aria-describedby')).toBe('finish-early-guidance');
    expect(
      screen.getByText('Finish early becomes available after 5 focused minutes.')
    ).toBeTruthy();
  });

  it('finishes an eligible partial session once and routes to completion', async () => {
    const finish = vi.spyOn(appRepository, 'finishPausedFocusSession');
    const router = await renderFocus(createPausedState());

    fireEvent.click(await screen.findByRole('button', { name: 'Finish early' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/focus/complete'));
    expect(router.state.location.search).toEqual({ sessionId: 'session-running' });
    expect(finish).toHaveBeenCalledTimes(1);
    const saved = readSavedState();
    expect(saved.activeTimer).toBeNull();
    expect(saved.lastCompletedSessionId).toBe('session-running');
    expect(saved.focusSessions.find(({ id }) => id === 'session-running')).toMatchObject({
      status: 'completed',
      focusedMinutes: 6.25,
    });
  });

  it('dismisses cancellation unchanged, then confirms once without progress', async () => {
    const cancel = vi.spyOn(appRepository, 'cancelFocusSession');
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    const state = createPausedState();
    const previousLastCompletedSessionId = state.lastCompletedSessionId;
    await renderFocus(state);

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel session' }));
    expect(confirm).toHaveBeenCalledWith(
      'Cancel this focus session? This discards its focused time and adds no Journey progress.'
    );
    expect(cancel).not.toHaveBeenCalled();
    expect(readSavedState().activeTimer?.status).toBe('paused');

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel session' }));
    expect(await screen.findByRole('heading', { name: 'Start a focus session' })).toBeTruthy();
    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'Focus session cancelled. No progress was added.'
    );
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: 'Start a focus session' })
      );
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    const saved = readSavedState();
    expect(saved.activeTimer).toBeNull();
    expect(saved.lastCompletedSessionId).toBe(previousLastCompletedSessionId);
    expect(saved.focusSessions.find(({ id }) => id === 'session-running')).toMatchObject({
      status: 'cancelled',
      focusedMinutes: 0,
    });
  });

  it.each([
    {
      action: 'Resume',
      method: 'resumeFocusSession' as const,
      message: "We couldn't resume the timer. It is still paused. Try again.",
    },
    {
      action: 'Finish early',
      method: 'finishPausedFocusSession' as const,
      message: "We couldn't save your progress. Keep this screen open and try again.",
    },
  ])('keeps the paused state recoverable when $action persistence fails', async (testCase) => {
    vi.spyOn(appRepository, testCase.method).mockReturnValue({
      status: 'unavailable',
      state: null,
    });
    await renderFocus(createPausedState());

    fireEvent.click(await screen.findByRole('button', { name: testCase.action }));

    expect(await screen.findByRole('alert')).toHaveProperty('textContent', testCase.message);
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    expect(readSavedState().activeTimer?.status).toBe('paused');
  });

  it('keeps the paused state recoverable when Cancel persistence fails', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    vi.spyOn(appRepository, 'cancelFocusSession').mockReturnValue({
      status: 'unavailable',
      state: null,
    });
    await renderFocus(createPausedState());

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel session' }));

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      "We couldn't cancel the session. It is still paused. Try again."
    );
    expect(readSavedState().activeTimer?.status).toBe('paused');
  });
});

describe('SelectionDialog', () => {
  it('opens accessibly, closes after selection, and restores focus to its trigger', async () => {
    render(
      <SelectionDialog
        label="Change Journey"
        title="Choose a Journey"
        description="Select where this session adds progress."
      >
        {(close) => (
          <button type="button" onClick={close}>
            Learn guitar
          </button>
        )}
      </SelectionDialog>
    );
    const trigger = screen.getByRole('button', { name: 'Change Journey' });

    fireEvent.click(trigger);
    expect(
      await screen.findByRole('dialog', {
        name: 'Choose a Journey',
        description: 'Select where this session adds progress.',
      })
    ).toBeTruthy();
    const option = screen.getByRole('button', { name: 'Learn guitar' });
    await waitFor(() => expect(document.activeElement).toBe(option));

    fireEvent.click(option);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
