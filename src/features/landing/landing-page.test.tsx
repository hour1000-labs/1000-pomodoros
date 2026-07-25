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
  it('presents the exact promise and routes both primary actions to onboarding for a Journey-free state', async () => {
    await renderLandingPage(createJourneyFreeState());

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Turn focused work into visible progress.',
      })
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Complete pomodoros, build skills, and see every hour you invest on the path toward mastery.'
      )
    ).toBeTruthy();

    const onboardingLinks = screen.getAllByRole('link', {
      name: 'Start your first journey',
    });
    expect(onboardingLinks).toHaveLength(2);
    expect(
      onboardingLinks.every((link) => link.getAttribute('href') === '/onboarding/journey')
    ).toBe(true);
    expect(screen.getByRole('link', { name: 'See how it works' }).getAttribute('href')).toBe(
      '#product-demonstration'
    );
  });

  it('labels the seeded product demonstration and limits benefits to four', async () => {
    await renderLandingPage(createJourneyFreeState());

    const demonstration = await screen.findByLabelText(
      'Product demonstration for the Learn guitar Journey'
    );
    expect(
      within(demonstration).getByRole('heading', { level: 2, name: 'Learn guitar' })
    ).toBeTruthy();
    expect(within(demonstration).getByText('Practice the F chord transition')).toBeTruthy();
    expect(within(demonstration).getByLabelText('25 minute timer')).toBeTruthy();
    expect(within(demonstration).getByLabelText('43 complete pomodoros out of 50')).toBeTruthy();
    expect(within(demonstration).getByText('25 focused hours')).toBeTruthy();

    const benefits = screen.getByRole('heading', {
      level: 2,
      name: 'Small sessions. A body of work you can see.',
    }).nextElementSibling;
    expect(benefits?.querySelectorAll('li')).toHaveLength(4);
    expect(screen.getByText('What will your next', { exact: false })).toBeTruthy();
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
        name: 'Turn focused work into visible progress.',
      })
    ).toBeNull();
  });
});
