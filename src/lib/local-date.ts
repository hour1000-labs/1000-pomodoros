export type LocalDateKey = `${number}-${number}-${number}`;

export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export interface LocalMonth {
  year: number;
  monthIndex: number;
}

const LOCAL_DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const CANONICAL_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function createLocalNoonDate(year: number, monthIndex: number, day: number) {
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, monthIndex, day);
  return date;
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function getLocalDateKey(date: Date): LocalDateKey | null {
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  if (year < 0 || year > 9999) return null;

  return `${String(year).padStart(4, '0')}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate()
  )}` as LocalDateKey;
}

export function parseCanonicalTimestamp(timestamp: string | null | undefined) {
  if (typeof timestamp !== 'string' || timestamp.trim() === '') return null;

  if (!CANONICAL_TIMESTAMP_PATTERN.test(timestamp)) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== timestamp) return null;

  return date;
}

export function getLocalDateKeyFromTimestamp(timestamp: string | null | undefined) {
  const date = parseCanonicalTimestamp(timestamp);
  return date === null ? null : getLocalDateKey(date);
}

export function parseLocalDateKey(dateKey: string): LocalDateParts | null {
  const match = LOCAL_DATE_KEY_PATTERN.exec(dateKey);
  if (match === null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = createLocalNoonDate(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day };
}

export function localDateKeyToDate(dateKey: string) {
  const parts = parseLocalDateKey(dateKey);
  if (parts === null) return null;

  return createLocalNoonDate(parts.year, parts.month - 1, parts.day);
}

export function addLocalDays(dateKey: string, days: number): LocalDateKey | null {
  const date = localDateKeyToDate(dateKey);
  if (date === null || !Number.isInteger(days)) return null;

  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

export function compareLocalDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function normalizeLocalMonth(year: number, monthIndex: number): LocalMonth | null {
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) return null;

  const date = createLocalNoonDate(year, monthIndex, 1);
  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
  };
}

export function getLocalMonthDateKeys(year: number, monthIndex: number): LocalDateKey[] {
  const month = normalizeLocalMonth(year, monthIndex);
  if (month === null) return [];

  const dateKeys: LocalDateKey[] = [];
  const cursor = createLocalNoonDate(month.year, month.monthIndex, 1);

  while (cursor.getFullYear() === month.year && cursor.getMonth() === month.monthIndex) {
    const dateKey = getLocalDateKey(cursor);
    if (dateKey !== null) dateKeys.push(dateKey);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dateKeys;
}

export function getLocalMonthGridDateKeys(
  year: number,
  monthIndex: number,
  weekStartsOn: 0 | 1 = 0
): LocalDateKey[] {
  const monthDateKeys = getLocalMonthDateKeys(year, monthIndex);
  const firstDateKey = monthDateKeys[0];
  const lastDateKey = monthDateKeys.at(-1);
  if (firstDateKey === undefined || lastDateKey === undefined) return [];

  const firstDate = localDateKeyToDate(firstDateKey);
  const lastDate = localDateKeyToDate(lastDateKey);
  if (firstDate === null || lastDate === null) return [];

  const leadingDays = (firstDate.getDay() - weekStartsOn + 7) % 7;
  const trailingDays = (weekStartsOn + 6 - lastDate.getDay() + 7) % 7;
  const gridStart = addLocalDays(firstDateKey, -leadingDays);
  const gridEnd = addLocalDays(lastDateKey, trailingDays);
  if (gridStart === null || gridEnd === null) return [];

  const dateKeys: LocalDateKey[] = [];
  let cursor: LocalDateKey | null = gridStart;

  while (cursor !== null && compareLocalDateKeys(cursor, gridEnd) <= 0) {
    dateKeys.push(cursor);
    cursor = addLocalDays(cursor, 1);
  }

  return dateKeys;
}
