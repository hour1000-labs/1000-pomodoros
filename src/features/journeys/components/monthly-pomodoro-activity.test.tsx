// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { APP_STATE_SCHEMA_VERSION, type AppState, type FocusSession } from '@/lib/models';

import {
  MONTHLY_ACTIVITY_TOMATO_RENDER_LIMIT,
  MonthlyPomodoroActivity,
} from './monthly-pomodoro-activity';

const JOURNEY_ID = 'journey-one';
const NOW = new Date(2026, 7, 13, 12);

afterEach(cleanup);

function createSession({
  id,
  date,
  focusedMinutes,
}: {
  id: string;
  date: Date;
  focusedMinutes: number;
}): FocusSession {
  return {
    id,
    journeyId: JOURNEY_ID,
    nextStepId: null,
    plannedMinutes: focusedMinutes,
    focusedMinutes,
    status: 'completed',
    source: 'timer',
    startedAt: new Date(date.getTime() - focusedMinutes * 60_000).toISOString(),
    endedAt: date.toISOString(),
    reflection: '',
  };
}

function createState(focusSessions: FocusSession[] = []): AppState {
  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    journeys: [
      {
        id: JOURNEY_ID,
        name: 'Write a book',
        reason: '',
        targetMinutes: 60_000,
        status: 'active',
        createdAt: '2025-12-01T12:00:00.000Z',
        updatedAt: '2026-08-13T12:00:00.000Z',
        lastActiveAt: '2026-08-13T12:00:00.000Z',
      },
    ],
    nextSteps: [],
    focusSessions,
    milestones: [],
    weeklyGoal: null,
    onboardingDraft: null,
    activeTimer: null,
    lastActiveJourneyId: JOURNEY_ID,
    lastCompletedSessionId: focusSessions.at(-1)?.id ?? null,
  };
}

function renderActivity(
  state: AppState,
  props: Partial<React.ComponentProps<typeof MonthlyPomodoroActivity>> = {}
) {
  return render(
    <MonthlyPomodoroActivity state={state} now={NOW} scopeLabel="All Journeys" {...props} />
  );
}

describe('MonthlyPomodoroActivity', () => {
  it('defaults to the current month and renders active days oldest first', () => {
    const state = createState([
      createSession({ id: 'today', date: new Date(2026, 7, 13, 10), focusedMinutes: 37.5 }),
      createSession({ id: 'older', date: new Date(2026, 7, 5, 10), focusedMinutes: 25 }),
    ]);

    renderActivity(state);

    const region = screen.getByRole('region', { name: 'Monthly activity' });
    expect(
      within(region).getByRole('heading', { level: 2, name: 'Monthly activity' })
    ).toBeTruthy();
    expect(within(region).getByText('Scope · All Journeys')).toBeTruthy();
    const monthHeading = within(region).getByText('August 2026');
    expect(monthHeading.getAttribute('aria-live')).toBe('polite');
    expect(within(region).getByRole('columnheader', { name: 'Date' })).toBeTruthy();
    expect(within(region).getByRole('columnheader', { name: 'Focused work' })).toBeTruthy();
    expect(within(region).getByRole('columnheader', { name: 'Total' })).toBeTruthy();

    const rows = within(region).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]?.textContent).toContain('Aug 5');
    expect(rows[1]?.textContent).toContain('Wed');
    expect(rows[2]?.textContent).toContain('Aug 13');
    expect(rows[2]?.textContent).toContain('Today');
    expect(rows[1]?.getAttribute('aria-label')).toBe(
      'Wednesday, August 5, 2026; 25 focused minutes; 1 Pomodoro.'
    );
    expect(rows[2]?.getAttribute('aria-label')).toBe(
      'Thursday, August 13, 2026; 37.5 focused minutes; 1.5 Pomodoros.'
    );
    expect(
      within(region).getByLabelText(
        'Month total: 2.5 Pomodoros, 62.5 focused minutes (1 hour 2 minutes).'
      )
    );
    expect(within(region).getByText('1 hour 2 minutes')).toBeTruthy();
  });

  it('renders only earned complete and partial marks without blank or focusable tomatoes', () => {
    renderActivity(
      createState([
        createSession({ id: 'partial-day', date: new Date(2026, 7, 13, 10), focusedMinutes: 37.5 }),
      ])
    );

    const tomatoes = document.querySelectorAll<HTMLElement>('[data-pomodoro-tomato="true"]');
    const blocks = document.querySelectorAll<HTMLElement>('[data-state]');

    expect(tomatoes).toHaveLength(2);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.getAttribute('data-state')).toBe('complete');
    expect(blocks[1]?.getAttribute('data-state')).toBe('partial');
    expect(blocks[1]?.getAttribute('data-fill-percent')).toBe('50');
    expect(document.querySelector('[data-state="future"]')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(document.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('never formats near-complete focused work as a whole Pomodoro', () => {
    const focusedMinutes = 24.99999999999;

    renderActivity(
      createState([
        createSession({
          id: 'near-complete',
          date: new Date(2026, 7, 13, 10),
          focusedMinutes,
        }),
      ])
    );

    expect(
      screen.getByRole('row', {
        name: 'Thursday, August 13, 2026; 24.99999999999 focused minutes; 0.9 Pomodoros.',
      })
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Month total: 0.9 Pomodoros, 24.99999999999 focused minutes (25 minutes).'
      )
    ).toBeTruthy();
  });

  it('shows a calm empty state and explicit zero total without placeholder marks', () => {
    renderActivity(createState(), { journeyId: JOURNEY_ID, scopeLabel: 'This Journey' });

    expect(screen.getByText('No focused work for this Journey this month.')).toBeTruthy();
    expect(
      screen.getByLabelText('Month total: 0 Pomodoros, 0 focused minutes (0 minutes).')
    ).toBeTruthy();
    expect(document.querySelector('[data-pomodoro-tomato="true"]')).toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('navigates across years and never enables a future month', () => {
    const januaryNow = new Date(2026, 0, 15, 12);
    renderActivity(createState(), { now: januaryNow });

    const previous = screen.getByRole('button', { name: 'View previous month' });
    const next = screen.getByRole('button', { name: 'View next month' });

    expect(next).toHaveProperty('disabled', true);
    expect(previous.className).toContain('size-11');

    fireEvent.click(previous);
    expect(screen.getByText('December 2025')).toBeTruthy();
    expect(next).toHaveProperty('disabled', false);

    fireEvent.click(next);
    expect(screen.getByText('January 2026')).toBeTruthy();
    expect(next).toHaveProperty('disabled', true);

    fireEvent.click(next);
    expect(screen.queryByText('February 2026')).toBeNull();
  });

  it('follows a new current month but preserves an explicitly historical selection', () => {
    const state = createState();
    const { rerender } = render(
      <MonthlyPomodoroActivity state={state} now={NOW} scopeLabel="All Journeys" />
    );

    rerender(
      <MonthlyPomodoroActivity
        state={state}
        now={new Date(2026, 8, 1, 0, 1)}
        scopeLabel="All Journeys"
      />
    );
    expect(screen.getByText('September 2026')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'View previous month' }));
    expect(screen.getByText('August 2026')).toBeTruthy();

    rerender(
      <MonthlyPomodoroActivity
        state={state}
        now={new Date(2026, 9, 1, 0, 1)}
        scopeLabel="All Journeys"
      />
    );
    expect(screen.getByText('August 2026')).toBeTruthy();
  });

  it('caps dense-day tomato nodes and reports the exact overflow and total', () => {
    const fullPomodoros = MONTHLY_ACTIVITY_TOMATO_RENDER_LIMIT + 7;
    renderActivity(
      createState([
        createSession({
          id: 'dense',
          date: new Date(2026, 7, 13, 10),
          focusedMinutes: fullPomodoros * 25 + 12.5,
        }),
      ])
    );

    expect(document.querySelectorAll('[data-pomodoro-tomato="true"]')).toHaveLength(
      MONTHLY_ACTIVITY_TOMATO_RENDER_LIMIT
    );
    expect(screen.getByText('+8 more')).toBeTruthy();
    expect(
      screen.getByRole('row', {
        name: `Thursday, August 13, 2026; ${fullPomodoros * 25 + 12.5} focused minutes; ${
          fullPomodoros + 0.5
        } Pomodoros.`,
      })
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        `Month total: ${fullPomodoros + 0.5} Pomodoros, ${
          fullPomodoros * 25 + 12.5
        } focused minutes (13 hours 7 minutes).`
      )
    ).toBeTruthy();
  });
});
