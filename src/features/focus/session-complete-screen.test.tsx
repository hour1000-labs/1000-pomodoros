// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, FocusSession, Milestone } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';
import { validateSessionCompleteSearch } from '@/routes/focus/complete';

import { formatPomodoroCount, resolveSessionCompletion } from './session-complete-screen';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function addCompletedSession(
  state: AppState,
  {
    focusedMinutes = 25,
    id = 'session-just-completed',
  }: { focusedMinutes?: number; id?: string } = {}
) {
  const session: FocusSession = {
    id,
    journeyId: 'journey-learn-guitar',
    nextStepId: 'next-step-f-chord',
    plannedMinutes: focusedMinutes,
    focusedMinutes,
    status: 'completed',
    source: 'timer',
    startedAt: '2026-07-16T18:00:00.000Z',
    endedAt: '2026-07-16T18:25:00.000Z',
    reflection: '',
  };

  state.focusSessions.push(session);
  state.lastCompletedSessionId = session.id;
  return session;
}

async function renderComplete(state: AppState, initialEntry = '/focus/complete') {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: [initialEntry] }) });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

function readSavedState() {
  const saved = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!saved) throw new Error('Expected saved app state');
  return JSON.parse(saved) as AppState;
}

describe('Session Complete', () => {
  it('validates a non-empty session ID search parameter', () => {
    expect(validateSessionCompleteSearch({ sessionId: ' session-1 ' })).toEqual({
      sessionId: 'session-1',
    });
    expect(validateSessionCompleteSearch({ sessionId: '   ' })).toEqual({
      sessionId: undefined,
    });
    expect(validateSessionCompleteSearch({ sessionId: 42 })).toEqual({
      sessionId: undefined,
    });
  });

  it('resolves the requested completed session or falls back to the latest valid one', () => {
    const state = createSeedAppState();
    const completedSession = addCompletedSession(state, { focusedMinutes: 7.5 });

    const requested = resolveSessionCompletion(state, completedSession.id);
    const fallback = resolveSessionCompletion(state, 'missing-session');

    expect(requested?.session.id).toBe(completedSession.id);
    expect(fallback?.session.id).toBe(completedSession.id);
    expect(requested?.earnedPomodoros).toBe(0.3);
    expect(requested?.highlightedIndexes).toEqual([43]);
    expect(formatPomodoroCount(requested?.earnedPomodoros ?? 0)).toBe('0.3');
  });

  it('keeps an older completion attributed to its own Pomodoros and milestones', async () => {
    const state = createSeedAppState();
    const requestedSession = addCompletedSession(state);
    const laterSession: FocusSession = {
      ...requestedSession,
      id: 'session-completed-later',
      startedAt: '2026-07-16T18:30:00.000Z',
      endedAt: '2026-07-16T18:55:00.000Z',
    };
    const milestoneEarnedLater: Milestone = {
      id: 'milestone-earned-later',
      journeyId: requestedSession.journeyId,
      name: '45 pomodoros',
      targetFocusedMinutes: 1_125,
      earnedAt: laterSession.endedAt,
    };
    state.focusSessions.push(laterSession);
    state.milestones.push(milestoneEarnedLater);
    state.lastCompletedSessionId = laterSession.id;

    const context = resolveSessionCompletion(state, requestedSession.id);

    expect(context?.totalPomodoros).toBe(45);
    expect(context?.highlightedIndexes).toEqual([43]);
    expect(context?.crossedMilestone).toBeNull();

    await renderComplete(state, `/focus/complete?sessionId=${requestedSession.id}`);

    expect(await screen.findByRole('link', { name: /View progress/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /View milestone/ })).toBeNull();
    expect(screen.getByRole('img', { name: 'Pomodoro 44: complete, newly earned' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: /Pomodoro 45:.*newly earned/ })).toBeNull();
  });

  it('renders real multi-pomodoro credit and identifies every newly earned Pomodoro', async () => {
    const state = createSeedAppState();
    const session = addCompletedSession(state, { focusedMinutes: 50 });

    await renderComplete(state, `/focus/complete?sessionId=${session.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: '2 pomodoros complete.' })
    ).toBeTruthy();
    expect(screen.getByText('50 focused minutes')).toBeTruthy();
    expect(screen.getByText('Practice the F chord transition')).toBeTruthy();
    expect(screen.getByText(/45 of .* Pomodoros/)).toBeTruthy();
    expect(screen.getByText('2 newly earned Pomodoros are outlined.')).toBeTruthy();
    expect(screen.queryByText(/newly earned blocks?/i)).toBeNull();
    expect(screen.getByRole('img', { name: 'Pomodoro 44: complete, newly earned' })).toHaveProperty(
      'dataset.newlyEarned',
      'true'
    );
    expect(screen.getByRole('img', { name: 'Pomodoro 45: complete, newly earned' })).toHaveProperty(
      'dataset.newlyEarned',
      'true'
    );
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('link', { name: /View progress/ }).getAttribute('href')).toBe(
      '/journeys/journey-learn-guitar'
    );
  });

  it('preserves fractional progress and pluralizes partial credit correctly', async () => {
    const state = createSeedAppState();
    const session = addCompletedSession(state, { focusedMinutes: 7.5 });

    await renderComplete(state, `/focus/complete?sessionId=${session.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: '0.3 pomodoros complete.' })
    ).toBeTruthy();
    expect(
      screen.getByRole('img', {
        name: 'Pomodoro 44: partial, 30% filled, newly earned',
      })
    ).toBeTruthy();
  });

  it('keeps every affected Pomodoro visible when a session crosses a 100-Pomodoro boundary', async () => {
    const state = createSeedAppState();
    state.focusSessions = Array.from(
      { length: 99 },
      (_, index): FocusSession => ({
        id: `session-before-boundary-${index}`,
        journeyId: 'journey-learn-guitar',
        nextStepId: 'next-step-f-chord',
        plannedMinutes: 25,
        focusedMinutes: 25,
        status: 'completed',
        source: 'timer',
        startedAt: '2026-07-15T18:00:00.000Z',
        endedAt: '2026-07-15T18:25:00.000Z',
        reflection: '',
      })
    );
    state.milestones = state.milestones.map((milestone) =>
      milestone.targetFocusedMinutes <= 2_475 && milestone.earnedAt === null
        ? { ...milestone, earnedAt: '2026-07-15T18:25:00.000Z' }
        : milestone
    );
    const session = addCompletedSession(state, {
      id: 'session-crossing-100-block-boundary',
      focusedMinutes: 50,
    });

    const context = resolveSessionCompletion(state, session.id);

    expect(context?.highlightedIndexes).toEqual([99, 100]);
    expect(context?.gridStartIndex).toBeLessThanOrEqual(99);
    expect((context?.gridStartIndex ?? 0) + (context?.gridRenderLimit ?? 0)).toBeGreaterThan(100);

    await renderComplete(state, `/focus/complete?sessionId=${session.id}`);

    expect(
      await screen.findByRole('img', { name: 'Pomodoro 100: complete, newly earned' })
    ).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Pomodoro 101: complete, newly earned' })).toBeTruthy();
  });

  it('redirects safely when neither the requested nor latest session context is valid', async () => {
    const emptyState = createSeedAppState();
    emptyState.focusSessions = [];
    emptyState.lastCompletedSessionId = null;
    const emptyRouter = await renderComplete(emptyState, '/focus/complete?sessionId=missing');

    await waitFor(() => expect(emptyRouter.state.location.pathname).toBe('/home'));
    cleanup();

    const missingStepState = createSeedAppState();
    const session = addCompletedSession(missingStepState);
    missingStepState.nextSteps = [];
    const missingStepRouter = await renderComplete(
      missingStepState,
      `/focus/complete?sessionId=${session.id}`
    );

    await waitFor(() => expect(missingStepRouter.state.location.pathname).toBe('/home'));
  });

  it('keeps reflection collapsed initially and persists up to 280 characters independently', async () => {
    const state = createSeedAppState();
    const session = addCompletedSession(state);
    await renderComplete(state, `/focus/complete?sessionId=${session.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: '1 pomodoro complete.' })
    ).toBeTruthy();

    const reflectionToggle = screen.getByRole('button', {
      name: /Add a short reflection/,
    });
    expect(reflectionToggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('textbox', { name: 'What did you accomplish?' })).toBeNull();

    fireEvent.click(reflectionToggle);
    const reflection = screen.getByRole('textbox', { name: 'What did you accomplish?' });
    const value = 'x'.repeat(280);
    expect(reflection.getAttribute('maxlength')).toBe('280');
    fireEvent.change(reflection, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save reflection' }));

    expect(await screen.findByText('Reflection saved.')).toBeTruthy();
    const savedSession = readSavedState().focusSessions.find(({ id }) => id === session.id);
    expect(savedSession).toMatchObject({
      focusedMinutes: 25,
      reflection: value,
      status: 'completed',
    });
  });

  it('routes the primary action to a crossed milestone and preserves restart selections', async () => {
    const state = createSeedAppState();
    const session = addCompletedSession(state);
    const crossedMilestone: Milestone = {
      id: 'milestone-learn-guitar-1100-minutes',
      journeyId: session.journeyId,
      name: '1,100 focused minutes',
      targetFocusedMinutes: 1_100,
      earnedAt: session.endedAt,
    };
    state.milestones.push(crossedMilestone);

    await renderComplete(state, `/focus/complete?sessionId=${session.id}`);

    expect((await screen.findByRole('link', { name: /View milestone/ })).getAttribute('href')).toBe(
      `/milestones/${crossedMilestone.id}`
    );
    const restartHref = screen
      .getByRole('link', { name: /Start another pomodoro/ })
      .getAttribute('href');
    expect(restartHref).toContain('/focus');
    expect(restartHref).toContain('journeyId=journey-learn-guitar');
    expect(restartHref).toContain('nextStepId=next-step-f-chord');
  });
});
