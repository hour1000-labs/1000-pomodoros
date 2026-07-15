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

describe('Timer Setup', () => {
  it('renders the distraction-free ready state with the latest Journey and 25 minutes selected', async () => {
    await renderFocus(createSeedAppState());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Start with one focused session.' })
    ).toBeTruthy();
    expect(screen.getAllByText('Learn guitar').length).toBeGreaterThan(0);
    expect(screen.getByText('Practice the F chord transition')).toBeTruthy();
    expect((screen.getByRole('radio', { name: /25/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/25 focused minutes fills one pomodoro block/i)).toBeTruthy();
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
        'Your focus session could not be started. Nothing was recorded. Try again.'
      )
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Start focus session' }).hasAttribute('disabled')
    ).toBe(false);
    expect(readSavedState().activeTimer).toBeNull();
  });

  it('restores a paused active session instead of showing setup', async () => {
    const state = createSeedAppState();
    const session: FocusSession = {
      id: 'session-paused',
      journeyId: 'journey-learn-guitar',
      nextStepId: 'next-step-f-chord',
      plannedMinutes: 25,
      focusedMinutes: 0,
      status: 'paused',
      source: 'timer',
      startedAt: '2026-07-15T18:00:00.000Z',
      endedAt: null,
      reflection: '',
    };
    state.focusSessions.push(session);
    state.activeTimer = {
      sessionId: session.id,
      status: 'paused',
      remainingSeconds: 1_125,
      accumulatedFocusedSeconds: 375,
      targetEndAt: null,
      pausedAt: '2026-07-15T18:06:15.000Z',
    };

    await renderFocus(state);

    expect(await screen.findByRole('heading', { name: '18:45' })).toBeTruthy();
    expect(screen.getByText('Paused')).toBeTruthy();
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
