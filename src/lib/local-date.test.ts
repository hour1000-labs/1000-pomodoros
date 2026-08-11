import { describe, expect, it } from 'vitest';

import {
  addLocalDays,
  getLocalDateKey,
  getLocalDateKeyFromTimestamp,
  getLocalMonthDateKeys,
  getLocalMonthGridDateKeys,
  localDateKeyToDate,
  normalizeLocalMonth,
  parseCanonicalTimestamp,
  parseLocalDateKey,
} from './local-date';

describe('local date helpers', () => {
  it('uses the local calendar date instead of a UTC date slice', () => {
    const localLateEvening = new Date(2026, 6, 12, 23, 45);

    expect(getLocalDateKey(localLateEvening)).toBe('2026-07-12');
    expect(getLocalDateKeyFromTimestamp(localLateEvening.toISOString())).toBe('2026-07-12');
  });

  it('rejects invalid and non-canonical date keys', () => {
    expect(parseLocalDateKey('2026-02-29')).toBeNull();
    expect(parseLocalDateKey('2026-2-09')).toBeNull();
    expect(parseLocalDateKey('not-a-date')).toBeNull();
    expect(getLocalDateKey(new Date('invalid'))).toBeNull();
    expect(getLocalDateKey(new Date('+010000-01-01T12:00:00.000Z'))).toBeNull();
    expect(getLocalDateKeyFromTimestamp(null)).toBeNull();
    expect(getLocalDateKeyFromTimestamp('')).toBeNull();
  });

  it('accepts only exact toISOString timestamps and rejects normalized impossible dates', () => {
    const canonical = '2024-02-29T20:15:30.125Z';

    expect(parseCanonicalTimestamp(canonical)?.toISOString()).toBe(canonical);
    expect(getLocalDateKeyFromTimestamp(canonical)).not.toBeNull();

    for (const timestamp of [
      '2026-02-30T12:00:00.000Z',
      '2026-01-01',
      '2026-01-01T12:00:00Z',
      '2026-01-01T12:00:00.000+00:00',
      '2026-01-01T12:00:00.000z',
      ' 2026-01-01T12:00:00.000Z ',
    ]) {
      expect(parseCanonicalTimestamp(timestamp)).toBeNull();
      expect(getLocalDateKeyFromTimestamp(timestamp)).toBeNull();
    }
  });

  it('crosses leap days, months, and years without millisecond day arithmetic', () => {
    expect(addLocalDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addLocalDays('2024-02-28', 2)).toBe('2024-03-01');
    expect(addLocalDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addLocalDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('stays on adjacent calendar dates across both DST boundaries', () => {
    expect(addLocalDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addLocalDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addLocalDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addLocalDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(localDateKeyToDate('2026-03-08')?.getHours()).toBe(12);
  });

  it('normalizes month navigation and returns complete month keys', () => {
    expect(normalizeLocalMonth(2026, 12)).toEqual({ year: 2027, monthIndex: 0 });
    expect(normalizeLocalMonth(2026, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(getLocalMonthDateKeys(2024, 1)).toHaveLength(29);
    expect(getLocalMonthDateKeys(2026, 1)).toHaveLength(28);
  });

  it('builds Sunday- and Monday-starting calendar grids in whole weeks', () => {
    const sundayGrid = getLocalMonthGridDateKeys(2026, 7, 0);
    const mondayGrid = getLocalMonthGridDateKeys(2026, 7, 1);

    expect(sundayGrid.length % 7).toBe(0);
    expect(mondayGrid.length % 7).toBe(0);
    expect(sundayGrid[0]).toBe('2026-07-26');
    expect(mondayGrid[0]).toBe('2026-07-27');
    expect(sundayGrid.at(-1)).toBe('2026-09-05');
    expect(mondayGrid.at(-1)).toBe('2026-09-06');
  });
});
