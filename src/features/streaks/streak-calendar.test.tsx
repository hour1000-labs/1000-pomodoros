// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { LocalDateKey } from '@/lib/local-date';
import type { StreakDay } from '@/lib/streaks';

import { StreakCalendar, StreakCalendarLegend } from './streak-calendar';

afterEach(cleanup);

function createDay(
  dateKey: LocalDateKey,
  state: StreakDay['state'],
  focusedMinutes = state === 'practiced' ? 25 : 0
): StreakDay {
  return {
    dateKey,
    state,
    focusedMinutes,
    qualifyingSessionCount: state === 'practiced' ? 1 : 0,
    freezeAwarded: false,
    currentStreakAfterDay: state === 'missed' ? 0 : 6,
    freezesAvailableAfterDay: 0,
    qualifyingDaysTowardNextFreezeAfterDay: 6,
  };
}

describe('StreakCalendar', () => {
  it('labels every state, joins adjacent sequence days, and keeps dates informational', () => {
    const daysByDate = {
      '2026-07-31': createDay('2026-07-31', 'practiced'),
      '2026-08-07': createDay('2026-08-07', 'practiced'),
      '2026-08-08': createDay('2026-08-08', 'freeze-used'),
      '2026-08-09': createDay('2026-08-09', 'practiced', 5),
      '2026-08-10': createDay('2026-08-10', 'missed'),
    } satisfies Partial<Record<LocalDateKey, StreakDay>>;

    render(
      <>
        <StreakCalendar
          asOfDateKey="2026-08-11"
          daysByDate={daysByDate}
          monthIndex={7}
          year={2026}
        />
        <StreakCalendarLegend />
      </>
    );

    const calendar = screen.getByRole('table', { name: 'August 2026 streak calendar' });
    expect(within(calendar).getAllByRole('row')).toHaveLength(7);
    expect(within(calendar).getAllByRole('columnheader')).toHaveLength(7);

    const sundayHeader = within(calendar).getByRole('columnheader', { name: 'Sunday' });
    expect(sundayHeader.classList).toContain('text-ink/60');
    expect(sundayHeader.classList).toContain('font-medium');

    const focusDay = within(calendar).getByRole('cell', {
      name: 'August 7, 2026: practiced, 25 minutes focused.',
    });
    const freezeDay = within(calendar).getByRole('cell', {
      name: 'August 8, 2026: 1 freeze used.',
    });
    const followingFocusDay = within(calendar).getByRole('cell', {
      name: 'August 9, 2026: practiced, 5 minutes focused.',
    });
    const outsideMonthFocusDay = within(calendar).getByRole('cell', {
      name: 'July 31, 2026: practiced, 25 minutes focused.',
    });

    expect(focusDay.getAttribute('data-sequence-start')).toBe('true');
    expect(focusDay.getAttribute('data-sequence-end')).toBeNull();
    expect(freezeDay.getAttribute('data-sequence-start')).toBeNull();
    expect(freezeDay.getAttribute('data-sequence-end')).toBe('true');
    expect(followingFocusDay.getAttribute('data-sequence-start')).toBe('true');
    expect(followingFocusDay.getAttribute('data-sequence-end')).toBe('true');
    expect(outsideMonthFocusDay.classList).not.toContain('opacity-45');
    expect(outsideMonthFocusDay.querySelector('span')?.classList).toContain('bg-pomodoro-red/10');
    expect(Array.from(outsideMonthFocusDay.querySelectorAll('span')).at(-1)?.classList).toContain(
      'text-ink/65'
    );

    const missedDay = within(calendar).getByRole('cell', {
      name: 'August 10, 2026: no qualifying focus; streak sequence ended.',
    });
    const today = within(calendar).getByRole('cell', {
      name: 'August 11, 2026, today: not yet practiced.',
    });
    const futureDay = within(calendar).getByRole('cell', {
      name: 'August 12, 2026: future date.',
    });
    expect(missedDay.querySelector('span[aria-hidden="true"]')?.classList).toContain('text-ink/60');
    expect(today.querySelector('span[aria-hidden="true"]')?.classList).toContain('text-ink/60');
    expect(futureDay.querySelector('span[aria-hidden="true"]')?.classList).toContain('text-ink/60');
    expect(futureDay.querySelector('span[aria-hidden="true"]')?.classList).toContain('font-normal');
    expect(within(calendar).queryByRole('button')).toBeNull();
    expect(calendar.querySelector('[tabindex]')).toBeNull();

    const legend = screen.getByRole('list', { name: 'Calendar legend' });
    expect(within(legend).getByText('Focus day')).toBeTruthy();
    expect(within(legend).getByText('Freeze used')).toBeTruthy();
    expect(within(legend).getByText('Today')).toBeTruthy();
  });

  it('renders a complete five-row leap-month grid when the streak is empty', () => {
    render(<StreakCalendar asOfDateKey="2028-02-15" daysByDate={{}} monthIndex={1} year={2028} />);

    const calendar = screen.getByRole('table', { name: 'February 2028 streak calendar' });
    expect(within(calendar).getAllByRole('row')).toHaveLength(6);
    expect(within(calendar).getAllByRole('cell')).toHaveLength(35);
    expect(
      within(calendar).getByRole('cell', {
        name: 'February 29, 2028: future date.',
      })
    ).toBeTruthy();
  });
});
