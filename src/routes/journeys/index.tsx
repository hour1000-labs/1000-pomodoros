import { createFileRoute } from '@tanstack/react-router';

import { JourneysScreen } from '@/features/journeys/journeys-screen';

export const Route = createFileRoute('/journeys/')({ component: JourneysScreen });
