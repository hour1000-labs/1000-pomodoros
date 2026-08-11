// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createEmptyAppState } from '@/lib/mock-data';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

async function renderSampleJourney() {
  const emptyState = createEmptyAppState();
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(emptyState));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/sample'] }) });
  await router.load();
  render(<RouterProvider router={router} />);

  return { emptyState, router };
}

describe('SampleJourneyScreen', () => {
  it('renders the sample without writing it to persisted state or exposing mutation actions', async () => {
    const { emptyState, router } = await renderSampleJourney();

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/sample');
    expect(JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '{}')).toEqual(emptyState);
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
    const { emptyState, router } = await renderSampleJourney();

    fireEvent.click(screen.getByRole('link', { name: '1000 Pomodoros' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Turn focused work into visible progress',
      })
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe('/');
    expect(JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '{}')).toEqual(emptyState);
  });
});
