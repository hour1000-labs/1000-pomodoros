import { createFileRoute } from '@tanstack/react-router';

import { JourneyDetailScreen } from '@/features/journeys/journey-detail-screen';

export const Route = createFileRoute('/journeys/$journeyId/')({
  component: JourneyRoute,
});

function JourneyRoute() {
  const { journeyId } = Route.useParams();

  return <JourneyDetailScreen journeyId={journeyId} />;
}
