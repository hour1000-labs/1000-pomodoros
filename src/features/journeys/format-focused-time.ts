export function formatFocusedTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`;

  if (hours === 0) return `${remainder} minutes`;
  if (remainder === 0) return hourLabel;
  return `${hourLabel} ${remainder} minutes`;
}
