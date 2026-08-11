// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSeedAppState,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { AppState, FocusSession } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

const FROZEN_LOCAL_NOW = new Date(2026, 7, 11, 12);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FROZEN_LOCAL_NOW);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function createSessionAt({
  endedAt,
  id,
  source = 'timer',
}: {
  endedAt: Date;
  id: string;
  source?: FocusSession['source'];
}): FocusSession {
  return {
    id,
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
    plannedMinutes: 25,
    focusedMinutes: 25,
    status: 'completed',
    source,
    startedAt: new Date(endedAt.getTime() - 25 * 60 * 1_000).toISOString(),
    endedAt: endedAt.toISOString(),
    reflection: '',
  };
}

function createSession(day: number): FocusSession {
  return createSessionAt({
    endedAt: new Date(2026, 7, day, 12),
    id: `streak-session-${day}`,
    source: day === 9 ? 'manual' : 'timer',
  });
}

function createStreakState(): AppState {
  const state = createSeedAppState(FROZEN_LOCAL_NOW);
  state.focusSessions = [1, 2, 3, 4, 5, 6, 7, 9, 10].map(createSession);
  state.lastCompletedSessionId = state.focusSessions.at(-1)?.id ?? null;
  return state;
}

function createLongStreakState(dayCount: number): AppState {
  const state = createSeedAppState(FROZEN_LOCAL_NOW);
  state.focusSessions = Array.from({ length: dayCount }, (_, index) => {
    const endedAt = new Date(FROZEN_LOCAL_NOW);
    endedAt.setDate(endedAt.getDate() - (dayCount - index - 1));
    return createSessionAt({ endedAt, id: `long-streak-session-${index}` });
  });
  state.lastCompletedSessionId = state.focusSessions.at(-1)?.id ?? null;
  return state;
}

async function renderStreaks(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/streaks'] }) });
  await router.load();
  render(<RouterProvider router={router} />, { container: document });

  return router;
}

describe('StreakScreen', () => {
  it('keeps the hero restrained and reports exact current-month totals and date labels', async () => {
    await renderStreaks(createStreakState());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Current streak: 9 days' })
    ).toBeTruthy();
    expect(screen.getByText('Current streak').classList).toContain('text-ink/60');
    expect(screen.getByText('Today is still open.')).toBeTruthy();
    expect(screen.getByText('Personal best: 9 days · 0 freezes available')).toBeTruthy();
    expect(
      screen.getByText('Focus for at least 5 minutes in any Journey to count today.')
    ).toBeTruthy();
    expect(screen.getByText('5 focus days to next freeze')).toBeTruthy();

    const backLink = screen.getByRole('link', { name: 'Back to Home' });
    expect(backLink.getAttribute('href')).toBe('/home');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();

    expect(screen.getByRole('heading', { level: 2, name: 'August 2026' })).toBeTruthy();
    const totals = screen.getByRole('region', { name: 'August 2026 totals' });
    expect(within(totals).getByText('Days practiced').parentElement?.textContent).toContain('9');
    expect(within(totals).getByText('Freezes used').parentElement?.textContent).toContain('1');
    const totalLabels = within(totals).getAllByRole('term');
    expect(totalLabels).toHaveLength(2);
    expect(totalLabels.every((label) => label.classList.contains('text-ink/60'))).toBe(true);

    const calendar = screen.getByRole('table', { name: 'August 2026 streak calendar' });
    expect(
      within(calendar).getByRole('cell', { name: 'August 8, 2026: 1 freeze used.' })
    ).toBeTruthy();
    expect(
      within(calendar).getByRole('cell', {
        name: 'August 9, 2026: practiced, 25 minutes focused.',
      })
    ).toBeTruthy();
  });

  it('lets a five-digit streak wrap its unit without shrinking the count', async () => {
    await renderStreaks(createLongStreakState(10_000));

    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Current streak: 10000 days',
    });
    expect(heading.classList).toContain('min-w-0');
    expect(heading.classList).toContain('flex-1');
    expect(heading.classList).toContain('flex-wrap');
    expect(heading.classList).toContain('gap-y-0');
    expect(within(heading).getByText('10000')).toBeTruthy();
    expect(within(heading).getByText('days')).toBeTruthy();
  });

  it('navigates through history but disables navigation beyond the current month', async () => {
    await renderStreaks(createStreakState());

    const nextButton = await screen.findByRole('button', { name: 'View next month' });
    expect(nextButton.hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'View previous month' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'July 2026' })).toBeTruthy();
    });
    expect(nextButton.hasAttribute('disabled')).toBe(false);
    const julyTotals = screen.getByRole('region', { name: 'July 2026 totals' });
    expect(within(julyTotals).getByText('Days practiced').parentElement?.textContent).toContain(
      '0'
    );
    expect(within(julyTotals).getByText('Freezes used').parentElement?.textContent).toContain('0');

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'August 2026' })).toBeTruthy();
    });
    expect(nextButton.hasAttribute('disabled')).toBe(true);
  });
});
