// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSeedAppState,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { AppState, Journey, NextStep } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

const FROZEN_LOCAL_NOW = new Date(2026, 6, 12, 12);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FROZEN_LOCAL_NOW);
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
});

async function renderHome(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/home'] }) });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

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

function addActiveJourney(
  state: AppState,
  {
    id,
    name,
    lastActiveAt,
  }: {
    id: string;
    name: string;
    lastActiveAt: string;
  }
) {
  const journey: Journey = {
    id,
    name,
    reason: `Make steady progress on ${name}.`,
    targetMinutes: 1_000 * 60,
    status: 'active',
    createdAt: lastActiveAt,
    updatedAt: lastActiveAt,
    lastActiveAt,
  };
  const nextStep: NextStep = {
    id: `next-step-${id}`,
    journeyId: id,
    title: `Next action for ${name}`,
    description: '',
    status: 'current',
    position: 0,
    createdAt: lastActiveAt,
    completedAt: null,
  };

  state.journeys.push(journey);
  state.nextSteps.push(nextStep);

  return { journey, nextStep };
}

function expectBefore(first: Element, second: Element) {
  expect(Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
    true
  );
}

describe('HomeScreen', () => {
  it('renders the seeded local-day summary in the intended section order', async () => {
    await renderHome(createSeedAppState());

    const continueSection = await screen.findByRole('region', {
      name: 'Practice the F chord transition',
    });
    const todaySection = screen.getByRole('region', { name: 'Today' });
    const weeklySection = screen.getByRole('region', { name: 'This week' });
    const activeJourneysSection = screen.getByRole('region', { name: 'Active Journeys' });
    const recentSessionsSection = screen.getByRole('region', { name: 'Recent sessions' });

    expect(within(todaySection).getByText('2')).toBeTruthy();
    expect(within(todaySection).getByText('50 minutes')).toBeTruthy();
    const streakLink = within(todaySection).getByRole('link', {
      name: /View streak calendar:.*Today complete/,
    });
    expect(streakLink.getAttribute('href')).toBe('/streaks');
    expect(streakLink.className).toContain('min-h-14');
    expect(streakLink.className).toContain('focus-visible:ring-2');
    expect(within(streakLink).getByText(/\d+-day streak/)).toBeTruthy();
    expect(within(streakLink).getByText('Today complete')).toBeTruthy();
    expect(within(streakLink).getByText(/\d+ freezes?/)).toBeTruthy();

    const weeklyText = weeklySection.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    expect(weeklyText).toContain('7 / 10');
    expect(within(weeklySection).getByText('Remaining').nextElementSibling?.textContent).toBe('3');
    expect(within(weeklySection).getByText('Active days').nextElementSibling?.textContent).toBe(
      '3'
    );
    expect(
      within(weeklySection)
        .getByRole('progressbar', { name: 'Weekly goal: 7 of 10 pomodoros' })
        .getAttribute('aria-valuenow')
    ).toBe('70');

    expect(
      within(activeJourneysSection).getAllByRole('link', { name: /^View .* Journey$/ })
    ).toHaveLength(1);
    expect(
      within(activeJourneysSection).queryByRole('link', { name: 'View all Journeys' })
    ).toBeNull();
    expect(within(recentSessionsSection).getAllByRole('listitem')).toHaveLength(3);

    expectBefore(continueSection, todaySection);
    expectBefore(todaySection, weeklySection);
    expectBefore(weeklySection, activeJourneysSection);
    expectBefore(activeJourneysSection, recentSessionsSection);
  });

  it('keeps the Journey card body and both Start actions on their typed destinations', async () => {
    await renderHome(createSeedAppState());

    const journeyLink = await screen.findByRole('link', {
      name: 'View Learn guitar Journey',
    });
    expect(journeyLink.getAttribute('href')).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`);

    const startLinks = screen.getAllByRole('link', {
      name: 'Start 25:00 for Practice the F chord transition in Learn guitar',
    });
    expect(startLinks).toHaveLength(2);

    for (const link of startLinks) {
      const url = new URL(link.getAttribute('href') ?? '', 'http://localhost');
      expect(url.pathname).toBe('/focus');
      expect(url.searchParams.get('journeyId')).toBe(LEARN_GUITAR_JOURNEY_ID);
      expect(url.searchParams.get('nextStepId')).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
    }
  });

  it('offers Add Journey from the Active Journeys section with a fresh onboarding draft', async () => {
    await renderHome(createSeedAppState());

    const activeJourneysSection = await screen.findByRole('region', {
      name: 'Active Journeys',
    });
    const addJourneyLink = within(activeJourneysSection).getByRole('link', {
      name: 'Add Journey',
    });
    const addJourneyUrl = new URL(addJourneyLink.getAttribute('href') ?? '', 'http://localhost');

    expect(addJourneyUrl.pathname).toBe('/onboarding/journey');
    expect(addJourneyUrl.searchParams.get('fresh')).toBe('true');
  });

  it('replace-redirects a Journey-free user to Journey onboarding', async () => {
    const router = await renderHome(createJourneyFreeState());

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/journey');
    });
    expect(router.history.length).toBe(1);
    expect(router.history.canGoBack()).toBe(false);
  });

  it('uses concise fresh-start and activity empty states before any session', async () => {
    const state = createSeedAppState();
    state.focusSessions = [];
    state.lastCompletedSessionId = null;

    await renderHome(state);

    expect(await screen.findByText('Your first Pomodoro starts here.')).toBeTruthy();

    const todaySection = screen.getByRole('region', { name: 'Today' });
    expect(within(todaySection).getByText('0')).toBeTruthy();
    expect(within(todaySection).getByText('0 minutes')).toBeTruthy();
    const emptyStreakLink = within(todaySection).getByRole('link', {
      name: 'View streak calendar: 0-day streak. Focus 5 minutes to start. 0 freezes available.',
    });
    expect(within(emptyStreakLink).getByText('0-day streak')).toBeTruthy();
    expect(within(emptyStreakLink).getByText('Focus 5 minutes to start')).toBeTruthy();
    expect(within(emptyStreakLink).getByText('0 freezes')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No sessions yet' })).toBeTruthy();
  });

  it('rolls Today statistics over when the local calendar day changes while Home stays open', async () => {
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 12, 23, 59, 59, 900));

    await renderHome(createSeedAppState());

    const todaySection = screen.getByRole('region', { name: 'Today' });
    expect(within(todaySection).getByText('2')).toBeTruthy();
    expect(within(todaySection).getByText('50 minutes')).toBeTruthy();
    expect(
      within(todaySection).getByRole('link', {
        name: /View streak calendar:.*Today complete/,
      })
    ).toBeTruthy();

    act(() => vi.advanceTimersByTime(200));

    expect(within(todaySection).getByText('0')).toBeTruthy();
    expect(within(todaySection).getByText('0 minutes')).toBeTruthy();
    expect(
      within(todaySection).getByRole('link', {
        name: /View streak calendar:.*Focus 5 minutes today/,
      })
    ).toBeTruthy();
  });

  it('makes the latest automatic protection explicit in the Home streak link', async () => {
    const state = createSeedAppState();
    const templateSession = state.focusSessions[0];
    if (templateSession === undefined) throw new Error('Expected a seeded session');

    state.focusSessions = Array.from({ length: 7 }, (_, index) => {
      const endedAt = new Date(2026, 6, 4 + index, 12);
      const startedAt = new Date(endedAt);
      startedAt.setMinutes(startedAt.getMinutes() - 25);

      return {
        ...templateSession,
        id: `protected-streak-session-${index}`,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
      };
    });

    await renderHome(state);

    const todaySection = await screen.findByRole('region', { name: 'Today' });
    expect(
      within(todaySection).getByRole('link', {
        name: /View streak calendar: 7-day streak\. Protected yesterday · Focus 5 minutes today\. 0 freezes available\./,
      })
    ).toBeTruthy();
  });

  it('presents a calm empty state without a progressbar when no weekly goal exists', async () => {
    const state = createSeedAppState();
    state.weeklyGoal = null;

    await renderHome(state);

    const weeklySection = await screen.findByRole('region', {
      name: 'No weekly goal',
    });
    expect(within(weeklySection).getByRole('heading', { name: 'No weekly goal' })).toBeTruthy();
    expect(within(weeklySection).queryByRole('progressbar')).toBeNull();
  });

  it('offers the Journey-detail fallback when the active Journey has no current Next step', async () => {
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((nextStep) =>
      nextStep.status === 'current' ? { ...nextStep, status: 'upcoming' } : nextStep
    );

    await renderHome(state);

    const addNextStepLinks = await screen.findAllByRole('link', {
      name: 'Add a Next step to Learn guitar',
    });
    expect(addNextStepLinks).toHaveLength(2);
    expect(
      addNextStepLinks.every(
        (link) => link.getAttribute('href') === `/journeys/${LEARN_GUITAR_JOURNEY_ID}`
      )
    ).toBe(true);
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
  });

  it('offers one Journey review action when every Journey is inactive', async () => {
    const state = createSeedAppState();
    state.journeys = state.journeys.map((journey) => ({ ...journey, status: 'paused' }));

    await renderHome(state);

    expect(await screen.findByRole('heading', { name: 'No active Journeys' })).toBeTruthy();
    const reviewLink = screen.getByRole('link', { name: 'View all Journeys' });
    expect(reviewLink.getAttribute('href')).toBe('/journeys');
    expect(screen.getByRole('link', { name: 'Add Journey' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
  });

  it('shows at most two active Journeys and puts the persisted last-active Journey first', async () => {
    const state = createSeedAppState();
    const persistedLastActive = addActiveJourney(state, {
      id: 'journey-write-book',
      name: 'Write a book',
      lastActiveAt: '2026-07-10T18:00:00.000Z',
    });
    const mostRecentByDate = addActiveJourney(state, {
      id: 'journey-build-boat',
      name: 'Build a boat',
      lastActiveAt: '2026-07-15T18:00:00.000Z',
    });
    state.lastActiveJourneyId = persistedLastActive.journey.id;

    await renderHome(state);

    const activeJourneysSection = await screen.findByRole('region', {
      name: 'Active Journeys',
    });
    const journeyLinks = within(activeJourneysSection).getAllByRole('link', {
      name: /^View .* Journey$/,
    });

    expect(journeyLinks).toHaveLength(2);
    expect(journeyLinks.map((link) => link.getAttribute('aria-label'))).toEqual([
      `View ${persistedLastActive.journey.name} Journey`,
      `View ${mostRecentByDate.journey.name} Journey`,
    ]);

    for (const { journey, nextStep } of [persistedLastActive, mostRecentByDate]) {
      const journeyLink = within(activeJourneysSection).getByRole('link', {
        name: `View ${journey.name} Journey`,
      });
      const journeyCard = journeyLink.closest<HTMLElement>('[data-slot="card"]');
      if (journeyCard === null) throw new Error(`Expected a card for ${journey.name}`);

      expect(journeyLink.getAttribute('href')).toBe(`/journeys/${journey.id}`);
      expect(within(journeyCard).getByText(journey.name)).toBeTruthy();
      expect(within(journeyCard).getByText(nextStep.title)).toBeTruthy();

      const startLink = within(journeyCard).getByRole('link', {
        name: `Start 25:00 for ${nextStep.title} in ${journey.name}`,
      });
      const startUrl = new URL(startLink.getAttribute('href') ?? '', 'http://localhost');
      expect(startUrl.pathname).toBe('/focus');
      expect(startUrl.searchParams.get('journeyId')).toBe(journey.id);
      expect(startUrl.searchParams.get('nextStepId')).toBe(nextStep.id);
    }

    expect(
      within(activeJourneysSection).queryByRole('link', {
        name: 'View Learn guitar Journey',
      })
    ).toBeNull();
    expect(
      within(activeJourneysSection)
        .getByRole('link', { name: 'View all Journeys' })
        .getAttribute('href')
    ).toBe('/journeys');
  });

  it('offers the collection when an inactive Journey is omitted from the active preview', async () => {
    const state = createSeedAppState();
    addActiveJourney(state, {
      id: 'journey-paused',
      name: 'Paused Journey',
      lastActiveAt: '2026-07-15T18:00:00.000Z',
    });
    state.journeys = state.journeys.map((journey) =>
      journey.id === 'journey-paused' ? { ...journey, status: 'paused' } : journey
    );

    await renderHome(state);

    const activeJourneysSection = await screen.findByRole('region', {
      name: 'Active Journeys',
    });
    expect(
      within(activeJourneysSection)
        .getByRole('link', { name: 'View all Journeys' })
        .getAttribute('href')
    ).toBe('/journeys');
    expect(
      within(activeJourneysSection).queryByRole('link', { name: 'View Paused Journey Journey' })
    ).toBeNull();
  });
});
