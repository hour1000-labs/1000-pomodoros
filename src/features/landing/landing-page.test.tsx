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
  it('presents the core promise, product preview, 3-step explanation, and onboarding actions for a Journey-free state', async () => {
    await renderLandingPage(createJourneyFreeState());

    // Hero title & description
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Turn focused work into visible progress',
      })
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Complete 25-minute pomodoros, build skills, and watch every hour you invest add up to long-term mastery.'
      )
    ).toBeTruthy();

    // Primary CTA buttons (Hero and Explanation section)
    const onboardingLinks = screen.getAllByRole('link', {
      name: 'Start your first Journey',
    });
    expect(onboardingLinks.length).toBeGreaterThanOrEqual(1);
    expect(
      onboardingLinks.every((link) => link.getAttribute('href') === '/onboarding/journey')
    ).toBe(true);

    // Secondary action & header import
    expect(screen.getByRole('link', { name: 'Explore sample Journey' }).getAttribute('href')).toBe(
      '/sample'
    );
    expect(screen.getByRole('button', { name: 'Import saved progress' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Export/ })).toBeNull();

    // Embedded Product Preview Frame checks
    expect(screen.getByText('Learn guitar')).toBeTruthy();
    expect(screen.getByText('Practice the F chord transition')).toBeTruthy();
    expect(screen.getByText('25:00')).toBeTruthy();
    expect(screen.getByText('43 / 50')).toBeTruthy();

    // 3-step Core Loop explanation checks
    expect(screen.getByRole('heading', { level: 2, name: 'How it works' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Choose what you want to improve' })
    ).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Focus on the next step' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Watch your focused effort add up' })
    ).toBeTruthy();
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

    // Main page H1 is "Turn focused work into visible progress", not "Learn guitar"
    expect(screen.queryByRole('heading', { level: 1, name: 'Learn guitar' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Explore sample Journey' }));

    // Navigates to /sample where H1 is "Learn guitar"
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
        name: 'Turn focused work into visible progress',
      })
    ).toBeNull();
  });
});
