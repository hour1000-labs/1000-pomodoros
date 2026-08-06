// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, OnboardingDraft } from '@/lib/models';
import { APP_STORAGE_KEY } from '@/lib/repository';
import { getRouter } from '@/router';

const sampleReason = 'I want to play my favorite songs confidently.';
const baseDraft: OnboardingDraft = {
  journeyName: 'Learn guitar',
  reason: '',
  targetMinutes: 60_000,
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

async function renderMotivation(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: ['/onboarding/motivation'] }),
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

describe('OnboardingAddMotivation', () => {
  it('renders the optional second step with the current Journey and restored sample reason', async () => {
    await renderMotivation(createState({ ...baseDraft, reason: sampleReason }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Why does it matter?',
      })
    ).toBeTruthy();
    expect(screen.getByText('2 of 4')).toBeTruthy();
    expect(screen.getAllByText('Learn guitar').length).toBeGreaterThan(0);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(document.querySelectorAll('aside [data-state]')).toHaveLength(32);
    expect(document.querySelectorAll('aside [data-state="complete"]')).toHaveLength(9);
    expect(document.querySelectorAll('aside [data-state="future"]')).toHaveLength(23);

    const reason = screen.getByRole('textbox', { name: /Reason/i });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect((reason as HTMLTextAreaElement).value).toBe(sampleReason);
    expect((reason as HTMLTextAreaElement).maxLength).toBe(240);
    expect(screen.getByText('Optional')).toBeTruthy();
  });

  it('redirects to Journey creation when no onboarding draft exists', async () => {
    const router = await renderMotivation(createState(null));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/journey');
    });
  });

  it('shows the character count only after 180 characters through the 240 limit', async () => {
    await renderMotivation(createState(baseDraft));
    const reason = await screen.findByRole('textbox', { name: /Reason/i });

    expect((reason as HTMLTextAreaElement).placeholder).toBe(sampleReason);
    fireEvent.change(reason, { target: { value: 'a'.repeat(180) } });
    expect(screen.queryByText('180 / 240')).toBeNull();

    fireEvent.change(reason, { target: { value: 'a'.repeat(181) } });
    expect(screen.getByText('181 / 240')).toBeTruthy();

    fireEvent.change(reason, { target: { value: 'a'.repeat(240) } });
    expect(screen.getByText('240 / 240')).toBeTruthy();
    expect((reason as HTMLTextAreaElement).value).toHaveLength(240);
  });

  it('saves the reason and preserves the draft before continuing to target selection', async () => {
    const router = await renderMotivation(createState(baseDraft));
    const reason = await screen.findByRole('textbox', { name: /Reason/i });

    fireEvent.change(reason, { target: { value: 'Play songs with my family.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/target');
    });
    const savedDraft = readSavedState().onboardingDraft;
    expect(savedDraft?.reason).toBe('Play songs with my family.');
    expect(savedDraft?.journeyName).toBe(baseDraft.journeyName);
    expect(savedDraft?.targetMinutes).toBe(baseDraft.targetMinutes);
    expect(savedDraft?.startedAt).toBe(baseDraft.startedAt);
  });

  it('clears a saved reason before skipping to target selection', async () => {
    const router = await renderMotivation(createState({ ...baseDraft, reason: sampleReason }));

    fireEvent.click(await screen.findByRole('button', { name: 'Skip for now' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/target');
    });
    expect(readSavedState().onboardingDraft?.reason).toBe('');
  });

  it('saves current text before going Back and restores it on return', async () => {
    const router = await renderMotivation(createState(baseDraft));
    const reason = await screen.findByRole('textbox', { name: /Reason/i });

    fireEvent.change(reason, { target: { value: 'Keep learning something difficult.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/journey');
    });
    expect(readSavedState().onboardingDraft?.reason).toBe('Keep learning something difficult.');

    await router.navigate({ to: '/onboarding/motivation' });
    const restoredReason = await screen.findByRole('textbox', { name: /Reason/i });
    expect((restoredReason as HTMLTextAreaElement).value).toBe(
      'Keep learning something difficult.'
    );
  });
});
