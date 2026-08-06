// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, OnboardingDraft } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

import { hoursToPomodoros } from './onboarding-choose-target';

const baseDraft: OnboardingDraft = {
  journeyName: 'Learn guitar',
  reason: 'Play songs with my family.',
  targetMinutes: 1_000 * 60,
  nextStepTitle: '',
  startedAt: '2026-07-14T17:00:00.000Z',
  updatedAt: '2026-07-14T17:00:00.000Z',
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function createState(draft: OnboardingDraft | null): AppState {
  return { ...createSeedAppState(), onboardingDraft: draft };
}

async function renderTarget(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: ['/onboarding/target'] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

function readSavedState() {
  const savedState = window.localStorage.getItem(APP_STORAGE_KEY);

  if (!savedState) throw new Error('Expected app state to be saved');

  return JSON.parse(savedState) as AppState;
}

describe('OnboardingChooseTarget', () => {
  it('renders step 3 with accessible numeric options and the 1,000-hour default', async () => {
    await renderTarget(createState(baseDraft));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Choose a focus target',
      })
    ).toBeTruthy();
    expect(screen.getByText('3 of 4')).toBeTruthy();
    expect(screen.getAllByText('Learn guitar').length).toBeGreaterThan(0);
    expect(screen.getByText('You can change it later.')).toBeTruthy();
    expect(document.querySelectorAll('aside [data-state]')).toHaveLength(32);
    expect(document.querySelectorAll('aside [data-state="complete"]')).toHaveLength(9);
    expect(document.querySelectorAll('aside [data-state="future"]')).toHaveLength(23);

    const targetGroup = screen.getByRole('group', { name: 'Focus target' });
    const radios = within(targetGroup).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(within(targetGroup).getByRole('radio', { name: /1,000 hours/i })).toBeTruthy();
    expect(
      (within(targetGroup).getByRole('radio', { name: /1,000 hours/i }) as HTMLInputElement).checked
    ).toBe(true);
    expect(within(targetGroup).getByText('2,400 Pomodoros')).toBeTruthy();

    for (const label of [/10 hours/i, /25 hours/i, /100 hours/i, /1,000 hours/i, /Custom/i]) {
      expect(within(targetGroup).getByRole('radio', { name: label })).toBeTruthy();
    }
    expect(screen.queryByText(/Easy|Serious|Hardcore/i)).toBeNull();
  });

  it('redirects to Journey creation when no onboarding draft exists', async () => {
    const router = await renderTarget(createState(null));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/journey');
    });
  });

  it('calculates pomodoros and saves a selected preset before continuing', async () => {
    expect(hoursToPomodoros(10)).toBe(24);
    expect(hoursToPomodoros(25)).toBe(60);
    expect(hoursToPomodoros(100)).toBe(240);
    expect(hoursToPomodoros(1_000)).toBe(2_400);

    const router = await renderTarget(createState(baseDraft));
    fireEvent.click(await screen.findByRole('radio', { name: /25 hours/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/next-step');
    });
    const savedDraft = readSavedState().onboardingDraft;
    expect(savedDraft?.targetMinutes).toBe(25 * 60);
    expect(savedDraft?.journeyName).toBe(baseDraft.journeyName);
    expect(savedDraft?.reason).toBe(baseDraft.reason);
    expect(savedDraft?.startedAt).toBe(baseDraft.startedAt);
  });

  it('reveals one custom input, validates its boundaries, and saves a valid target', async () => {
    const router = await renderTarget(createState(baseDraft));
    fireEvent.click(await screen.findByRole('radio', { name: /Custom/i }));

    const hoursInput = screen.getByRole('spinbutton', { name: 'Custom hours' });
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    expect((hoursInput as HTMLInputElement).min).toBe('1');
    expect((hoursInput as HTMLInputElement).max).toBe('10000');

    fireEvent.change(hoursInput, { target: { value: '0.99' } });
    fireEvent.blur(hoursInput);
    expect(screen.getByRole('alert').textContent).toContain('1 to 10,000 hours');
    expect(hoursInput.getAttribute('aria-describedby')).toBe('custom-target-error');

    fireEvent.change(hoursInput, { target: { value: '1' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('2.4 Pomodoros')).toBeTruthy();
    expect(hoursInput.getAttribute('aria-describedby')).toBe('custom-target-helper');

    fireEvent.change(hoursInput, { target: { value: '10000' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('24,000 Pomodoros')).toBeTruthy();

    fireEvent.change(hoursInput, { target: { value: '10000.01' } });
    expect(screen.getByRole('alert').textContent).toContain('1 to 10,000 hours');

    fireEvent.change(hoursInput, { target: { value: '12.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/next-step');
    });
    expect(readSavedState().onboardingDraft?.targetMinutes).toBe(750);
  });

  it('restores a saved custom target and provides a Back link to motivation', async () => {
    await renderTarget(createState({ ...baseDraft, targetMinutes: 750 }));

    expect(
      ((await screen.findByRole('radio', { name: /Custom/i })) as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (screen.getByRole('spinbutton', { name: 'Custom hours' }) as HTMLInputElement).value
    ).toBe('12.5');
    expect(screen.getByRole('link', { name: 'Back' }).getAttribute('href')).toBe(
      '/onboarding/motivation'
    );
  });
});
