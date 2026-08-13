// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, OnboardingDraft } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

async function renderOnboarding(state?: AppState, initialEntry = '/onboarding/journey') {
  if (state) {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
  }

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
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

describe('OnboardingCreateJourney', () => {
  it('renders the single-field first step and focuses a new draft', async () => {
    await renderOnboarding();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Name your first Journey',
      })
    ).toBeTruthy();
    expect(screen.getByText('1 of 4')).toBeTruthy();
    expect(screen.getByText('Track focused work, one pomodoro at a time.')).toBeTruthy();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(document.querySelector('aside')).toBeNull();
    expect(document.querySelectorAll('[data-pomodoro-tomato]')).toHaveLength(0);

    const journeyName = screen.getByRole('textbox', { name: 'Journey name' });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect((journeyName as HTMLInputElement).placeholder).toBe('Learn guitar');
    expect(document.activeElement).toBe(journeyName);
    expect(screen.getByRole('button', { name: 'Continue' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('link', { name: 'Exit' }).getAttribute('href')).toBe('/');

    for (const example of ['Learn Spanish', 'Build my portfolio', 'Improve at chess']) {
      expect(screen.getByRole('button', { name: example })).toBeTruthy();
    }
  });

  it('starts a fresh additional Journey without replacing existing Journeys', async () => {
    const state = createSeedAppState();
    state.onboardingDraft = {
      journeyName: 'Old draft',
      reason: 'Old reason',
      targetMinutes: 60_000,
      nextStepTitle: 'Old step',
      startedAt: '2026-07-13T17:00:00.000Z',
      updatedAt: '2026-07-13T17:00:00.000Z',
    };

    await renderOnboarding(state, '/onboarding/journey?fresh=true');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Name your next Journey',
      })
    ).toBeTruthy();
    expect((screen.getByRole('textbox', { name: 'Journey name' }) as HTMLInputElement).value).toBe(
      ''
    );

    await waitFor(() => {
      const savedState = readSavedState();
      expect(savedState.onboardingDraft).toBeNull();
      expect(savedState.journeys).toHaveLength(1);
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Journey name' }), {
      target: { value: 'Learn piano' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('2 of 4')).toBeTruthy();
    });
    expect(readSavedState().onboardingDraft?.journeyName).toBe('Learn piano');
  });

  it('delays validation and accepts trimmed names from 1–80 characters', async () => {
    await renderOnboarding();
    const journeyName = await screen.findByRole('textbox', {
      name: 'Journey name',
    });

    expect(screen.queryByText('Enter a Journey name to continue.')).toBeNull();
    fireEvent.blur(journeyName);
    expect(screen.getByText('Enter a Journey name to continue.')).toBeTruthy();

    fireEvent.change(journeyName, { target: { value: 'a'.repeat(81) } });
    expect(screen.getByText('Journey name must be 80 characters or fewer.')).toBeTruthy();

    fireEvent.change(journeyName, { target: { value: 'a'.repeat(80) } });
    expect(screen.queryByText('Journey name must be 80 characters or fewer.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' }).hasAttribute('disabled')).toBe(false);

    fireEvent.change(journeyName, { target: { value: '  x  ' } });
    expect(screen.getByRole('button', { name: 'Continue' }).hasAttribute('disabled')).toBe(false);
  });

  it('trims and saves the Journey draft before continuing', async () => {
    const router = await renderOnboarding();
    const journeyName = await screen.findByRole('textbox', {
      name: 'Journey name',
    });

    fireEvent.change(journeyName, { target: { value: '  Learn guitar  ' } });
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueButton);

    expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/motivation');
    });
    expect(readSavedState().onboardingDraft?.journeyName).toBe('Learn guitar');
    expect(readSavedState().onboardingDraft?.targetMinutes).toBe(25_000);
  });

  it('restores a populated draft without stealing focus', async () => {
    const draft: OnboardingDraft = {
      journeyName: 'Build my portfolio',
      reason: '',
      targetMinutes: 60_000,
      nextStepTitle: '',
      startedAt: '2026-07-13T17:00:00.000Z',
      updatedAt: '2026-07-13T17:00:00.000Z',
    };
    await renderOnboarding({ ...createSeedAppState(), onboardingDraft: draft });
    const journeyName = await screen.findByRole('textbox', {
      name: 'Journey name',
    });

    expect((journeyName as HTMLInputElement).value).toBe('Build my portfolio');
    expect(document.activeElement).not.toBe(journeyName);
  });

  it('requires the confirmation action when a saved draft would be lost', async () => {
    const draft: OnboardingDraft = {
      journeyName: 'Learn Spanish',
      reason: '',
      targetMinutes: 60_000,
      nextStepTitle: '',
      startedAt: '2026-07-13T17:00:00.000Z',
      updatedAt: '2026-07-13T17:00:00.000Z',
    };
    await renderOnboarding({
      ...createSeedAppState(),
      onboardingDraft: draft,
    });

    expect(await screen.findByRole('button', { name: 'Exit' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Exit' })).toBeNull();
  });
});
