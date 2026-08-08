import { describe, expect, it } from 'vitest';

import { formatFocusedDuration } from './format-focused-duration';

describe('formatFocusedDuration', () => {
  it.each([
    [0, '0 minutes'],
    [1 / 60, '1 second'],
    [25 - (24 + 59 / 60), '1 second'],
    [2 / 60, '2 seconds'],
    [1, '1 minute'],
    [2 + 2 / 60, '2 minutes 2 seconds'],
    [18.05, '18 minutes 3 seconds'],
    [60 - 1 / 60, '59 minutes 59 seconds'],
  ])('formats a sub-hour value of %s minutes as %s', (minutes, expected) => {
    expect(formatFocusedDuration(minutes)).toBe(expected);
  });

  it.each([
    [60, '1 hour'],
    [60 + 1 / 60, '1 hour 1 second'],
    [60 + 2 / 60, '1 hour 2 seconds'],
    [61, '1 hour 1 minute'],
    [61 + 59 / 60, '1 hour 1 minute'],
    [120, '2 hours'],
    [201.9, '3 hours 21 minutes'],
    [201 + 59 / 60, '3 hours 21 minutes'],
  ])('formats a multi-hour value of %s minutes as %s', (minutes, expected) => {
    expect(formatFocusedDuration(minutes)).toBe(expected);
  });
});
