import type { FocusSession } from './models';

export function getFocusSessionLabel(
  session: FocusSession,
  linkedNextStepTitle: string | null = null
) {
  const activity = session.activity?.trim();

  return activity || linkedNextStepTitle || null;
}
