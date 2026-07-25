import { useEffect, useState } from 'react';

const LOCAL_DAY_ROLLOVER_BUFFER_MS = 50;

function getLocalDayRolloverDelay(now: Date) {
  const nextLocalMidnight = new Date(now);
  nextLocalMidnight.setHours(24, 0, 0, 0);

  return Math.max(
    LOCAL_DAY_ROLLOVER_BUFFER_MS,
    nextLocalMidnight.getTime() - now.getTime() + LOCAL_DAY_ROLLOVER_BUFFER_MS
  );
}

export function useCurrentLocalDate() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: number;

    function scheduleNextLocalDay() {
      const now = new Date();

      timeoutId = window.setTimeout(() => {
        setCurrentDate(new Date());
        scheduleNextLocalDay();
      }, getLocalDayRolloverDelay(now));
    }

    scheduleNextLocalDay();

    return () => window.clearTimeout(timeoutId);
  }, []);

  return currentDate;
}
