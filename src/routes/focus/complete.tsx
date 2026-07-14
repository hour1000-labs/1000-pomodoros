import { createFileRoute } from '@tanstack/react-router';

import { SessionCompleteScreen } from '@/features/focus/session-complete-screen';

export const Route = createFileRoute('/focus/complete')({
  component: SessionCompleteScreen,
});
