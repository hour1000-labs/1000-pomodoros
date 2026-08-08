// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyAppState,
  createSeedAppState,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { AppState, Journey, NextStep } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository } from '@/lib/repository';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

async function renderJourneys(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/journeys'] }) });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

function addJourney(
  state: AppState,
  {
    id,
    name,
    status,
    lastActiveAt,
    withCurrentStep = true,
  }: {
    id: string;
    name: string;
    status: Journey['status'];
    lastActiveAt: string;
    withCurrentStep?: boolean;
  }
) {
  const journey: Journey = {
    id,
    name,
    reason: '',
    targetMinutes: 1_000 * 60,
    status,
    createdAt: lastActiveAt,
    updatedAt: lastActiveAt,
    lastActiveAt,
  };
  const nextStep: NextStep | null = withCurrentStep
    ? {
        id: `next-step-${id}`,
        journeyId: id,
        title: `Next action for ${name}`,
        description: '',
        status: 'current',
        position: 0,
        createdAt: lastActiveAt,
        completedAt: null,
      }
    : null;

  state.journeys.push(journey);
  if (nextStep) state.nextSteps.push(nextStep);

  return { journey, nextStep };
}

function expectBefore(first: Element, second: Element) {
  expect(Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
    true
  );
}

describe('JourneysScreen', () => {
  it('uses the collection-shaped loading state while saved data is unavailable', async () => {
    vi.spyOn(appRepository, 'load').mockReturnValue({
      status: 'unavailable',
      state: null,
      seeded: false,
    });

    await renderJourneys(createSeedAppState());

    const loadingState = screen.getByLabelText('Loading saved progress');
    expect(loadingState.getAttribute('data-variant')).toBe('journeys');
  });

  it('shows the complete seeded Journey summary and typed collection actions', async () => {
    await renderJourneys(createSeedAppState());

    expect(await screen.findByRole('heading', { level: 1, name: 'Journeys' })).toBeTruthy();
    const activeSection = screen.getByRole('region', { name: 'Active Journeys' });
    const journeyLink = within(activeSection).getByRole('link', {
      name: 'View Learn guitar Journey',
      description:
        '17 hours 55 minutes focused. Next step: Practice the F chord transition. Current milestone: 25 focused hours. 72% complete.',
    });
    expect(journeyLink.getAttribute('href')).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`);
    expect(within(activeSection).getByText('17 hours 55 minutes focused')).toBeTruthy();
    expect(within(activeSection).getByText('Practice the F chord transition')).toBeTruthy();
    expect(within(activeSection).getByText('Current milestone: 25 focused hours')).toBeTruthy();

    const startLink = within(activeSection).getByRole('link', {
      name: 'Start 25:00 for Practice the F chord transition in Learn guitar',
    });
    const startUrl = new URL(startLink.getAttribute('href') ?? '', 'http://localhost');
    expect(startUrl.pathname).toBe('/focus');
    expect(startUrl.searchParams.get('journeyId')).toBe(LEARN_GUITAR_JOURNEY_ID);
    expect(startUrl.searchParams.get('nextStepId')).toBe(LEARN_GUITAR_CURRENT_STEP_ID);

    const addJourneyUrl = new URL(
      screen.getByRole('link', { name: 'Add Journey' }).getAttribute('href') ?? '',
      'http://localhost'
    );
    expect(addJourneyUrl.pathname).toBe('/onboarding/journey');
    expect(addJourneyUrl.searchParams.get('fresh')).toBe('true');

    const currentNavLink = screen.getByRole('link', { name: 'Journeys' });
    expect(currentNavLink.getAttribute('href')).toBe('/journeys');
    expect(currentNavLink.getAttribute('aria-current')).toBe('page');
  });

  it('groups every saved status, preserves recent order, and gates inactive actions', async () => {
    const state = createSeedAppState();
    const activeWithoutStep = addJourney(state, {
      id: 'journey-write-book',
      name: 'Write a book',
      status: 'active',
      lastActiveAt: '2026-08-05T12:00:00.000Z',
      withCurrentStep: false,
    });
    const paused = addJourney(state, {
      id: 'journey-learn-spanish',
      name: 'Learn Spanish',
      status: 'paused',
      lastActiveAt: '2026-08-04T12:00:00.000Z',
    });
    const completed = addJourney(state, {
      id: 'journey-run-marathon',
      name: 'Run a marathon',
      status: 'completed',
      lastActiveAt: '2026-08-03T12:00:00.000Z',
      withCurrentStep: false,
    });
    const archived = addJourney(state, {
      id: 'journey-old-project',
      name: 'Ship an old project',
      status: 'archived',
      lastActiveAt: '2026-08-02T12:00:00.000Z',
    });
    state.lastActiveJourneyId = activeWithoutStep.journey.id;

    await renderJourneys(state);

    const activeSection = await screen.findByRole('region', { name: 'Active Journeys' });
    const inactiveSection = screen.getByRole('region', { name: 'Other Journeys' });
    expectBefore(activeSection, inactiveSection);

    const activeLinks = within(activeSection).getAllByRole('link', {
      name: /^View .* Journey$/,
    });
    expect(activeLinks.map((link) => link.getAttribute('aria-label'))).toEqual([
      'View Write a book Journey',
      'View Learn guitar Journey',
    ]);
    expect(
      within(activeSection).getByRole('link', {
        name: 'View Write a book Journey',
        description:
          '0 minutes focused. Next step: Add your next action. Current milestone: Journey target. 0% complete.',
      })
    ).toBeTruthy();
    expect(
      within(activeSection).getByRole('link', { name: 'Add a Next step to Write a book' })
    ).toBeTruthy();

    for (const { journey } of [paused, completed, archived]) {
      const link = within(inactiveSection).getByRole('link', {
        name: `View ${journey.name} Journey (${journey.status})`,
      });
      const card = link.closest<HTMLElement>('[data-slot="card"]');
      if (!card) throw new Error(`Expected a card for ${journey.name}`);

      expect(link.getAttribute('href')).toBe(`/journeys/${journey.id}`);
      expect(within(card).getByText(journey.name)).toBeTruthy();
      expect(within(card).getByText(new RegExp(`^${journey.status}$`, 'i'))).toBeTruthy();
      expect(within(card).queryByRole('link', { name: /Start 25:00|Add a Next step/ })).toBeNull();
    }

    expect(
      within(inactiveSection).getByRole('link', {
        name: 'View Learn Spanish Journey (paused)',
        description:
          '0 minutes focused. Next step: Next action for Learn Spanish. Current milestone: Journey target. 0% complete.',
      })
    ).toBeTruthy();

    expect(within(inactiveSection).getAllByRole('link')).toHaveLength(3);
    expect(within(inactiveSection).getByText('No current Next step')).toBeTruthy();
  });

  it('uses the existing Journey-creation recovery when no saved Journeys exist', async () => {
    await renderJourneys(createEmptyAppState());

    expect(await screen.findByRole('heading', { level: 1, name: 'Journeys' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Your next pomodoro starts here' })).toBeTruthy();
    const createLink = screen.getByRole('link', { name: 'Create a Journey' });
    expect(createLink.getAttribute('href')).toBe('/onboarding/journey');
    expect(screen.queryByRole('heading', { name: 'Active Journeys' })).toBeNull();
  });
});
