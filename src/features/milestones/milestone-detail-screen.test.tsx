// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMilestoneReachedAppState,
  createSeedAppState,
  LEARN_GUITAR_25_HOUR_MILESTONE_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { AppState, Milestone } from '@/lib/models';
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

async function renderMilestone(state: AppState, milestoneId = LEARN_GUITAR_25_HOUR_MILESTONE_ID) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [`/milestones/${milestoneId}`] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

describe('MilestoneDetailScreen', () => {
  it('shows the persisted-state loading shell while milestone data is unavailable', async () => {
    vi.spyOn(appRepository, 'load').mockReturnValue({
      status: 'unavailable',
      state: null,
      seeded: false,
    });

    await renderMilestone(createMilestoneReachedAppState());

    expect(screen.getByLabelText('Loading milestone')).toBeTruthy();
    expect(document.querySelector('main')).toBeTruthy();
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

    await renderMilestone(createMilestoneReachedAppState());

    expect(
      await screen.findByRole('heading', { name: 'We could not load your saved progress' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset saved progress' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: '25 hours' })).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('renders the seeded earned record, completed grid, next milestone, and continuation route', async () => {
    await renderMilestone(createMilestoneReachedAppState());

    expect(await screen.findByRole('heading', { level: 1, name: '25 hours' })).toBeTruthy();
    expect(screen.getByText('Learn guitar')).toBeTruthy();
    expect(
      screen.getByText((_, element) => element?.textContent === 'You showed up for 60 pomodoros.')
    ).toBeTruthy();
    expect(screen.getByText('Reached July 12, 2026')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '25 focused hours' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '50 focused hours' })).toBeTruthy();
    expect(screen.getByText('25 hours remaining')).toBeTruthy();
    expect(
      screen.getByRole('progressbar', { name: 'Progress from this milestone: 0%' })
    ).toBeTruthy();

    const completedGrid = screen.getByRole('figure', {
      name: '60 complete pomodoros out of 60',
    });
    expect(completedGrid.querySelectorAll('[data-pomodoro-index]')).toHaveLength(60);
    expect(
      within(completedGrid).getByRole('img', {
        name: 'Pomodoro 60: complete, milestone',
      })
    ).toBeTruthy();

    const continueLink = screen.getByRole('link', { name: 'Continue Journey' });
    expect(continueLink.getAttribute('href')).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`);
    expect(screen.queryByRole('link', { name: /share milestone/i })).toBeNull();

    const entrance = document.querySelector('[data-milestone-content="true"]');
    expect(entrance?.className).toContain('animate-in');
    expect(entrance?.className).toContain('duration-300');
    expect(entrance?.className).toContain('motion-reduce:animate-none');
  });

  it('uses changed persisted values instead of hard-coded milestone copy', async () => {
    const state = createMilestoneReachedAppState();
    const journey = state.journeys.find(({ id }) => id === LEARN_GUITAR_JOURNEY_ID);
    const milestone = state.milestones.find(({ id }) => id === LEARN_GUITAR_25_HOUR_MILESTONE_ID);
    const customNextMilestone: Milestone = {
      id: 'milestone-learn-guitar-custom-next',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      name: '16 hours 40 minutes',
      targetFocusedMinutes: 1_000,
      earnedAt: null,
    };

    if (!journey || !milestone) throw new Error('Expected seeded Journey and milestone');

    journey.name = 'Compose a song';
    milestone.name = '500 focused minutes';
    milestone.targetFocusedMinutes = 500;
    milestone.earnedAt = '2026-06-01T18:25:00.000Z';
    state.focusSessions = state.focusSessions.slice(0, 20);
    state.milestones.push(customNextMilestone);

    await renderMilestone(state);

    expect(
      await screen.findByRole('heading', { level: 1, name: '8 hours 20 minutes' })
    ).toBeTruthy();
    expect(screen.getByText('Compose a song')).toBeTruthy();
    expect(
      screen.getByText((_, element) => element?.textContent === 'You showed up for 20 pomodoros.')
    ).toBeTruthy();
    expect(screen.getByText('Reached June 1, 2026')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '500 focused minutes' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '16 hours 40 minutes' })).toBeTruthy();
    expect(screen.getByText('8 hours 20 minutes remaining')).toBeTruthy();
  });

  it.each([
    {
      name: 'missing milestone',
      milestoneId: 'missing-milestone',
      createState: createMilestoneReachedAppState,
    },
    {
      name: 'unearned milestone',
      milestoneId: LEARN_GUITAR_25_HOUR_MILESTONE_ID,
      createState: createSeedAppState,
    },
    {
      name: 'missing related Journey',
      milestoneId: LEARN_GUITAR_25_HOUR_MILESTONE_ID,
      createState: () => {
        const state = createMilestoneReachedAppState();
        state.journeys = [];
        return state;
      },
    },
  ])('keeps the $name state non-celebratory', async ({ milestoneId, createState }) => {
    await renderMilestone(createState(), milestoneId);

    expect(await screen.findByRole('heading', { name: 'Milestone not found' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1, name: '25 hours' })).toBeNull();
    expect(screen.queryByText(/You showed up for/i)).toBeNull();
    expect(screen.queryByText('Milestone reached')).toBeNull();
    expect(screen.getByRole('link', { name: 'Return Home' }).getAttribute('href')).toBe('/home');
  });
});
