export const JOURNEY_NAME_MIN_LENGTH = 1;
export const JOURNEY_NAME_MAX_LENGTH = 80;

export function getJourneyNameError(value: string) {
  const trimmedLength = value.trim().length;

  if (trimmedLength < JOURNEY_NAME_MIN_LENGTH) {
    return 'Enter a Journey name to continue.';
  }

  if (trimmedLength > JOURNEY_NAME_MAX_LENGTH) {
    return `Journey name must be ${JOURNEY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}
