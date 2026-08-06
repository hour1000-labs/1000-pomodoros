// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState } from '@/lib/models';
import { APP_STORAGE_KEY, createAppExport } from '@/lib/repository';
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
    expect(screen.getByRole('link', { name: 'Explore sample Journey' }).getAttribute('href')).toBe(
      '/sample'
    );
    expect(screen.getByRole('button', { name: 'Import saved progress' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Export/ })).toBeNull();
    expect(screen.queryByText('Learn guitar')).toBeNull();
    expect(screen.queryByRole('link', { name: 'See how it works' })).toBeNull();
  });

  it('restores saved progress from the landing page and continues to Home', async () => {
    const router = await renderLandingPage(createJourneyFreeState());
    const input = screen.getByLabelText('Choose a 1000 Pomodoros backup file');
    const backupFile = new File(
      [JSON.stringify(createAppExport(createSeedAppState()))],
      'progress-backup.json',
      { type: 'application/json' }
    );

    fireEvent.change(input, { target: { files: [backupFile] } });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '{}')).toEqual(
      createSeedAppState()
    );
  });

  it('opens the sample Journey only after explicit exploration', async () => {
    const router = await renderLandingPage(createJourneyFreeState());

    expect(screen.queryByRole('heading', { level: 1, name: 'Learn guitar' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Explore sample Journey' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/sample');

    const savedState = JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '{}') as AppState;
    expect(savedState.journeys).toHaveLength(0);
    expect(savedState.nextSteps).toHaveLength(0);
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
