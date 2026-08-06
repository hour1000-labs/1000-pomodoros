import { createFileRoute } from '@tanstack/react-router';

import { SampleJourneyScreen } from '@/features/journeys/sample-journey-screen';

export const Route = createFileRoute('/sample')({
  component: SampleJourneyScreen,
});
