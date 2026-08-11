// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSeedAppState,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { AppState, FocusSession, Journey, NextStep } from '@/lib/models';
import { APP_STORAGE_KEY, appRepository, RepositoryError } from '@/lib/repository';
import { getRouter } from '@/router';

import { resolveFocusSelection } from '../focus/focus-session-screen';
import { deriveHomeData } from './home-data';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  window.localStorage.clear();
});

async function renderJourney(state: AppState, journeyId = LEARN_GUITAR_JOURNEY_ID) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [`/journeys/${journeyId}`] }),
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

function createDomRect({
  top,
  left,
  width,
  height,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
}) {
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function getLocalDateOffset(daysFromToday: number) {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysFromToday, 12);
}

function formatDateInput(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, '0')))
    .join('-');
}

function createStreakTimerSession(id: string, endedAt: Date): FocusSession {
  return {
    id,
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
    plannedMinutes: 25,
    focusedMinutes: 25,
    status: 'completed',
    source: 'timer',
    startedAt: new Date(endedAt.getTime() - 25 * 60 * 1_000).toISOString(),
    endedAt: endedAt.toISOString(),
    reflection: '',
  };
}

function mockUpcomingListGeometry(list: HTMLElement, rowHeight = 80) {
  vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(
    createDomRect({
      top: 0,
      left: 0,
      width: 320,
      height: list.children.length * rowHeight,
    })
  );
  for (const row of list.querySelectorAll<HTMLElement>('[data-next-step-id]')) {
    vi.spyOn(row, 'getBoundingClientRect').mockImplementation(() => {
      const index = Array.from(list.children).indexOf(row);
      const translateY = Number.parseFloat(
        row.style.transform.match(/translate3d\(0, (-?[\d.]+)px, 0\)/)?.[1] ?? '0'
      );
      return createDomRect({
        top: index * rowHeight + translateY,
        left: 0,
        width: 320,
        height: rowHeight,
      });
    });
  }
}

function openDropdownMenu(label: string) {
  const trigger = screen.getByRole('button', { name: label });
  fireEvent.keyDown(trigger, { key: 'Enter' });
  const menu = document.querySelector<HTMLElement>('[role="menu"]');
  if (menu === null) throw new Error(`Expected the ${label} menu to open`);
  return { menu, trigger };
}

function openNextStepMenu(title: string) {
  return openDropdownMenu(`More actions for ${title}`).menu;
}

function getUpcomingAnnouncement() {
  const announcement = document.querySelector<HTMLElement>(
    '[aria-live="assertive"][aria-atomic="true"]'
  );
  if (announcement === null) throw new Error('Expected the Upcoming steps announcement region');
  return announcement;
}

function getPopulatedUpcomingLiveRegions() {
  const section = screen.getByRole('heading', { name: 'Next steps' }).closest('section');
  if (section === null) throw new Error('Expected the Next steps section');

  return Array.from(
    section.querySelectorAll<HTMLElement>('[aria-live], [role="status"], [role="alert"]')
  ).filter((element) => element.textContent?.trim());
}

async function finishDeferredFocusHandoff() {
  await act(async () => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  });
}

function createSecondJourneyState() {
  const state = createSeedAppState();
  const journey: Journey = {
    id: 'journey-write-book',
    name: 'Write a book',
    reason: 'Finish a manuscript I am proud to share.',
    targetMinutes: 1_000 * 60,
    status: 'active',
    createdAt: '2026-07-16T18:00:00.000Z',
    updatedAt: '2026-07-16T18:00:00.000Z',
    lastActiveAt: '2026-07-16T18:00:00.000Z',
  };
  const nextStep: NextStep = {
    id: 'next-step-outline-chapter',
    journeyId: journey.id,
    title: 'Outline the first chapter',
    description: '',
    status: 'current',
    position: 0,
    createdAt: journey.createdAt,
    completedAt: null,
  };

  state.journeys.push(journey);
  state.nextSteps.push(nextStep);

  return { state, journey, nextStep };
}

describe('JourneyDetailScreen', () => {
  it('shows the Journey layout loading state while persisted data is unavailable', async () => {
    vi.spyOn(appRepository, 'load').mockReturnValue({
      status: 'unavailable',
      state: null,
      seeded: false,
    });

    await renderJourney(createSeedAppState());

    expect(screen.getByLabelText('Loading saved progress')).toBeTruthy();
  });

  it('shows a recoverable load error and retries without resetting saved progress', async () => {
    const originalLoad = appRepository.load;
    const load = vi
      .spyOn(appRepository, 'load')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        seeded: false,
        error: new RepositoryError('storage-read-failed', 'Simulated read failure'),
      })
      .mockImplementation(originalLoad);

    await renderJourney(createSeedAppState());

    expect(
      await screen.findByRole('heading', { name: 'We could not load your saved progress' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset saved progress' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('renders the seeded metrics, current section, and a bounded progressive full view', async () => {
    await renderJourney(createSeedAppState());

    expect(await screen.findByRole('heading', { level: 1, name: 'Learn guitar' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: '1000 Pomodoros' })).toBeNull();
    const journeysNavigation = screen.getByRole('link', { name: 'Journeys' });
    expect(journeysNavigation.getAttribute('href')).toBe('/journeys');
    expect(journeysNavigation.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('link', { name: 'Journey' })).toBeNull();
    expect(screen.getByText('17 hours 55 minutes')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '43 Pomodoros' })).toBeTruthy();
    expect(screen.getByText('72% · 17 pomodoros remaining')).toBeTruthy();
    expect(screen.getByText('25 focused hours')).toBeTruthy();
    const legend = screen.getByRole('list', { name: 'Pomodoro grid legend' });
    expect(within(legend).getByText('Complete')).toBeTruthy();
    expect(within(legend).getByText('Partial')).toBeTruthy();
    expect(within(legend).getByText('Future')).toBeTruthy();
    expect(within(legend).getByText('Latest')).toBeTruthy();
    expect(within(legend).getByText('Milestone')).toBeTruthy();
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(100);

    fireEvent.click(screen.getByRole('button', { name: 'View full Journey' }));

    expect(screen.getByText('3 of 24 sections')).toBeTruthy();
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(300);
    expect(screen.queryByLabelText('Pomodoro 301: future')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more sections' }));
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(600);
  });

  it('keeps a later current-progress section visible when full Journey opens', async () => {
    const state = createSeedAppState();
    state.focusSessions = [
      {
        id: 'session-later-section',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
        plannedMinutes: 410 * 25,
        focusedMinutes: 410 * 25,
        status: 'completed',
        source: 'manual',
        startedAt: '2026-07-16T17:00:00.000Z',
        endedAt: '2026-07-16T18:00:00.000Z',
        reflection: '',
      },
    ];
    await renderJourney(state);

    expect(document.querySelector('[data-pomodoro-index="400"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'View full Journey' }));

    expect(screen.getByText('4 of 24 sections')).toBeTruthy();
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(400);
    expect(document.querySelector('[data-pomodoro-index="400"]')).not.toBeNull();
    expect(document.querySelector('[data-pomodoro-index="300"]')).toBeNull();
  });

  it('uses typed focus search parameters even when another Journey is most recent', async () => {
    const { state, journey, nextStep } = createSecondJourneyState();
    await renderJourney(state, journey.id);

    const startLinks = await screen.findAllByRole('link', {
      name: `Start 25:00 for ${nextStep.title}`,
    });

    expect(startLinks).toHaveLength(2);
    for (const link of startLinks) {
      const url = new URL(link.getAttribute('href') ?? '', 'http://localhost');
      expect(url.pathname).toBe('/focus');
      expect(url.searchParams.get('journeyId')).toBe(journey.id);
      expect(url.searchParams.get('nextStepId')).toBe(nextStep.id);
    }
  });

  it('opens Pomodoro details from inspectable progress', async () => {
    await renderJourney(createSeedAppState());

    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the first pomodoro to be inspectable');
    expect(block.getAttribute('aria-label')).toMatch(/^Pomodoro 1: complete/);
    expect(block.getAttribute('aria-haspopup')).toBe('dialog');
    expect(block.getAttribute('aria-controls')).toBe('journey-block-detail-dialog');
    block.focus();
    fireEvent.click(block);

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) throw new Error('Expected the block detail dialog to open');
    expect(block.getAttribute('aria-expanded')).toBe('true');
    expect(dialog?.textContent).toContain('Pomodoro 1');
    expect(dialog?.textContent).toContain('Posture, tuning & open E minor chord');
    expect(dialog?.textContent).toContain('Timer');

    const closeButton = dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]');
    if (!closeButton) throw new Error('Expected the block detail dialog to have a close button');
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(document.activeElement).toBe(block);
    expect(block.getAttribute('aria-expanded')).toBe('false');
  });

  it('lists every contributor when timer and manual sessions share one Pomodoro', async () => {
    const state = createSeedAppState();
    const timerSession: FocusSession = {
      id: 'session-timer-partial',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      plannedMinutes: 10,
      focusedMinutes: 10,
      status: 'completed',
      source: 'timer',
      startedAt: '2026-07-16T17:50:00.000Z',
      endedAt: '2026-07-16T18:00:00.000Z',
      reflection: '',
    };
    const manualSession: FocusSession = {
      ...timerSession,
      id: 'session-manual-partial',
      plannedMinutes: 15,
      focusedMinutes: 15,
      source: 'manual',
      startedAt: '2026-07-16T18:05:00.000Z',
      endedAt: '2026-07-16T18:20:00.000Z',
    };
    state.focusSessions = [manualSession, timerSession];

    await renderJourney(state);
    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the shared pomodoro to be inspectable');
    fireEvent.click(block);

    const dialog = await screen.findByRole('dialog', { name: 'Pomodoro 1' });
    expect(within(dialog).getByText('2 Focus sessions added time to this Pomodoro.')).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/\bblock\b/i);
    expect(within(dialog).getByText('Timer')).toBeTruthy();
    expect(within(dialog).getByText('Added manually')).toBeTruthy();
    expect(within(dialog).getAllByText('Practice the F chord transition')).toHaveLength(2);
  });

  it('records a forgotten session from a tomato and appends it to the matching date', async () => {
    const state = createSeedAppState();
    const existingSession: FocusSession = {
      id: 'session-existing-date',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      plannedMinutes: 10,
      focusedMinutes: 10,
      status: 'completed',
      source: 'timer',
      startedAt: '2026-08-05T17:50:00.000Z',
      endedAt: '2026-08-05T18:00:00.000Z',
      reflection: '',
    };
    state.focusSessions = [existingSession];

    await renderJourney(state);

    const block = screen.getByRole('button', { name: /^Pomodoro 1: partial, 40% filled/ });
    fireEvent.click(block);

    const dialog = await screen.findByRole('dialog', { name: 'Pomodoro 1' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Forgot to start a session?' }));
    fireEvent.change(within(dialog).getByLabelText('Completed date'), {
      target: { value: '2026-08-05' },
    });
    fireEvent.change(within(dialog).getByLabelText('Next step worked on'), {
      target: { value: LEARN_GUITAR_CURRENT_STEP_ID },
    });
    fireEvent.change(within(dialog).getByLabelText('Focused minutes'), {
      target: { value: '15' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add session' }));

    await waitFor(() => {
      const saved = readSavedState();
      expect(saved.focusSessions).toHaveLength(2);
      expect(saved.focusSessions[1]).toMatchObject({
        focusedMinutes: 15,
        source: 'manual',
        nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      });
    });
    expect(
      await within(dialog).findByText('2 Focus sessions added time to this Pomodoro.')
    ).toBeTruthy();
    expect(within(dialog).getAllByText('Added manually').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('Streak impact')).toBeTruthy();
    expect(
      within(dialog).getByText('This date was already covered. Streak unchanged.')
    ).toBeTruthy();
    expect(block.getAttribute('data-fill-percent')).toBe('100');
  });

  it('reports a newly counted current day in the manual-session confirmation', async () => {
    const state = createSeedAppState();
    state.focusSessions = [createStreakTimerSession('session-yesterday', getLocalDateOffset(-1))];

    await renderJourney(state);

    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the first pomodoro to be inspectable');
    fireEvent.click(block);
    const dialog = await screen.findByRole('dialog', { name: 'Pomodoro 1' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Forgot to start a session?' }));
    fireEvent.change(within(dialog).getByLabelText('Focused minutes'), {
      target: { value: '5' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add session' }));

    const status = await within(dialog).findByRole('status');
    expect(within(status).getByText('Streak impact')).toBeTruthy();
    expect(within(status).getByText('This date now counts · 2-day current streak.')).toBeTruthy();
  });

  it('describes an older counted date without claiming a zero-day current streak', async () => {
    const state = createSeedAppState();
    state.focusSessions = [
      createStreakTimerSession('session-old-history', getLocalDateOffset(-10)),
    ];

    await renderJourney(state);

    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the first pomodoro to be inspectable');
    fireEvent.click(block);
    const dialog = await screen.findByRole('dialog', { name: 'Pomodoro 1' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Forgot to start a session?' }));
    fireEvent.change(within(dialog).getByLabelText('Completed date'), {
      target: { value: formatDateInput(getLocalDateOffset(-8)) },
    });
    fireEvent.change(within(dialog).getByLabelText('Focused minutes'), {
      target: { value: '5' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add session' }));

    const status = await within(dialog).findByRole('status');
    expect(within(status).getByText('This date now counts · History recalculated.')).toBeTruthy();
    expect(within(status).queryByText(/0-day current streak/)).toBeNull();
  });

  it('explains restored history and a returned freeze after a manual backfill', async () => {
    const state = createSeedAppState();
    const missedDate = getLocalDateOffset(-3);
    const practicedOffsets = [-10, -9, -8, -7, -6, -5, -4, -2, -1, 0];
    state.focusSessions = practicedOffsets.map((offset) =>
      createStreakTimerSession(`session-day-${offset}`, getLocalDateOffset(offset))
    );

    await renderJourney(state);

    const block = document.querySelector<HTMLButtonElement>('[data-pomodoro-index="0"]');
    if (!block) throw new Error('Expected the first pomodoro to be inspectable');
    fireEvent.click(block);
    const dialog = await screen.findByRole('dialog', { name: 'Pomodoro 1' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Forgot to start a session?' }));
    fireEvent.change(within(dialog).getByLabelText('Completed date'), {
      target: { value: formatDateInput(missedDate) },
    });
    fireEvent.change(within(dialog).getByLabelText('Focused minutes'), {
      target: { value: '5' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add session' }));

    const status = await within(dialog).findByRole('status');
    expect(
      within(status).getByText(
        'History restored · 11-day current streak · 1 streak freeze returned · 1 freeze available.'
      )
    ).toBeTruthy();
  });

  it('renames a Journey and its current Next step with trimmed values', async () => {
    await renderJourney(createSeedAppState());

    let menu = openDropdownMenu('Journey actions for Learn guitar').menu;
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit name' }));
    let dialog = screen.getByRole('dialog', { name: 'Edit Journey name' });
    const journeyInput = within(dialog).getByLabelText<HTMLInputElement>('Journey name');
    expect(journeyInput.value).toBe('Learn guitar');
    fireEvent.change(journeyInput, { target: { value: '  Practice guitar  ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));

    await waitFor(() => {
      expect(readSavedState().journeys[0]?.name).toBe('Practice guitar');
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Practice guitar' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Journey actions for Practice guitar' })
    ).toBeTruthy();

    menu = openDropdownMenu('Next step actions for Practice the F chord transition').menu;
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit name' }));
    dialog = screen.getByRole('dialog', { name: 'Edit Next step name' });
    const nextStepInput = within(dialog).getByLabelText<HTMLInputElement>('Next step');
    expect(nextStepInput.value).toBe('Practice the F chord transition');
    fireEvent.change(nextStepInput, { target: { value: '  Practice the F shape  ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));

    await waitFor(() => {
      expect(
        readSavedState().nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)
      ).toMatchObject({
        title: 'Practice the F shape',
        status: 'current',
        position: 5,
      });
    });
    expect(screen.getByRole('heading', { name: 'Practice the F shape' })).toBeTruthy();
  });

  it('renames an upcoming Next step from its action menu and restores menu focus', async () => {
    await renderJourney(createSeedAppState());
    const originalTitle = 'Practice the verse strumming pattern';
    const trigger = screen.getByRole('button', { name: `More actions for ${originalTitle}` });
    const menu = openNextStepMenu(originalTitle);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit name' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Next step name' });
    fireEvent.change(within(dialog).getByLabelText('Next step'), {
      target: { value: 'Review the verse rhythm' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));

    await waitFor(() => {
      expect(
        readSavedState().nextSteps.find(({ title }) => title === 'Review the verse rhythm')
      ).toMatchObject({
        id: 'next-step-strumming-pattern',
        status: 'upcoming',
        position: 6,
      });
    });
    expect(screen.getByText('Review the verse rhythm')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More actions for Review the verse rhythm' })).toBe(
      trigger
    );
  });

  it('keeps invalid rename values unsaved and reports the existing boundaries', async () => {
    await renderJourney(createSeedAppState());

    let menu = openDropdownMenu('Journey actions for Learn guitar').menu;
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit name' }));
    let dialog = screen.getByRole('dialog', { name: 'Edit Journey name' });
    fireEvent.change(within(dialog).getByLabelText('Journey name'), {
      target: { value: 'x'.repeat(81) },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(within(dialog).getByText('Journey name must be 80 characters or fewer.')).toBeTruthy();
    expect(readSavedState().journeys[0]?.name).toBe('Learn guitar');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    const title = 'Practice the verse strumming pattern';
    menu = openNextStepMenu(title);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit name' }));
    dialog = await screen.findByRole('dialog', { name: 'Edit Next step name' });
    fireEvent.change(within(dialog).getByLabelText('Next step'), {
      target: { value: 'x'.repeat(121) },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(
      within(dialog).getByText('Keep your Next step to 120 characters or fewer.')
    ).toBeTruthy();
    expect(
      readSavedState().nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')?.title
    ).toBe(title);
  });

  it('keeps a Journey rename open and recoverable when persistence fails', async () => {
    vi.spyOn(appRepository, 'renameJourney').mockReturnValue({
      status: 'error',
      state: null,
      error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
    });
    await renderJourney(createSeedAppState());

    const menu = openDropdownMenu('Journey actions for Learn guitar').menu;
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit name' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Journey name' });
    const input = within(dialog).getByLabelText<HTMLInputElement>('Journey name');
    fireEvent.change(input, { target: { value: 'Retry this Journey name' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));

    expect(
      within(dialog).getByText('Your Journey name could not be saved. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(input.value).toBe('Retry this Journey name');
    expect(readSavedState().journeys[0]?.name).toBe('Learn guitar');
  });

  it('adds an upcoming Next step and persists it once', async () => {
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Add Next step' }));
    fireEvent.change(screen.getByLabelText('Next step'), {
      target: { value: 'Review chord transitions' },
    });
    const dialog = screen.getByRole('dialog', { name: 'Add a Next step' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Next step' }));

    await waitFor(() => {
      const matchingSteps = readSavedState().nextSteps.filter(
        ({ title }) => title === 'Review chord transitions'
      );
      expect(matchingSteps).toHaveLength(1);
      expect(matchingSteps[0]?.status).toBe('upcoming');
    });
    expect(await screen.findByText('Review chord transitions')).toBeTruthy();
  });

  it('keeps an unsaved Next step available and retries with the same identity', async () => {
    const originalAddNextStep = appRepository.addNextStep;
    const addNextStep = vi
      .spyOn(appRepository, 'addNextStep')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      })
      .mockImplementation(originalAddNextStep);
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Add Next step' }));
    fireEvent.change(screen.getByLabelText('Next step'), {
      target: { value: 'Retry this concrete step' },
    });
    const dialog = screen.getByRole('dialog', { name: 'Add a Next step' });
    const submit = within(dialog).getByRole('button', { name: 'Add Next step' });
    fireEvent.click(submit);

    expect(
      await within(dialog).findByText(
        'Your Next step could not be saved. Nothing changed. Try again.'
      )
    ).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Next step').value).toBe(
      'Retry this concrete step'
    );

    fireEvent.click(submit);
    await waitFor(() =>
      expect(
        readSavedState().nextSteps.filter(({ title }) => title === 'Retry this concrete step')
      ).toHaveLength(1)
    );
    expect(addNextStep).toHaveBeenCalledTimes(2);
    expect(addNextStep.mock.calls[0]?.[2]).toBe(addNextStep.mock.calls[1]?.[2]);
    expect(addNextStep.mock.calls[0]?.[3]).toBe(addNextStep.mock.calls[1]?.[3]);
  });

  it('reorders Upcoming steps with the keyboard and promotes the new first step next', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const observedAnnouncements: string[] = [];
    const announcement = getUpcomingAnnouncement();
    const observer = new MutationObserver(() => {
      observedAnnouncements.push(announcement.textContent ?? '');
    });
    observer.observe(announcement, { characterData: true, childList: true, subtree: true });
    const handle = await screen.findByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });
    handle.focus();

    fireEvent.keyDown(handle, { key: ' ' });
    expect(handle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(new RegExp(`${title} picked up at position 1 of 2`))).toBeTruthy();

    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(screen.getByText(`${title} is already at position 1 of 2.`)).toBeTruthy();
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(screen.getByText(`${title} moved to position 2 of 2.`)).toBeTruthy();
    await waitFor(() =>
      expect(observedAnnouncements).toContain(`${title} moved to position 2 of 2.`)
    );
    fireEvent.keyDown(handle, { key: ' ' });

    await waitFor(() =>
      expect(getUpcomingAnnouncement().textContent).toBe(
        `${title} dropped at position 2 of 2. Order saved.`
      )
    );
    expect(observedAnnouncements).toContain(`${title} dropped at position 2 of 2. Order saved.`);
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
    observer.disconnect();

    await waitFor(() => {
      const upcoming = readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position);
      expect(upcoming.map(({ id }) => id)).toEqual([
        'next-step-play-first-song',
        'next-step-strumming-pattern',
      ]);
      expect(upcoming.map(({ position }) => position)).toEqual([1, 2]);
    });
    const movedHandle = screen.getByRole('button', {
      name: `Reorder ${title}, position 2 of 2`,
    });
    expect(document.activeElement).toBe(movedHandle);

    fireEvent.keyDown(movedHandle, { key: 'Enter' });
    fireEvent.keyDown(movedHandle, { key: 'ArrowUp' });
    fireEvent.keyDown(movedHandle, { key: 'Escape' });
    expect(
      screen.getByText(`Reordering ${title} cancelled. The order did not change.`)
    ).toBeTruthy();
    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-play-first-song', 'next-step-strumming-pattern']);
    expect(document.activeElement).toBe(movedHandle);

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(
      await screen.findByRole('heading', { name: 'Play the first song from start to finish' })
    ).toBeTruthy();
  });

  it('repairs a same-order zero-current queue and focuses the promoted current action', async () => {
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map(
      (step): NextStep =>
        step.id === LEARN_GUITAR_CURRENT_STEP_ID ? { ...step, status: 'upcoming' } : step
    );
    await renderJourney(state);
    const title = 'Practice the F chord transition';
    const handle = await screen.findByRole('button', {
      name: `Reorder ${title}, position 1 of 3`,
    });

    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: ' ' });

    await waitFor(() => {
      const activeSteps = readSavedState()
        .nextSteps.filter(
          ({ journeyId, status }) =>
            journeyId === LEARN_GUITAR_JOURNEY_ID && (status === 'current' || status === 'upcoming')
        )
        .sort((left, right) => left.position - right.position);
      expect(activeSteps.map(({ id, position, status }) => ({ id, position, status }))).toEqual([
        { id: LEARN_GUITAR_CURRENT_STEP_ID, position: 0, status: 'current' },
        { id: 'next-step-strumming-pattern', position: 1, status: 'upcoming' },
        { id: 'next-step-play-first-song', position: 2, status: 'upcoming' },
      ]);
    });

    const upcomingList = screen.getByRole('list', { name: 'Upcoming Next steps' });
    expect(within(upcomingList).queryByText(title)).toBeNull();
    expect(
      within(upcomingList).getByRole('button', {
        name: 'Reorder Practice the verse strumming pattern, position 1 of 2',
      })
    ).toBeTruthy();
    expect(getUpcomingAnnouncement().textContent).toBe(
      `${title} is now your current Next step. Upcoming order saved.`
    );
    await finishDeferredFocusHandoff();
    expect(screen.getAllByRole('link', { name: `Start 25:00 for ${title}` })).toContain(
      document.activeElement
    );
  });

  it('keeps focus on a moved Upcoming handle when normalization promotes a different step', async () => {
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map(
      (step): NextStep =>
        step.id === LEARN_GUITAR_CURRENT_STEP_ID ? { ...step, status: 'upcoming' } : step
    );
    await renderJourney(state);
    const movedTitle = 'Practice the F chord transition';
    const promotedTitle = 'Practice the verse strumming pattern';
    const handle = screen.getByRole('button', {
      name: `Reorder ${movedTitle}, position 1 of 3`,
    });

    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: ' ' });
    await finishDeferredFocusHandoff();

    expect(
      readSavedState().nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ position: 0, status: 'current' });
    const movedHandle = screen.getByRole('button', {
      name: `Reorder ${movedTitle}, position 1 of 2`,
    });
    expect(document.activeElement).toBe(movedHandle);
    expect(getUpcomingAnnouncement().textContent).toBe(
      `${movedTitle} dropped at position 1 of 2. Order saved. ${promotedTitle} is now your current Next step.`
    );
  });

  it('cancels a keyboard drag before Tab or blur moves focus away', async () => {
    const reorderUpcomingNextSteps = vi.spyOn(appRepository, 'reorderUpcomingNextSteps');
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    let handle = screen.getByRole<HTMLButtonElement>('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });
    const menuTrigger = screen.getByRole<HTMLButtonElement>('button', {
      name: `More actions for ${title}`,
    });

    handle.focus();
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'Tab' });
    menuTrigger.focus();

    handle = screen.getByRole('button', { name: `Reorder ${title}, position 1 of 2` });
    expect(handle.getAttribute('aria-pressed')).toBe('false');
    expect(document.activeElement).toBe(menuTrigger);
    expect(getUpcomingAnnouncement().textContent).toBe(
      `Reordering ${title} cancelled. The order did not change.`
    );

    handle.focus();
    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    const addButton = screen.getByRole('button', { name: 'Add Next step' });
    fireEvent.blur(handle, { relatedTarget: addButton });
    addButton.focus();

    expect(
      screen
        .getByRole('button', { name: `Reorder ${title}, position 1 of 2` })
        .getAttribute('aria-pressed')
    ).toBe('false');
    expect(reorderUpcomingNextSteps).not.toHaveBeenCalled();
    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-strumming-pattern', 'next-step-play-first-song']);
  });

  it('reorders with touch-style pointer input without visible move feedback', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });
    const siblingRow = screen
      .getByText('Play the first song from start to finish')
      .closest('[data-next-step-id]');

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 1,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });
    expect(handle.closest('[data-next-step-id]')?.getAttribute('style')).toContain(
      'translate3d(0, 120px, 0)'
    );
    expect(siblingRow?.getAttribute('style')).toContain('translate3d(0, -80px, 0)');
    fireEvent.pointerUp(handle, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });
    fireEvent.lostPointerCapture(handle, { pointerId: 1, pointerType: 'touch' });
    await finishDeferredFocusHandoff();

    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-play-first-song', 'next-step-strumming-pattern']);
    expect(getUpcomingAnnouncement().textContent).toBe(
      `${title} dropped at position 2 of 2. Order saved.`
    );
    expect(screen.queryByText(/Moved “.*” to position/)).toBeNull();
  });

  it('announces pointer movement only when the projected position changes', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });
    const announcement = getUpcomingAnnouncement();
    const initialMessage = announcement.firstElementChild;

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 31,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 31,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 30,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 31,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 40,
    });

    expect(announcement.textContent).toBe('');
    expect(announcement.firstElementChild).toBe(initialMessage);

    fireEvent.pointerMove(handle, {
      pointerId: 31,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 140,
    });
    const movedMessage = announcement.firstElementChild;
    expect(announcement.textContent).toBe(`${title} moved to position 2 of 2.`);
    expect(movedMessage).not.toBe(initialMessage);

    fireEvent.pointerMove(handle, {
      pointerId: 31,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 150,
    });

    expect(announcement.textContent).toBe(`${title} moved to position 2 of 2.`);
    expect(announcement.firstElementChild).toBe(movedMessage);

    fireEvent.pointerCancel(handle, {
      pointerId: 31,
      pointerType: 'mouse',
    });
  });

  it('remounts the live region for repeated unchanged pointer drops', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);

    async function dropWithoutChangingOrder(pointerId: number) {
      const handle = screen.getByRole('button', {
        name: `Reorder ${title}, position 1 of 2`,
      });
      fireEvent.pointerDown(handle, {
        button: 0,
        pointerId,
        pointerType: 'mouse',
        clientX: 20,
        clientY: 20,
      });
      fireEvent.pointerUp(handle, {
        pointerId,
        pointerType: 'mouse',
        clientX: 20,
        clientY: 28,
      });
      await finishDeferredFocusHandoff();
      await waitFor(() =>
        expect(
          screen.getByRole<HTMLButtonElement>('button', {
            name: `Reorder ${title}, position 1 of 2`,
          }).disabled
        ).toBe(false)
      );
    }

    await dropWithoutChangingOrder(11);
    const firstAnnouncement = getUpcomingAnnouncement();
    const firstMessage = firstAnnouncement.firstElementChild;
    expect(firstAnnouncement.textContent).toBe(
      `${title} dropped at position 1 of 2. The order did not change.`
    );

    await dropWithoutChangingOrder(12);
    const repeatedAnnouncement = getUpcomingAnnouncement();
    expect(repeatedAnnouncement.textContent).toBe(firstAnnouncement.textContent);
    expect(repeatedAnnouncement).toBe(firstAnnouncement);
    expect(repeatedAnnouncement.firstElementChild).not.toBe(firstMessage);
  });

  it('cancels a pointer drop outside the visible Upcoming list', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 2,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });
    expect(screen.getByText(`${title} moved to position 2 of 2.`)).toBeTruthy();
    fireEvent.pointerUp(handle, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 400,
      clientY: 140,
    });

    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-strumming-pattern', 'next-step-play-first-song']);
    expect(
      screen.getByText(`Reordering ${title} cancelled. The order did not change.`)
    ).toBeTruthy();
  });

  it('cancels on lost pointer capture and ignores the paired late pointer event', async () => {
    const reorderUpcomingNextSteps = vi.spyOn(appRepository, 'reorderUpcomingNextSteps');
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 22,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 22,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });
    fireEvent.lostPointerCapture(handle, { pointerId: 22, pointerType: 'touch' });

    const cancellation = `Reordering ${title} cancelled. The order did not change.`;
    expect(getUpcomingAnnouncement().textContent).toBe(cancellation);
    expect(handle.getAttribute('aria-pressed')).toBe('false');

    fireEvent.pointerUp(handle, {
      pointerId: 22,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });

    expect(reorderUpcomingNextSteps).not.toHaveBeenCalled();
    expect(getUpcomingAnnouncement().textContent).toBe(cancellation);
    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-strumming-pattern', 'next-step-play-first-song']);
  });

  it('auto-scrolls the mobile content pane while preserving pointer tracking', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list, 120);
    const main = document.querySelector('main');
    if (!(main instanceof HTMLElement)) throw new Error('Expected the application main');
    Object.defineProperty(main, 'scrollHeight', { configurable: true, value: 600 });
    Object.defineProperty(main, 'clientHeight', { configurable: true, value: 160 });
    vi.spyOn(main, 'getBoundingClientRect').mockReturnValue(
      createDomRect({ top: 0, left: 0, width: 320, height: 160 })
    );
    const nativeGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudoElement) =>
      element === main
        ? ({ overflowY: 'auto' } as CSSStyleDeclaration)
        : nativeGetComputedStyle(element, pseudoElement)
    );
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback);
      return 101;
    });
    const handle = screen.getByRole<HTMLButtonElement>('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 21,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 21,
      pointerType: 'touch',
      clientX: 20,
      clientY: 150,
    });
    const frame = frameCallbacks.shift();
    if (frame === undefined) throw new Error('Expected edge auto-scroll to request a frame');
    act(() => frame(16));

    expect(main.scrollTop).toBeGreaterThan(0);
    const transform = handle.closest<HTMLElement>('[data-next-step-id]')?.style.transform ?? '';
    const trackedOffset = Number.parseFloat(
      transform.match(/translate3d\(0, (-?[\d.]+)px, 0\)/)?.[1] ?? '0'
    );
    expect(trackedOffset).toBeGreaterThan(130);

    fireEvent.pointerCancel(handle, {
      pointerId: 21,
      pointerType: 'touch',
      clientX: 20,
      clientY: 150,
    });
  });

  it('waits for the dragged row center to cross a sibling midpoint before reordering', async () => {
    const reorderUpcomingNextSteps = vi.spyOn(appRepository, 'reorderUpcomingNextSteps');
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.map((step): NextStep => {
      if (step.id === LEARN_GUITAR_CURRENT_STEP_ID) return { ...step, position: 0 };
      if (step.id === 'next-step-strumming-pattern') return { ...step, position: 1 };
      if (step.id === 'next-step-play-first-song') return { ...step, position: 2 };
      return step;
    });
    await renderJourney(state);
    const storageSetItem = vi.spyOn(Storage.prototype, 'setItem');
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 11,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 11,
      pointerType: 'touch',
      clientX: 20,
      clientY: 26,
    });

    expect(getUpcomingAnnouncement().textContent).toBe('');
    expect(handle.closest('[data-next-step-id]')?.getAttribute('style')).toContain(
      'translate3d(0, 6px, 0)'
    );

    fireEvent.pointerUp(handle, {
      pointerId: 11,
      pointerType: 'touch',
      clientX: 20,
      clientY: 26,
    });

    expect(reorderUpcomingNextSteps).toHaveBeenCalledTimes(1);
    expect(storageSetItem).not.toHaveBeenCalled();
    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-strumming-pattern', 'next-step-play-first-song']);
  });

  it('uses the pointer-up position for the final order and saved-order settle offset', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 12,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerUp(handle, {
      pointerId: 12,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });

    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-play-first-song', 'next-step-strumming-pattern']);
    expect(handle.closest('[data-next-step-id]')?.getAttribute('style')).toContain(
      'translate3d(0, 40px, 0)'
    );
    expect(screen.queryByText(/Moved “.*” to position/)).toBeNull();
  });

  it('settles a failed pointer reorder back from the pointer position without jumping', async () => {
    vi.spyOn(appRepository, 'reorderUpcomingNextSteps').mockReturnValue({
      status: 'error',
      state: null,
      error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
    });
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const list = screen.getByRole('list', { name: 'Upcoming Next steps' });
    mockUpcomingListGeometry(list);
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });
    const siblingRow = screen
      .getByText('Play the first song from start to finish')
      .closest('[data-next-step-id]');

    fireEvent.pointerDown(handle, {
      button: 0,
      pointerId: 13,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerMove(handle, {
      pointerId: 13,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });
    fireEvent.pointerUp(handle, {
      pointerId: 13,
      pointerType: 'touch',
      clientX: 20,
      clientY: 140,
    });

    expect(handle.closest('[data-next-step-id]')?.getAttribute('style')).toContain(
      'translate3d(0, 120px, 0)'
    );
    expect(siblingRow?.getAttribute('style')).toContain('translate3d(0, -80px, 0)');
    expect(
      screen.getByText('Your Next steps could not be reordered. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-strumming-pattern', 'next-step-play-first-song']);
  });

  it('restores the original order and handle focus when a reorder cannot be saved', async () => {
    vi.spyOn(appRepository, 'reorderUpcomingNextSteps').mockReturnValue({
      status: 'error',
      state: null,
      error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
    });
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const handle = screen.getByRole('button', {
      name: `Reorder ${title}, position 1 of 2`,
    });

    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: ' ' });
    await finishDeferredFocusHandoff();

    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-strumming-pattern', 'next-step-play-first-song']);
    expect(
      screen.getByText('Your Next steps could not be reordered. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(getUpcomingAnnouncement().textContent).toBe('');
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
    expect(document.activeElement).toBe(handle);
  });

  it('offers boundary-aware Move actions as a non-drag fallback', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const menu = openNextStepMenu(title);

    expect(
      within(menu).getByRole('menuitem', { name: 'Move up' }).getAttribute('aria-disabled')
    ).toBe('true');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Move down' }));
    await finishDeferredFocusHandoff();

    expect(
      readSavedState()
        .nextSteps.filter(({ status }) => status === 'upcoming')
        .sort((left, right) => left.position - right.position)
        .map(({ id }) => id)
    ).toEqual(['next-step-play-first-song', 'next-step-strumming-pattern']);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: `Reorder ${title}, position 2 of 2` })
    );
    const boundaryMenu = openNextStepMenu(title);
    expect(
      within(boundaryMenu)
        .getByRole('menuitem', { name: 'Move down' })
        .getAttribute('aria-disabled')
    ).toBe('true');
  });

  it('makes an Upcoming step current and moves focus to its Start action', async () => {
    const originalMakeNextStepCurrent = appRepository.makeNextStepCurrent;
    let action: HTMLElement | null = null;
    const makeNextStepCurrent = vi
      .spyOn(appRepository, 'makeNextStepCurrent')
      .mockImplementation((journeyId, nextStepId) => {
        if (action !== null) fireEvent.click(action);
        return originalMakeNextStepCurrent(journeyId, nextStepId);
      });
    await renderJourney(createSeedAppState());
    const title = 'Play the first song from start to finish';
    const menu = openNextStepMenu(title);

    action = within(menu).getByRole('menuitem', { name: 'Work on this next' });
    fireEvent.click(action);
    const saved = readSavedState();
    expect(saved.nextSteps.find(({ id }) => id === 'next-step-play-first-song')).toMatchObject({
      status: 'current',
      position: 0,
    });
    expect(saved.nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)).toMatchObject({
      status: 'upcoming',
      position: 1,
    });
    expect(deriveHomeData(saved, new Date()).continueJourney?.currentStep?.id).toBe(
      'next-step-play-first-song'
    );
    expect(resolveFocusSelection(saved, { journeyId: LEARN_GUITAR_JOURNEY_ID })?.nextStep?.id).toBe(
      'next-step-play-first-song'
    );
    expect(makeNextStepCurrent).toHaveBeenCalledTimes(1);
    expect(getUpcomingAnnouncement().textContent).toBe(`${title} is now your current Next step.`);
    await finishDeferredFocusHandoff();

    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    const startActions = screen.getAllByRole('link', { name: `Start 25:00 for ${title}` });
    expect(startActions).toHaveLength(2);
    expect(startActions).toContain(document.activeElement);
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
  });

  it.each([
    'paused',
    'completed',
    'archived',
  ] as const)('focuses the current-step action after promotion on a %s Journey', async (status) => {
    const state = createSeedAppState();
    state.journeys = state.journeys.map((journey) => ({ ...journey, status }));
    await renderJourney(state);
    const title = 'Play the first song from start to finish';
    const menu = openNextStepMenu(title);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Work on this next' }));
    await finishDeferredFocusHandoff();

    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(screen.queryByRole('link', { name: `Start 25:00 for ${title}` })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Mark complete' }));
  });

  it('keeps the original current step and restores menu focus when promotion fails', async () => {
    vi.spyOn(appRepository, 'makeNextStepCurrent').mockReturnValue({
      status: 'error',
      state: null,
      error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
    });
    await renderJourney(createSeedAppState());
    const title = 'Play the first song from start to finish';
    const menu = openNextStepMenu(title);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Work on this next' }));
    await finishDeferredFocusHandoff();

    expect(
      readSavedState().nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)
    ).toMatchObject({ status: 'current', position: 5 });
    expect(
      screen.getByText('Your current Next step could not be changed. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(getUpcomingAnnouncement().textContent).toBe('');
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: `More actions for ${title}` })
    );
  });

  it('completes an Upcoming step and focuses the next row action', async () => {
    const originalCompleteUpcomingNextStep = appRepository.completeUpcomingNextStep;
    let action: HTMLElement | null = null;
    const completeUpcomingNextStep = vi
      .spyOn(appRepository, 'completeUpcomingNextStep')
      .mockImplementation((journeyId, nextStepId, completedAt) => {
        if (action !== null) fireEvent.click(action);
        return originalCompleteUpcomingNextStep(journeyId, nextStepId, completedAt);
      });
    await renderJourney(createSeedAppState());
    const completedTitle = 'Practice the verse strumming pattern';
    const nextTitle = 'Play the first song from start to finish';
    const menu = openNextStepMenu(completedTitle);

    action = within(menu).getByRole('menuitem', { name: 'Mark complete' });
    fireEvent.click(action);
    expect(
      readSavedState().nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'completed' });
    expect(completeUpcomingNextStep).toHaveBeenCalledTimes(1);
    expect(getUpcomingAnnouncement().textContent).toBe(`${completedTitle} marked complete.`);
    await finishDeferredFocusHandoff();

    expect(screen.getByText(`Marked “${completedTitle}” complete.`)).toBeTruthy();
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: `More actions for ${nextTitle}` })
    );
  });

  it('keeps an Upcoming step and restores its menu focus when completion fails', async () => {
    const completeUpcomingNextStep = vi
      .spyOn(appRepository, 'completeUpcomingNextStep')
      .mockReturnValue({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      });
    await renderJourney(createSeedAppState());
    const title = 'Practice the verse strumming pattern';
    const menu = openNextStepMenu(title);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Mark complete' }));
    await finishDeferredFocusHandoff();

    expect(
      readSavedState().nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')
    ).toMatchObject({ status: 'upcoming', position: 6 });
    const firstAlert = screen.getByRole('alert');
    expect(firstAlert.textContent).toBe(
      'Your Next step could not be completed. Nothing changed. Try again.'
    );
    expect(getUpcomingAnnouncement().textContent).toBe('');
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: `More actions for ${title}` })
    );

    const retryMenu = openNextStepMenu(title);
    fireEvent.click(within(retryMenu).getByRole('menuitem', { name: 'Mark complete' }));
    await finishDeferredFocusHandoff();

    expect(screen.getByRole('alert')).not.toBe(firstAlert);
    expect(completeUpcomingNextStep).toHaveBeenCalledTimes(2);
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
  });

  it('blocks completion while the Upcoming step has an active Focus session', async () => {
    const state = createSeedAppState();
    const stepId = 'next-step-strumming-pattern';
    state.focusSessions.push({
      id: 'session-active-upcoming',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: stepId,
      plannedMinutes: 25,
      focusedMinutes: 0,
      status: 'paused',
      source: 'timer',
      startedAt: '2026-08-08T18:00:00.000Z',
      endedAt: null,
      reflection: '',
    });
    state.activeTimer = {
      sessionId: 'session-active-upcoming',
      status: 'paused',
      remainingSeconds: 1_500,
      accumulatedFocusedSeconds: 0,
      targetEndAt: null,
      pausedAt: '2026-08-08T18:00:00.000Z',
    };
    await renderJourney(state);
    const title = 'Practice the verse strumming pattern';
    const trigger = screen.getByRole<HTMLButtonElement>('button', {
      name: `More actions for ${title}`,
    });
    trigger.focus();
    const menu = openNextStepMenu(title);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Mark complete' }));

    const dialog = screen.getByRole('dialog', { name: 'Finish this Focus session first' });
    expect(within(dialog).getByText(/Finish or cancel that session/)).toBeTruthy();
    expect(readSavedState().nextSteps.find(({ id }) => id === stepId)?.status).toBe('upcoming');

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' })[0]);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    const deleteMenu = openNextStepMenu(title);
    fireEvent.click(within(deleteMenu).getByRole('menuitem', { name: 'Delete' }));
    const deleteBlocker = screen.getByRole('dialog', { name: 'Finish this Focus session first' });
    expect(within(deleteBlocker).getByText(/then mark this step complete/)).toBeTruthy();
    fireEvent.click(within(deleteBlocker).getAllByRole('button', { name: 'Close' })[0]);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('keeps worked-on steps in history instead of offering destructive confirmation', async () => {
    const state = createSeedAppState();
    const stepId = 'next-step-strumming-pattern';
    state.focusSessions.push({
      id: 'session-completed-upcoming',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: stepId,
      plannedMinutes: 25,
      focusedMinutes: 25,
      status: 'completed',
      source: 'timer',
      startedAt: '2026-08-07T18:00:00.000Z',
      endedAt: '2026-08-07T18:25:00.000Z',
      reflection: '',
    });
    await renderJourney(state);
    const title = 'Practice the verse strumming pattern';
    const menu = openNextStepMenu(title);

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));

    const dialog = screen.getByRole('dialog', { name: `Keep “${title}” in your history` });
    expect(within(dialog).getByText(/Mark it complete instead/)).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'Delete step' })).toBeNull();
    expect(readSavedState().nextSteps.some(({ id }) => id === stepId)).toBe(true);
  });

  it('does not delete an unused Upcoming step when confirmation is cancelled', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Play the first song from start to finish';
    const menu = openNextStepMenu(title);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: `Delete “${title}”?` });
    const confirm = within(dialog).getByRole('button', { name: 'Delete step' });

    expect(confirm.className).toContain('bg-pomodoro-red');
    expect(confirm.className).toContain('text-paper');
    expect(confirm.className).toContain('hover:bg-ink');
    expect(confirm.className).toContain('dark:bg-pomodoro-red');
    expect(confirm.className).toContain('dark:hover:bg-ink');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(readSavedState().nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(
      true
    );
    expect(screen.queryByRole('dialog', { name: `Delete “${title}”?` })).toBeNull();
  });

  it('opens and cancels delete with the keyboard, then restores focus to the row menu', async () => {
    await renderJourney(createSeedAppState());
    const title = 'Play the first song from start to finish';
    const trigger = screen.getByRole<HTMLButtonElement>('button', {
      name: `More actions for ${title}`,
    });
    trigger.focus();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    const menu = screen.getByRole('menu');
    const firstAction = within(menu).getByRole('menuitem', { name: 'Work on this next' });
    await waitFor(() => expect(document.activeElement).toBe(firstAction));
    fireEvent.keyDown(firstAction, { key: 'End' });
    const deleteAction = within(menu).getByRole('menuitem', { name: 'Delete' });
    await waitFor(() => expect(document.activeElement).toBe(deleteAction));
    fireEvent.keyDown(deleteAction, { key: 'Enter' });

    expect(await screen.findByRole('dialog', { name: `Delete “${title}”?` })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: `Delete “${title}”?` })).toBeNull()
    );
    expect(document.activeElement === trigger).toBe(true);
    expect(readSavedState().nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(
      true
    );
  });

  it('deletes the only Upcoming step once and focuses Add Next step', async () => {
    const state = createSeedAppState();
    state.nextSteps = state.nextSteps.filter(
      ({ status, id }) => status !== 'upcoming' || id === 'next-step-play-first-song'
    );
    const originalDeleteUpcomingNextStep = appRepository.deleteUpcomingNextStep;
    let confirm: HTMLButtonElement | null = null;
    const deleteUpcomingNextStep = vi
      .spyOn(appRepository, 'deleteUpcomingNextStep')
      .mockImplementation((journeyId, nextStepId) => {
        if (confirm !== null) fireEvent.click(confirm);
        return originalDeleteUpcomingNextStep(journeyId, nextStepId);
      });
    await renderJourney(state);
    const title = 'Play the first song from start to finish';
    const menu = openNextStepMenu(title);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: `Delete “${title}”?` });
    confirm = within(dialog).getByRole<HTMLButtonElement>('button', { name: 'Delete step' });

    fireEvent.click(confirm);
    await finishDeferredFocusHandoff();

    expect(deleteUpcomingNextStep).toHaveBeenCalledTimes(1);
    expect(readSavedState().nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(
      false
    );
    expect(screen.getByText(`Deleted “${title}”.`)).toBeTruthy();
    expect(getUpcomingAnnouncement().textContent).toBe(`${title} deleted.`);
    expect(getPopulatedUpcomingLiveRegions()).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add Next step' }));
  });

  it('keeps delete confirmation open after failure and retries the same step', async () => {
    const originalDeleteUpcomingNextStep = appRepository.deleteUpcomingNextStep;
    const deleteUpcomingNextStep = vi
      .spyOn(appRepository, 'deleteUpcomingNextStep')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      })
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      })
      .mockImplementation(originalDeleteUpcomingNextStep);
    await renderJourney(createSeedAppState());
    const title = 'Play the first song from start to finish';
    const menu = openNextStepMenu(title);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: `Delete “${title}”?` });
    const confirm = within(dialog).getByRole('button', { name: 'Delete step' });

    fireEvent.click(confirm);
    expect(
      within(dialog).getByText('This Next step could not be deleted. Nothing changed. Try again.')
    ).toBeTruthy();
    const firstAlert = within(dialog).getByRole('alert');
    expect(firstAlert.textContent).toBe(
      'This Next step could not be deleted. Nothing changed. Try again.'
    );
    expect(readSavedState().nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(
      true
    );

    fireEvent.click(confirm);
    expect(within(dialog).getByRole('alert')).not.toBe(firstAlert);
    expect(readSavedState().nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(
      true
    );

    fireEvent.click(confirm);
    expect(readSavedState().nextSteps.some(({ id }) => id === 'next-step-play-first-song')).toBe(
      false
    );
    await finishDeferredFocusHandoff();
    expect(deleteUpcomingNextStep).toHaveBeenCalledTimes(3);
    expect(document.activeElement).toBe(
      screen.getByRole('button', {
        name: 'More actions for Practice the verse strumming pattern',
      })
    );
  });

  it('atomically completes the current Next step and promotes the first upcoming step', async () => {
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Mark complete' }));

    await waitFor(() => {
      const saved = readSavedState();
      expect(saved.nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)?.status).toBe(
        'completed'
      );
      expect(saved.nextSteps.find(({ id }) => id === 'next-step-strumming-pattern')?.status).toBe(
        'current'
      );
    });
    expect(
      await screen.findByRole('heading', { name: 'Practice the verse strumming pattern' })
    ).toBeTruthy();
  });

  it('blocks current-step completion during an active Focus session and restores focus', async () => {
    const state = createSeedAppState();
    state.focusSessions.push({
      id: 'session-active-current',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      plannedMinutes: 25,
      focusedMinutes: 0,
      status: 'paused',
      source: 'timer',
      startedAt: '2026-08-08T18:00:00.000Z',
      endedAt: null,
      reflection: '',
    });
    state.activeTimer = {
      sessionId: 'session-active-current',
      status: 'paused',
      remainingSeconds: 1_500,
      accumulatedFocusedSeconds: 0,
      targetEndAt: null,
      pausedAt: '2026-08-08T18:00:00.000Z',
    };
    const completeCurrentNextStep = vi.spyOn(appRepository, 'completeCurrentNextStep');
    await renderJourney(state);
    const completeButton = await screen.findByRole<HTMLButtonElement>('button', {
      name: 'Mark complete',
    });
    completeButton.focus();
    const savedBefore = window.localStorage.getItem(APP_STORAGE_KEY);

    fireEvent.click(completeButton);

    const dialog = screen.getByRole('dialog', { name: 'Finish this Focus session first' });
    expect(within(dialog).getByText(/Finish or cancel that session/)).toBeTruthy();
    expect(completeCurrentNextStep).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(APP_STORAGE_KEY)).toBe(savedBefore);

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' })[0]);
    await waitFor(() => expect(document.activeElement).toBe(completeButton));
  });

  it('allows every unfinished step to be completed while preserving the Journey and progress', async () => {
    const state = createSeedAppState();
    const originalSessions = state.focusSessions;
    const originalMilestones = state.milestones;
    await renderJourney(state);

    let menu = openNextStepMenu('Practice the verse strumming pattern');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Mark complete' }));
    await finishDeferredFocusHandoff();
    menu = openNextStepMenu('Play the first song from start to finish');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Mark complete' }));
    await finishDeferredFocusHandoff();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));

    const saved = readSavedState();
    expect(saved.journeys.some(({ id }) => id === LEARN_GUITAR_JOURNEY_ID)).toBe(true);
    expect(
      saved.nextSteps
        .filter(({ journeyId }) => journeyId === LEARN_GUITAR_JOURNEY_ID)
        .every(({ status }) => status === 'completed')
    ).toBe(true);
    expect(saved.focusSessions).toEqual(originalSessions);
    expect(saved.milestones).toEqual(originalMilestones);
    expect(deriveHomeData(saved, new Date()).continueJourney?.currentStep).toBeNull();
    expect(screen.getByRole('heading', { name: 'All caught up' })).toBeTruthy();
    expect(screen.getByText('17 hours 55 minutes')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
    expect(
      screen.getAllByRole('button', { name: /Add a Next step|Add Next step/ })
    ).not.toHaveLength(0);
  });

  it('leaves the current step intact after a completion write failure and supports retry', async () => {
    const originalCompleteCurrentNextStep = appRepository.completeCurrentNextStep;
    const completeCurrentNextStep = vi
      .spyOn(appRepository, 'completeCurrentNextStep')
      .mockReturnValueOnce({
        status: 'error',
        state: null,
        error: new RepositoryError('storage-write-failed', 'Simulated write failure'),
      })
      .mockImplementation(originalCompleteCurrentNextStep);
    await renderJourney(createSeedAppState());

    fireEvent.click(await screen.findByRole('button', { name: 'Mark complete' }));

    expect(
      await screen.findByText('Your Next step could not be completed. Nothing changed. Try again.')
    ).toBeTruthy();
    expect(
      readSavedState().nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)?.status
    ).toBe('current');

    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    await waitFor(() =>
      expect(
        readSavedState().nextSteps.find(({ id }) => id === LEARN_GUITAR_CURRENT_STEP_ID)?.status
      ).toBe('completed')
    );
    expect(completeCurrentNextStep).toHaveBeenCalledTimes(2);
    expect(completeCurrentNextStep.mock.calls[0]?.[1]).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
    expect(completeCurrentNextStep.mock.calls[1]?.[1]).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
  });

  it('shows actionable zero-progress, no-step, and no-session states', async () => {
    const state = createSeedAppState();
    state.focusSessions = [];
    state.nextSteps = [];

    await renderJourney(state);

    expect(
      await screen.findByText('Finish a Focus session to add your first Pomodoro.')
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'All caught up' })).toBeTruthy();
    expect(screen.getByText('No upcoming steps.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No sessions yet' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
    expect(
      screen.getAllByRole('button', { name: /Add a Next step|Add Next step/ }).length
    ).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-pomodoro-index]')).toHaveLength(100);
    expect(screen.getByRole('button', { name: 'Pomodoro 1: future' })).toBeTruthy();
  });

  it('keeps an inactive Journey readable without offering a Focus session', async () => {
    const state = createSeedAppState();
    state.journeys = state.journeys.map((journey) => ({ ...journey, status: 'paused' }));

    await renderJourney(state);

    expect(
      await screen.findByText('This Journey is paused. Make it active to start a Focus session.')
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Practice the F chord transition' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Start 25:00/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeTruthy();
  });

  it('shows an actionable not-found state for an unknown Journey ID', async () => {
    await renderJourney(createSeedAppState(), 'missing-journey');

    expect(await screen.findByRole('heading', { name: 'Journey not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Return Home' })).toBeTruthy();
  });
});
