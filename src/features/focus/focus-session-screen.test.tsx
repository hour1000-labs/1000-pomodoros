// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as focusSound from '@/lib/focus-sound';
import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, FocusSession, Journey, NextStep } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository } from '@/lib/repository';
import { getRouter } from '@/router';

import {
  createFocusSessionRecords,
  getCustomDurationError,
  resolveFocusSelection,
  resolveRememberedDuration,
  SelectionDialog,
} from './focus-session-screen';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.localStorage.clear();
  document.title = '1000 Pomodoros';
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

function createTimerSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'session-remembered-duration',
    journeyId: 'journey-learn-guitar',
    nextStepId: 'next-step-f-chord',
    plannedMinutes: 25,
    focusedMinutes: 25,
    status: 'completed',
    source: 'timer',
    startedAt: '2026-07-15T18:00:00.000Z',
    endedAt: '2026-07-15T18:25:00.000Z',
    reflection: '',
    ...overrides,
  };
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
  it('resolves the latest valid timer duration per Journey and defaults to 25 minutes', () => {
    const state = createSeedAppState();
    state.focusSessions = [
      createTimerSession({
        id: 'session-older',
        plannedMinutes: 50,
        startedAt: '2026-07-15T18:00:00.000Z',
      }),
      createTimerSession({
        id: 'session-custom',
        plannedMinutes: 37,
        startedAt: '2026-07-15T19:00:00.000Z',
      }),
      createTimerSession({
        id: 'session-invalid',
        plannedMinutes: 241,
        startedAt: '2026-07-15T20:00:00.000Z',
      }),
      createTimerSession({
        id: 'session-manual',
        plannedMinutes: 90,
        source: 'manual',
        startedAt: '2026-07-15T21:00:00.000Z',
      }),
    ];

    expect(resolveRememberedDuration(state, 'journey-learn-guitar')).toEqual({
      choice: 'custom',
      customMinutes: '37',
    });
    expect(resolveRememberedDuration(state, 'journey-without-history')).toEqual({
      choice: '25',
      customMinutes: '',
    });
  });

  it.each([
    'running',
    'paused',
    'completed',
    'cancelled',
  ] as const)('keeps a valid timer duration remembered while the session is %s', (status) => {
    const state = createSeedAppState();

    state.focusSessions = [createTimerSession({ plannedMinutes: 37, status })];

    expect(resolveRememberedDuration(state, 'journey-learn-guitar')).toEqual({
      choice: 'custom',
      customMinutes: '37',
    });
  });

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

  it.each([
    { plannedMinutes: 25, choice: /25/, customMinutes: null },
    { plannedMinutes: 50, choice: /50/, customMinutes: null },
    { plannedMinutes: 37, choice: /Custom/, customMinutes: '37' },
  ])('restores a prior $plannedMinutes-minute timer choice for the selected Journey', async ({
    plannedMinutes,
    choice,
    customMinutes,
  }) => {
    const state = createSeedAppState(new Date('2026-07-01T00:00:00.000Z'));
    state.focusSessions.push(
      createTimerSession({
        plannedMinutes,
        startedAt: '2026-07-16T18:00:00.000Z',
      })
    );

    await renderFocus(state);

    expect((await screen.findByRole('radio', { name: choice })) as HTMLInputElement).toHaveProperty(
      'checked',
      true
    );
    if (customMinutes === null) {
      expect(screen.queryByRole('spinbutton', { name: 'Minutes' })).toBeNull();
    } else {
      expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveProperty(
        'value',
        customMinutes
      );
    }
    expect(
      screen.getByText(new RegExp(`This session adds ${plannedMinutes} focused minutes`))
    ).toBeTruthy();
  });

  it('keeps each Journey duration independent and preserves a choice when only the Next step changes', async () => {
    const state = createSeedAppState(new Date('2026-07-01T00:00:00.000Z'));
    const second = createSecondJourney();
    const firstUpcomingNextStep = state.nextSteps.find(
      ({ journeyId, status }) => journeyId === 'journey-learn-guitar' && status === 'upcoming'
    );
    if (!firstUpcomingNextStep) throw new Error('Expected an upcoming Learn guitar Next step');

    state.journeys.push(second.journey);
    state.nextSteps.push(second.currentNextStep, second.upcomingNextStep);
    state.focusSessions.push(
      createTimerSession({
        plannedMinutes: 50,
        startedAt: '2026-07-16T18:00:00.000Z',
      }),
      createTimerSession({
        id: 'session-second-custom',
        journeyId: second.journey.id,
        nextStepId: second.currentNextStep.id,
        plannedMinutes: 35,
        startedAt: '2026-07-16T18:00:00.000Z',
      })
    );

    const router = await renderFocus(state);
    fireEvent.click(await screen.findByRole('radio', { name: /Custom/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minutes' }), {
      target: { value: '40' },
    });

    await router.navigate({
      replace: true,
      to: '/focus',
      search: {
        journeyId: 'journey-learn-guitar',
        nextStepId: firstUpcomingNextStep.id,
      },
    });
    await waitFor(() => {
      expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveProperty('value', '40');
    });

    await router.navigate({
      replace: true,
      to: '/focus',
      search: {
        journeyId: second.journey.id,
        nextStepId: second.currentNextStep.id,
      },
    });
    await waitFor(() => {
      expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveProperty('value', '35');
    });

    await router.navigate({
      replace: true,
      to: '/focus',
      search: {
        journeyId: 'journey-learn-guitar',
        nextStepId: firstUpcomingNextStep.id,
      },
    });
    await waitFor(() => {
      expect((screen.getByRole('radio', { name: /50/ }) as HTMLInputElement).checked).toBe(true);
    });
  });

  it('uses the restored Custom duration for the next persisted timer session', async () => {
    const state = createSeedAppState(new Date('2026-07-01T00:00:00.000Z'));
    state.focusSessions.push(
      createTimerSession({
        plannedMinutes: 37,
        startedAt: '2026-07-16T18:00:00.000Z',
      })
    );

    await renderFocus(state);
    fireEvent.click(await screen.findByRole('button', { name: 'Start focus session' }));

    expect(await screen.findByRole('heading', { name: '37:00' })).toBeTruthy();
    const saved = readSavedState();
    const activeSession = saved.focusSessions.find(({ id }) => id === saved.activeTimer?.sessionId);
    expect(activeSession).toMatchObject({
      plannedMinutes: 37,
      journeyId: 'journey-learn-guitar',
      source: 'timer',
      status: 'running',
    });
  });

  it('restores the remembered duration when focus setup is revisited', async () => {
    const state = createSeedAppState(new Date('2026-07-01T00:00:00.000Z'));
    state.focusSessions.push(
      createTimerSession({
        plannedMinutes: 50,
        startedAt: '2026-07-16T18:00:00.000Z',
      })
    );

    await renderFocus(state);
    expect((await screen.findByRole('radio', { name: /50/ })) as HTMLInputElement).toHaveProperty(
      'checked',
      true
    );

    cleanup();
    await renderFocus(readSavedState());
    expect((await screen.findByRole('radio', { name: /50/ })) as HTMLInputElement).toHaveProperty(
      'checked',
      true
    );
  });

  it('does not replace the remembered duration when a new start fails to persist', async () => {
    const state = createSeedAppState(new Date('2026-07-01T00:00:00.000Z'));
    state.focusSessions.push(
      createTimerSession({
        id: 'session-remembered-50',
        plannedMinutes: 50,
        startedAt: '2026-07-16T18:00:00.000Z',
      })
    );
    vi.spyOn(appRepository, 'startFocusSession').mockReturnValue({
      status: 'unavailable',
      state: null,
    });

    await renderFocus(state);
    fireEvent.click(await screen.findByRole('radio', { name: /Custom/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minutes' }), {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start focus session' }));

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      "We couldn't start your focus session. Nothing was recorded. Try again."
    );
    expect(resolveRememberedDuration(readSavedState(), 'journey-learn-guitar')).toEqual({
      choice: '50',
      customMinutes: '',
    });
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
    expect(document.title).toBe('18:45 — 1000 Pomodoros');
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

  it('keeps the browser tab title aligned through running, pause, resume, and visibility catch-up', async () => {
    const baseTime = Date.now();
    const now = vi.spyOn(Date, 'now').mockReturnValue(baseTime);
    await renderFocus(
      createRunningState({
        remainingSeconds: 125,
        targetEndAt: new Date(baseTime + 125_000).toISOString(),
      })
    );

    expect(document.title).toBe('02:05 — 1000 Pomodoros');

    now.mockReturnValue(baseTime + 1_000);
    fireEvent(document, new Event('visibilitychange'));
    await waitFor(() => expect(document.title).toBe('02:04 — 1000 Pomodoros'));

    fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));
    const pausedHeading = await screen.findByRole('heading', { name: /^\d{2}:\d{2}$/ });
    expect(document.title).toBe(`${pausedHeading.textContent} — 1000 Pomodoros`);

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await screen.findByRole('button', { name: 'Pause' });
    expect(document.title).toMatch(/^\d{2}:\d{2} — 1000 Pomodoros$/);
  });

  it('toggles completion sound accessibly and keeps the choice across pause and resume', async () => {
    await renderFocus(createRunningState());

    const mute = await screen.findByRole('button', { name: 'Mute completion sound' });
    expect(mute.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(mute);

    expect(
      screen.getByRole('button', { name: 'Unmute completion sound' }).getAttribute('aria-pressed')
    ).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await screen.findByText('Paused');
    expect(screen.getByRole('button', { name: 'Unmute completion sound' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await screen.findByRole('button', { name: 'Pause' });
    expect(screen.getByRole('button', { name: 'Unmute completion sound' })).toBeTruthy();
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
    expect(document.title).toBe('1000 Pomodoros');
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
    const playSound = vi.spyOn(focusSound, 'playFocusCompletionSound').mockResolvedValue();
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
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(document.title).toBe('1000 Pomodoros');
  });

  it('does not play a muted completion sound', async () => {
    const baseTime = Date.now();
    const now = vi.spyOn(Date, 'now').mockReturnValue(baseTime);
    const playSound = vi.spyOn(focusSound, 'playFocusCompletionSound').mockResolvedValue();
    const router = await renderFocus(
      createRunningState({
        remainingSeconds: 1,
        targetEndAt: new Date(baseTime + 1_000).toISOString(),
      })
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Mute completion sound' }));
    now.mockReturnValue(baseTime + 2_000);
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/focus/complete'));
    expect(playSound).not.toHaveBeenCalled();
  });

  it('keeps completion working when browser playback is rejected', async () => {
    const playSound = vi
      .spyOn(focusSound, 'playFocusCompletionSound')
      .mockRejectedValue(new Error('audio blocked'));
    const router = await renderFocus(
      createRunningState({ targetEndAt: new Date(Date.now() - 1_000).toISOString() })
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/focus/complete'));
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('stays on the running screen when elapsed-session completion cannot be persisted', async () => {
    const playSound = vi.spyOn(focusSound, 'playFocusCompletionSound').mockResolvedValue();
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
    expect(playSound).not.toHaveBeenCalled();
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
    const playSound = vi.spyOn(focusSound, 'playFocusCompletionSound').mockResolvedValue();
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
    expect(playSound).not.toHaveBeenCalled();
  });

  it('dismisses cancellation unchanged, then confirms once without progress', async () => {
    const playSound = vi.spyOn(focusSound, 'playFocusCompletionSound').mockResolvedValue();
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
    expect(playSound).not.toHaveBeenCalled();
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
