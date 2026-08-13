// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSeedAppState, LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';
import type { AppState } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository, RepositoryError } from '@/lib/repository';
import { getRouter } from '@/router';

import { deriveJourneyDetailData } from './journey-detail-data';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.localStorage.clear();
});

async function renderTarget(state: AppState, journeyId = LEARN_GUITAR_JOURNEY_ID) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [`/journeys/${journeyId}/target`] }),
  });
  await router.load();
  render(<RouterProvider router={router} />, { container: document });

  return router;
}

function readSavedState() {
  const value = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!value) throw new Error('Expected app state to be saved');
  return JSON.parse(value) as AppState;
}

describe('JourneyTargetScreen', () => {
  it('restores the current target and offers the expanded presets without onboarding chrome', async () => {
    await renderTarget(createSeedAppState());

    expect(await screen.findByRole('heading', { name: 'Edit focus target' })).toBeTruthy();
    expect(screen.getByText('Learn guitar')).toBeTruthy();
    expect(screen.queryByText('3 of 4')).toBeNull();
    expect(screen.queryByText('Continue')).toBeNull();
    expect(screen.getByRole('link', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save target' })).toBeTruthy();

    const group = screen.getByRole('group', { name: 'Focus target' });
    expect(within(group).getAllByRole('radio')).toHaveLength(7);
    expect(
      (within(group).getByRole('radio', { name: /1,000 hours/i }) as HTMLInputElement).checked
    ).toBe(true);
    expect(within(group).getByRole('radio', { name: /1,000 Pomodoros/i })).toBeTruthy();
    expect(within(group).getByRole('radio', { name: /10,000 hours/i })).toBeTruthy();
  });

  it('saves an exact 1,000-Pomodoro target and preserves unrelated saved records', async () => {
    const initial = createSeedAppState();
    const router = await renderTarget(initial);
    const initialState = readSavedState();

    fireEvent.click(await screen.findByRole('radio', { name: /1,000 Pomodoros/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save target' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`);
    });

    const saved = readSavedState();
    expect(saved.journeys).toEqual(
      initialState.journeys.map((journey) =>
        journey.id === LEARN_GUITAR_JOURNEY_ID ? { ...journey, targetMinutes: 25_000 } : journey
      )
    );
    expect(saved.nextSteps).toEqual(initialState.nextSteps);
    expect(saved.focusSessions).toEqual(initialState.focusSessions);
    expect(saved.milestones).toEqual(initialState.milestones);
    expect(saved.onboardingDraft).toEqual(initialState.onboardingDraft);
  });

  it('restores an exact fractional custom target and validates editor boundaries', async () => {
    const state = createSeedAppState();
    state.journeys[0] = { ...state.journeys[0], targetMinutes: 750 };
    await renderTarget(state);

    const custom = await screen.findByRole('radio', { name: /Custom target/i });
    expect((custom as HTMLInputElement).checked).toBe(true);
    const input = screen.getByRole('spinbutton', { name: 'Custom hours' });
    expect((input as HTMLInputElement).value).toBe('12.5');

    fireEvent.change(input, { target: { value: '10000.01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save target' }));
    expect(screen.getByRole('alert').textContent).toContain('1 to 10,000 hours');
    expect(readSavedState().journeys[0]?.targetMinutes).toBe(750);
  });

  it('keeps schema-valid out-of-range targets as invalid Custom values', async () => {
    for (const targetMinutes of [0, 600_001]) {
      cleanup();
      window.localStorage.clear();
      const state = createSeedAppState();
      state.journeys[0] = { ...state.journeys[0], targetMinutes };
      await renderTarget(state);

      const custom = await screen.findByRole('radio', { name: /Custom target/i });
      expect((custom as HTMLInputElement).checked).toBe(true);
      const input = screen.getByRole('spinbutton', { name: 'Custom hours' });
      expect((input as HTMLInputElement).value).toBe(String(targetMinutes / 60));

      fireEvent.click(screen.getByRole('button', { name: 'Save target' }));
      expect(screen.getByRole('alert').textContent).toContain('1 to 10,000 hours');
      expect(readSavedState().journeys[0]?.targetMinutes).toBe(targetMinutes);
    }
  });

  it('rejects blank, nonnumeric, and infinite custom values without saving', async () => {
    const state = createSeedAppState();
    state.journeys[0] = { ...state.journeys[0], targetMinutes: 750 };
    await renderTarget(state);
    fireEvent.click(await screen.findByRole('radio', { name: /Custom target/i }));
    const input = screen.getByRole('spinbutton', { name: 'Custom hours' });

    for (const value of ['', 'not-a-number', 'Infinity']) {
      fireEvent.change(input, { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: 'Save target' }));
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(readSavedState().journeys[0]?.targetMinutes).toBe(750);
    }
  });

  it('lowers a completed Journey target while preserving progress and derived extent', async () => {
    const state = createSeedAppState();
    const initialSessions = [
      {
        ...state.focusSessions[0],
        plannedMinutes: 2_425 * 25,
        focusedMinutes: 2_425 * 25,
      },
    ];
    const initialMilestones = state.milestones.map((milestone) => ({ ...milestone }));
    state.journeys[0] = { ...state.journeys[0], status: 'completed' };
    state.focusSessions = initialSessions;

    const router = await renderTarget(state);
    fireEvent.click(await screen.findByRole('radio', { name: /10 hours/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save target' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`);
    });

    const saved = readSavedState();
    expect(saved.journeys[0]).toMatchObject({
      status: 'completed',
      targetMinutes: 600,
    });
    expect(saved.focusSessions).toEqual(initialSessions);
    expect(saved.milestones).toEqual(initialMilestones);

    const detail = deriveJourneyDetailData(saved, LEARN_GUITAR_JOURNEY_ID);
    expect(detail).toMatchObject({
      targetBlocks: 24,
      totalBlocks: 2_425,
      totalSections: 25,
      currentSectionIndex: 24,
      currentSectionCount: 25,
      remainingPomodoros: 0,
    });
    expect(detail?.milestoneIndexes).toContain(23);
  });

  it('raises a completed Journey target without changing its status', async () => {
    const state = createSeedAppState();
    state.journeys[0] = {
      ...state.journeys[0],
      status: 'completed',
      targetMinutes: 600,
    };
    const router = await renderTarget(state);

    fireEvent.click(await screen.findByRole('radio', { name: /10,000 hours/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save target' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`);
    });
    expect(readSavedState().journeys[0]).toMatchObject({
      status: 'completed',
      targetMinutes: 600_000,
    });
  });

  it('keeps the editor open with the selection intact when saving fails', async () => {
    vi.spyOn(appRepository, 'updateJourneyTarget').mockReturnValue({
      status: 'error',
      state: null,
      error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
    });
    await renderTarget(createSeedAppState());

    fireEvent.click(await screen.findByRole('radio', { name: /10 hours/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save target' }));

    expect(
      await screen.findByText('Your target could not be saved. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save target' })).toBeTruthy();
    expect((screen.getByRole('radio', { name: /10 hours/i }) as HTMLInputElement).checked).toBe(
      true
    );
    expect(readSavedState().journeys[0]?.targetMinutes).toBe(60_000);
  });

  it('cancels without changing saved state and shows a not-found recovery route', async () => {
    const state = createSeedAppState();
    const initial = JSON.stringify(state);
    const router = await renderTarget(state);
    fireEvent.click(await screen.findByRole('link', { name: 'Cancel' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/journeys/${LEARN_GUITAR_JOURNEY_ID}`)
    );
    expect(window.localStorage.getItem(APP_STORAGE_KEY)).toBe(initial);

    cleanup();
    await renderTarget(state, 'missing-journey');
    expect(await screen.findByRole('heading', { name: 'Journey not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Return to Journeys' })).toBeTruthy();
  });
});
