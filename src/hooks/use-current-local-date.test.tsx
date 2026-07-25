// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCurrentLocalDate } from './use-current-local-date';

function LocalDateProbe() {
  const currentDate = useCurrentLocalDate();

  return (
    <output aria-label="Current local date">
      {currentDate.getFullYear()}-{currentDate.getMonth() + 1}-{currentDate.getDate()}
    </output>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 12, 23, 59, 59, 900));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useCurrentLocalDate', () => {
  it('updates after local midnight and schedules the following day', () => {
    render(<LocalDateProbe />);

    expect(screen.getByLabelText('Current local date').textContent).toBe('2026-7-12');

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByLabelText('Current local date').textContent).toBe('2026-7-13');

    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1_000));
    expect(screen.getByLabelText('Current local date').textContent).toBe('2026-7-14');
  });

  it('clears the scheduled rollover when unmounted', () => {
    const { unmount } = render(<LocalDateProbe />);

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
