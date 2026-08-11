import { createFileRoute } from '@tanstack/react-router';

import { StreakScreen } from '@/features/streaks/streak-screen';

export const Route = createFileRoute('/streaks')({ component: StreakScreen });
