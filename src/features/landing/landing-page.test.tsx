// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function createJourneyFreeState(): AppState {
  return {
    ...createSeedAppState(),
    journeys: [],
    nextSteps: [],
    focusSessions: [],
    milestones: [],
    weeklyGoal: null,
    onboardingDraft: null,
    activeTimer: null,
    lastActiveJourneyId: null,
    lastCompletedSessionId: null,
  };
}

async function renderLandingPage(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/'] }) });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

describe('LandingPage', () => {
  it('presents the core promise and one primary action for a Journey-free state', async () => {
    await renderLandingPage(createJourneyFreeState());

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Track focused work, one pomodoro at a time',
      })
    ).toBeTruthy();
    expect(
      screen.getByText('Choose a Journey, start a Focus session, and see your progress grow.')
    ).toBeTruthy();

    const onboardingLinks = screen.getAllByRole('link', {
      name: 'Start your first Journey',
    });
    expect(onboardingLinks).toHaveLength(1);
    expect(
      onboardingLinks.every((link) => link.getAttribute('href') === '/onboarding/journey')
    ).toBe(true);
    expect(screen.queryByRole('link', { name: 'See how it works' })).toBeNull();
  });

  it('shows one concise, accessible product preview', async () => {
    await renderLandingPage(createJourneyFreeState());

    const demonstration = await screen.findByLabelText('Learn guitar Journey preview');
    expect(
      within(demonstration).getByRole('heading', { level: 2, name: 'Learn guitar' })
    ).toBeTruthy();
    expect(within(demonstration).getByText('Practice the F chord transition')).toBeTruthy();
    expect(within(demonstration).getByLabelText('25-minute Focus session')).toBeTruthy();
    expect(within(demonstration).getByLabelText(/43 complete pomodoros out of 50/i)).toBeTruthy();
    expect(within(demonstration).getByText('25 focused hours')).toBeTruthy();
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  it('replace-redirects persisted Journey owners to Home', async () => {
    const router = await renderLandingPage(createSeedAppState());

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
    expect(router.history.length).toBe(1);
    expect(router.history.canGoBack()).toBe(false);
    expect(
      screen.queryByRole('heading', {
        level: 1,
        name: 'Track focused work, one pomodoro at a time',
      })
    ).toBeNull();
  });
});
