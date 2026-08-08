const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const FLOATING_POINT_SECOND_TOLERANCE = 1e-9;

function formatUnit(value: number, unit: 'hour' | 'minute' | 'second') {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

export function formatFocusedDuration(minutes: number) {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  const totalSeconds = Math.floor(
    safeMinutes * SECONDS_PER_MINUTE + FLOATING_POINT_SECOND_TOLERANCE
  );

  if (totalSeconds >= SECONDS_PER_HOUR) {
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const remainingSeconds = totalSeconds % SECONDS_PER_HOUR;
    const remainingMinutes = Math.floor(remainingSeconds / SECONDS_PER_MINUTE);

    if (remainingMinutes > 0) {
      return `${formatUnit(hours, 'hour')} ${formatUnit(remainingMinutes, 'minute')}`;
    }

    const secondsAfterHour = remainingSeconds % SECONDS_PER_MINUTE;

    if (secondsAfterHour > 0) {
      return `${formatUnit(hours, 'hour')} ${formatUnit(secondsAfterHour, 'second')}`;
    }

    return formatUnit(hours, 'hour');
  }

  const wholeMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const remainingSeconds = totalSeconds % SECONDS_PER_MINUTE;

  if (wholeMinutes === 0) {
    return remainingSeconds === 0
      ? formatUnit(0, 'minute')
      : formatUnit(remainingSeconds, 'second');
  }

  if (remainingSeconds === 0) return formatUnit(wholeMinutes, 'minute');

  return `${formatUnit(wholeMinutes, 'minute')} ${formatUnit(remainingSeconds, 'second')}`;
}
