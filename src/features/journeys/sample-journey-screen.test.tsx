// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createEmptyAppState } from '@/lib/mock-data';
import type { AppState, FocusSession, Journey } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { deriveStreakSummary } from '@/lib/streaks';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

async function renderSampleJourney(savedState: AppState = createEmptyAppState()) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(savedState));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/sample'] }) });
  await router.load();
  render(<RouterProvider router={router} />);

  return { router, savedState };
}

function createPersonalStreakState(referenceDate: Date): AppState {
  const journey: Journey = {
    id: 'journey-personal',
    name: 'Write every day',
    reason: 'Finish a first draft.',
    targetMinutes: 1_000,
    status: 'active',
    createdAt: new Date(2026, 7, 1, 12).toISOString(),
    updatedAt: referenceDate.toISOString(),
    lastActiveAt: referenceDate.toISOString(),
  };
  const focusSessions: FocusSession[] = Array.from({ length: 7 }, (_, index) => {
    const endedAt = new Date(2026, 7, index + 1, 12);
    return {
      id: `personal-session-${index + 1}`,
      journeyId: journey.id,
      nextStepId: null,
      plannedMinutes: 25,
      focusedMinutes: 25,
      status: 'completed',
      source: 'timer',
      startedAt: new Date(endedAt.getTime() - 25 * 60 * 1_000).toISOString(),
      endedAt: endedAt.toISOString(),
      reflection: '',
    };
  });

  return {
    ...createEmptyAppState(),
    journeys: [journey],
    focusSessions,
    lastActiveJourneyId: journey.id,
    lastCompletedSessionId: focusSessions.at(-1)?.id ?? null,
  };
}

describe('SampleJourneyScreen', () => {
  it('renders the sample without writing it to persisted state or exposing mutation actions', async () => {
    const { router, savedState } = await renderSampleJourney();

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/sample');
    expect(JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '{}')).toEqual(savedState);
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Journey' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Journeys' })).toBeNull();
    expect(screen.getByRole('link', { name: '1000 Pomodoros' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark complete' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Journey actions for / })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Next step actions for / })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add Next step' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull();
    expect(screen.queryByRole('button', { name: /^More actions for / })).toBeNull();
  });

  it('returns to the landing page when the brand is clicked', async () => {
    const { router, savedState } = await renderSampleJourney();

    fireEvent.click(screen.getByRole('link', { name: '1000 Pomodoros' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Turn focused work into visible progress',
      })
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe('/');
    expect(JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '{}')).toEqual(savedState);
  });

  it('leaves a persisted personal streak and its derived rewards unchanged', async () => {
    const now = new Date(2026, 7, 7, 18);
    const personalState = createPersonalStreakState(now);
    const summaryBefore = deriveStreakSummary(
      personalState.focusSessions,
      personalState.journeys.map(({ id }) => id),
      now
    );
    const serializedBefore = JSON.stringify(personalState);

    await renderSampleJourney(personalState);

    const serializedAfter = window.localStorage.getItem(APP_STORAGE_KEY);
    const persistedAfter = JSON.parse(serializedAfter ?? '{}') as AppState;
    const summaryAfter = deriveStreakSummary(
      persistedAfter.focusSessions,
      persistedAfter.journeys.map(({ id }) => id),
      now
    );

    expect(summaryBefore).toMatchObject({
      currentStreak: 7,
      freezesAvailable: 1,
      totalFreezesEarned: 1,
    });
    expect(serializedAfter).toBe(serializedBefore);
    expect(persistedAfter).toEqual(personalState);
    expect(summaryAfter).toEqual(summaryBefore);
  });
});
