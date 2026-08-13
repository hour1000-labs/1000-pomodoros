import { createFileRoute } from '@tanstack/react-router';

import { JourneyTargetScreen } from '@/features/journeys/journey-target-screen';

export const Route = createFileRoute('/journeys/$journeyId/target')({
  component: JourneyTargetRoute,
});

function JourneyTargetRoute() {
  const { journeyId } = Route.useParams();

  return <JourneyTargetScreen journeyId={journeyId} />;
}
