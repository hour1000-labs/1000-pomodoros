// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSeedAppState } from '@/lib/mock-data';
import type { AppState, OnboardingDraft } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository } from '@/lib/repository';
import { getRouter } from '@/router';

import { createOnboardingRecords, getNextStepError } from './onboarding-add-next-step';

const sampleNextStep = 'Practice the F chord transition';
const baseDraft: OnboardingDraft = {
  journeyName: 'Learn guitar',
  reason: 'Play songs with my family.',
  targetMinutes: 1_000 * 60,
  nextStepTitle: '',
  startedAt: '2026-07-15T17:00:00.000Z',
  updatedAt: '2026-07-15T17:05:00.000Z',
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.localStorage.clear();
});

function createJourneyFreeState(draft: OnboardingDraft | null): AppState {
  return {
    ...createSeedAppState(),
    journeys: [],
    nextSteps: [],
    focusSessions: [],
    milestones: [],
    weeklyGoal: null,
    onboardingDraft: draft,
    activeTimer: null,
    lastActiveJourneyId: null,
    lastCompletedSessionId: null,
  };
}

async function renderNextStep(state: AppState) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: ['/onboarding/next-step'] }),
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

describe('OnboardingAddNextStep', () => {
  it('renders the final step with the Learn guitar sample value and exact guidance', async () => {
    await renderNextStep(createJourneyFreeState(baseDraft));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Add your first Next step',
      })
    ).toBeTruthy();
    expect(screen.getByText('4 of 4')).toBeTruthy();
    expect(screen.getAllByText('Learn guitar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Choose one action for your first Focus session.')).toHaveLength(1);
    expect(document.querySelectorAll('aside [data-state]')).toHaveLength(10);
    expect(document.querySelectorAll('aside [data-state="future"]')).toHaveLength(10);

    const input = screen.getByRole('textbox', { name: 'Next step' });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect((input as HTMLInputElement).value).toBe(sampleNextStep);
    expect((input as HTMLInputElement).maxLength).toBe(120);
    expect(screen.getByRole('button', { name: 'Create Journey' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByText(/priority|due date|category|schedule/i)).toBeNull();
  });

  it('redirects to Journey creation when no onboarding draft exists', async () => {
    const router = await renderNextStep(createJourneyFreeState(null));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/journey');
    });
  });

  it('validates the trimmed 1 to 120 character boundary accessibly', async () => {
    expect(getNextStepError(' ')).toContain('concrete action');
    expect(getNextStepError(` ${'a'.repeat(120)} `)).toBeNull();
    expect(getNextStepError('a'.repeat(121))).toContain('120 characters');

    await renderNextStep(
      createJourneyFreeState({ ...baseDraft, journeyName: 'Write a book', nextStepTitle: '' })
    );
    const input = await screen.findByRole('textbox', { name: 'Next step' });

    fireEvent.blur(input);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Enter one concrete action');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('first-next-step-error');

    fireEvent.change(input, { target: { value: '  Draft the opening paragraph  ' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('saves the current input before going Back and restores it on return', async () => {
    const router = await renderNextStep(createJourneyFreeState(baseDraft));
    const input = await screen.findByRole('textbox', { name: 'Next step' });

    fireEvent.change(input, { target: { value: 'Practice a chord change slowly' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding/target');
    });
    expect(readSavedState().onboardingDraft?.nextStepTitle).toBe('Practice a chord change slowly');

    await router.navigate({ to: '/onboarding/next-step' });
    expect(
      ((await screen.findByRole('textbox', { name: 'Next step' })) as HTMLInputElement).value
    ).toBe('Practice a chord change slowly');
  });

  it('creates the Journey, current Next step, and first milestone once before opening Home', async () => {
    const finishOnboarding = vi.spyOn(appRepository, 'finishOnboarding');
    const router = await renderNextStep(createJourneyFreeState(baseDraft));
    const input = await screen.findByRole('textbox', { name: 'Next step' });

    fireEvent.change(input, { target: { value: '  Practice the intro slowly  ' } });
    const submit = screen.getByRole('button', { name: 'Create Journey' });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(screen.getByRole('button', { name: /Creating Journey/i }).hasAttribute('disabled')).toBe(
      true
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
    expect(router.history.length).toBe(1);
    expect(router.history.canGoBack()).toBe(false);
    expect(finishOnboarding).toHaveBeenCalledTimes(1);

    const state = readSavedState();
    const journey = state.journeys.find(({ id }) => id.startsWith('journey-onboarding-'));
    expect(state.journeys).toHaveLength(1);
    expect(journey?.name).toBe('Learn guitar');
    expect(journey?.reason).toBe(baseDraft.reason);
    expect(journey?.targetMinutes).toBe(baseDraft.targetMinutes);
    expect(state.lastActiveJourneyId).toBe(journey?.id);
    expect(state.onboardingDraft).toBeNull();

    const nextSteps = state.nextSteps.filter(({ journeyId }) => journeyId === journey?.id);
    expect(state.nextSteps).toHaveLength(1);
    expect(nextSteps).toHaveLength(1);
    expect(nextSteps[0]).toMatchObject({
      title: 'Practice the intro slowly',
      status: 'current',
      position: 0,
    });

    const milestones = state.milestones.filter(({ journeyId }) => journeyId === journey?.id);
    expect(state.milestones).toHaveLength(1);
    expect(milestones).toHaveLength(1);
    expect(milestones[0]).toMatchObject({
      name: '10 pomodoros',
      targetFocusedMinutes: 250,
      earnedAt: null,
    });
    expect(state.focusSessions).toHaveLength(0);
  });

  it('retains the draft and stays put when atomic Journey creation fails', async () => {
    vi.spyOn(appRepository, 'finishOnboarding').mockReturnValue({
      status: 'unavailable',
      state: null,
    });
    const router = await renderNextStep(createJourneyFreeState(baseDraft));

    fireEvent.click(await screen.findByRole('button', { name: 'Create Journey' }));

    expect(
      await screen.findByText(
        'Your Journey could not be created. Your draft is still saved. Try again.'
      )
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe('/onboarding/next-step');
    expect(readSavedState().onboardingDraft).toEqual(baseDraft);
    expect(screen.getByRole('button', { name: 'Create Journey' }).hasAttribute('disabled')).toBe(
      false
    );
  });
});

describe('createOnboardingRecords', () => {
  it('derives stable record IDs so retries are idempotent', () => {
    const first = createOnboardingRecords(baseDraft, sampleNextStep, '2026-07-15T17:10:00.000Z');
    const retry = createOnboardingRecords(baseDraft, sampleNextStep, '2026-07-15T17:11:00.000Z');

    expect(retry.journey.id).toBe(first.journey.id);
    expect(retry.nextStep.id).toBe(first.nextStep.id);
    expect(retry.milestone.id).toBe(first.milestone.id);
  });
});
