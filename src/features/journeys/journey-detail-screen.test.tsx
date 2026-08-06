// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSeedAppState,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { AppState, FocusSession, Journey, NextStep } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository, RepositoryError } from '@/lib/repository';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.localStorage.clear();
});

async function renderJourney(state: AppState, journeyId = LEARN_GUITAR_JOURNEY_ID) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [`/journeys/${journeyId}`] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

function readSavedState() {
  const value = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!value) throw new Error('Expected app state to be saved');
  return JSON.parse(value) as AppState;
}

function createSecondJourneyState() {
  const state = createSeedAppState();
  const journey: Journey = {
    id: 'journey-write-book',
    name: 'Write a book',
    reason: 'Finish a manuscript I am proud to share.',
    targetMinutes: 1_000 * 60,
    status: 'active',
    createdAt: '2026-07-16T18:00:00.000Z',
    updatedAt: '2026-07-16T18:00:00.000Z',
    lastActiveAt: '2026-07-16T18:00:00.000Z',
  };
  const nextStep: NextStep = {
    id: 'next-step-outline-chapter',
    journeyId: journey.id,
    title: 'Outline the first chapter',
    description: '',
    status: 'current',
    position: 0,
    createdAt: journey.createdAt,
    completedAt: null,
  };

  state.journeys.push(journey);
  state.nextSteps.push(nextStep);

  return { state, journey, nextStep };
}

describe('JourneyDetailScreen', () => {
  it('shows the Journey layout loading state while persisted data is unavailable', async () => {
    vi.spyOn(appRepository, 'load').mockReturnValue({
      status: 'unavailable',
      state: null,
      seeded: false,
    });

    await renderJourney(createSeedAppState());

    expect(screen.getByLabelText('Loading saved progress')).toBeTruthy();
  });

  it('shows a recoverable load error and retries without resetting saved progress', async () => {
    const originalLoad = appRepository.load;
    const load = vi
      .spyOn(appRepository, 'load')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        seeded: false,
        error: new RepositoryError('storage-read-failed', 'Simulated read failure'),
      })
      .mockImplementation(originalLoad);

    await renderJourney(createSeedAppState());

    expect(
      await screen.findByRole('heading', { name: 'We could not load your saved progress' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset saved progress' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('renders the seeded metrics, current section, and a bounded progressive full view', async () => {
    await renderJourney(createSeedAppState());

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: '1000 Pomodoros' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Journey' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Journeys' })).toBeNull();
    expect(screen.getByText('17 hours 55 minutes')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '43 Pomodoros' })).toBeTruthy();
    expect(screen.getByText('72% · 17 pomodoros remaining')).toBeTruthy();
    expect(screen.getByText('25 focused hours')).toBeTruthy();
    const legend = screen.getByRole('list', { name: 'Pomodoro grid legend' });
    expect(within(legend).getByText('Complete')).toBeTruthy();
    expect(within(legend).getByText('Partial')).toBeTruthy();
    expect(within(legend).getByText('Future')).toBeTruthy();
    expect(within(legend).getByText('Latest')).toBeTruthy();
    expect(within(legend).getByText('Milestone')).toBeTruthy();
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(100);

    fireEvent.click(screen.getByRole('button', { name: 'View full Journey' }));

    expect(screen.getByText('3 of 24 sections')).toBeTruthy();
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(300);
    expect(screen.queryByLabelText('Pomodoro 301: future')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more sections' }));
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(600);
  });

  it('keeps a later current-progress section visible when full Journey opens', async () => {
    const state = createSeedAppState();
    state.focusSessions = [
      {
        id: 'session-later-section',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
        plannedMinutes: 410 * 25,
        focusedMinutes: 410 * 25,
        status: 'completed',
        source: 'manual',
        startedAt: '2026-07-16T17:00:00.000Z',
        endedAt: '2026-07-16T18:00:00.000Z',
        reflection: '',
      },
    ];
    await renderJourney(state);

    expect(document.querySelector('[data-pomodoro-index="400"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'View full Journey' }));

    expect(screen.getByText('4 of 24 sections')).toBeTruthy();
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(400);
    expect(document.querySelector('[data-pomodoro-index="400"]')).not.toBeNull();
    expect(document.querySelector('[data-pomodoro-index="300"]')).toBeNull();
  });

  it('uses typed focus search parameters even when another Journey is most recent', async () => {
    const { state, journey, nextStep } = createSecondJourneyState();
    await renderJourney(state, journey.id);

    const startLinks = await screen.findAllByRole('link', {
      name: `Start 25:00 for ${nextStep.title}`,
    });

    expect(startLinks).toHaveLength(2);
    for (const link of startLinks) {
      const url = new URL(link.getAttribute('href') ?? '', 'http://localhost');
      expect(url.pathname).toBe('/focus');
      expect(url.searchParams.get('journeyId')).toBe(journey.id);
      expect(url.searchParams.get('nextStepId')).toBe(nextStep.id);
    }
  });

  it('opens Pomodoro details from inspectable progress', async () => {
    await renderJourney(createSeedAppState());

    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the first pomodoro to be inspectable');
    expect(block.getAttribute('aria-label')).toMatch(/^Pomodoro 1: complete/);
    expect(block.getAttribute('aria-haspopup')).toBe('dialog');
    expect(block.getAttribute('aria-controls')).toBe('journey-block-detail-dialog');
    block.focus();
    fireEvent.click(block);

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) throw new Error('Expected the block detail dialog to open');
    expect(block.getAttribute('aria-expanded')).toBe('true');
    expect(dialog?.textContent).toContain('Pomodoro 1');
    expect(dialog?.textContent).toContain('Practice the F chord transition');
    expect(dialog?.textContent).toContain('Timer');

    const closeButton = dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]');
    if (!closeButton) throw new Error('Expected the block detail dialog to have a close button');
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(document.activeElement).toBe(block);
    expect(block.getAttribute('aria-expanded')).toBe('false');
  });

  it('lists every contributor when timer and manual sessions share one Pomodoro', async () => {
    const state = createSeedAppState();
    const timerSession: FocusSession = {
      id: 'session-timer-partial',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      plannedMinutes: 10,
      focusedMinutes: 10,
      status: 'completed',
      source: 'timer',
      startedAt: '2026-07-16T17:50:00.000Z',
      endedAt: '2026-07-16T18:00:00.000Z',
      reflection: '',
    };
    const manualSession: FocusSession = {
      ...timerSession,
      id: 'session-manual-partial',
      plannedMinutes: 15,
      focusedMinutes: 15,
      source: 'manual',
      startedAt: '2026-07-16T18:05:00.000Z',
      endedAt: '2026-07-16T18:20:00.000Z',
    };
    state.focusSessions = [manualSession, timerSession];

    await renderJourney(state);
    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the shared pomodoro to be inspectable');
    fireEvent.click(block);

    const dialog = await screen.findByRole('dialog', { name: 'Pomodoro 1' });
    expect(within(dialog).getByText('2 Focus sessions added time to this Pomodoro.')).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/\bblock\b/i);
    expect(within(dialog).getByText('Timer')).toBeTruthy();
    expect(within(dialog).getByText('Added manually')).toBeTruthy();
    expect(within(dialog).getAllByText('Practice the F chord transition')).toHaveLength(2);
  });

  it('adds an upcoming Next step and persists it once', async () => {
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Add Next step' }));
    fireEvent.change(screen.getByLabelText('Next step'), {
      target: { value: 'Review chord transitions' },
    });
    const dialog = screen.getByRole('dialog', { name: 'Add a Next step' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Next step' }));

    await waitFor(() => {
      const matchingSteps = readSavedState().nextSteps.filter(
        ({ title }) => title === 'Review chord transitions'
      );
      expect(matchingSteps).toHaveLength(1);
      expect(matchingSteps[0]?.status).toBe('upcoming');
    });
    expect(await screen.findByText('Review chord transitions')).toBeTruthy();
  });

  it('keeps an unsaved Next step available and retries with the same identity', async () => {
    const originalAddNextStep = appRepository.addNextStep;
    const addNextStep = vi
      .spyOn(appRepository, 'addNextStep')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      })
      .mockImplementation(originalAddNextStep);
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Add Next step' }));
    fireEvent.change(screen.getByLabelText('Next step'), {
      target: { value: 'Retry this concrete step' },
    });
    const dialog = screen.getByRole('dialog', { name: 'Add a Next step' });
    const submit = within(dialog).getByRole('button', { name: 'Add Next step' });
    fireEvent.click(submit);

    expect(
      await within(dialog).findByText(
        'Your Next step could not be saved. Nothing changed. Try again.'
      )
    ).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Next step').value).toBe(
      'Retry this concrete step'
    );

    fireEvent.click(submit);
    await waitFor(() =>
      expect(
        readSavedState().nextSteps.filter(({ title }) => title === 'Retry this concrete step')
      ).toHaveLength(1)
    );
    expect(addNextStep).toHaveBeenCalledTimes(2);
    expect(addNextStep.mock.calls[0]?.[2]).toBe(addNextStep.mock.calls[1]?.[2]);
    expect(addNextStep.mock.calls[0]?.[3]).toBe(addNextStep.mock.calls[1]?.[3]);
  });

  it('atomically completes the current Next step and promotes the first upcoming step', async () => {
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Mark complete' }));

    await waitFor(() => {
      const saved = readSavedState();
      expect(saved.nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)?.status).toBe(
        'completed'
      );
      expect(saved.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')?.status).toBe(
        'current'
      );
    });
    expect(
      await screen.findByRole('heading', { name: 'Practice the verse strumming pattern' })
    ).toBeTruthy();
  });

  it('leaves the current step intact after a completion write failure and supports retry', async () => {
    const originalCompleteCurrentNextStep = appRepository.completeCurrentNextStep;
    const completeCurrentNextStep = vi
      .spyOn(appRepository, 'completeCurrentNextStep')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      })
      .mockImplementation(originalCompleteCurrentNextStep);
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Mark complete' }));

    expect(
      await screen.findByText('Your Next step could not be completed. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(
      readSavedState().nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)?.status
    ).toBe('current');

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    await waitFor(() =>
      expect(
        readSavedState().nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)?.status
      ).toBe('completed')
    );
    expect(completeCurrentNextStep).toHaveBeenCalledTimes(2);
    expect(completeCurrentNextStep.mock.calls[0]?.[1]).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
    expect(completeCurrentNextStep.mock.calls[1]?.[1]).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
  });

  it('shows actionable zero-progress, no-step, and no-session states', async () => {
    const state = createSeedAppState();
    state.focusSessions = [];
    state.nextSteps = [];

    await renderJourney(state);

    expect(
      await screen.findByText('Finish a Focus session to add your first Pomodoro.')
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Choose what comes next' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No upcoming steps' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No sessions yet' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
    expect(
      screen.getAllByRole('button', { name: /Add a Next step|Add Next step/ }).length
    ).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(100);
    expect(screen.queryByRole('button', { name: /^Pomodoro 1:/ })).toBeNull();
  });

  it('keeps an inactive Journey readable without offering a Focus session', async () => {
    const state = createSeedAppState();
    state.journeys = state.journeys.map((journey) => ({ ...journey, status: 'paused' }));

    await renderJourney(state);

    expect(
      await screen.findByText('This Journey is paused. Make it active to start a Focus session.')
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Practice the F chord transition' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeTruthy();
  });

  it('shows an actionable not-found state for an unknown Journey ID', async () => {
    await renderJourney(createSeedAppState(), 'missing-journey');

    expect(await screen.findByRole('heading', { name: 'Journey not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Return Home' })).toBeTruthy();
  });
});
