export const NEXT_STEP_MIN_LENGTH = 1;
export const NEXT_STEP_MAX_LENGTH = 120;

export function getNextStepError(value: string) {
  const trimmedLength = value.trim().length;

  if (trimmedLength < NEXT_STEP_MIN_LENGTH) {
    return 'Enter one concrete action for your next pomodoro.';
  }

  if (trimmedLength > NEXT_STEP_MAX_LENGTH) {
    return `Keep your Next step to ${NEXT_STEP_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}
