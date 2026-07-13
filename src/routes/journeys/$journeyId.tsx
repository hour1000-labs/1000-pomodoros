import { createFileRoute } from '@tanstack/react-router'

import { JourneyFoundationScreen } from '@/components/foundation-screens'

export const Route = createFileRoute('/journeys/$journeyId')({
  component: JourneyRoute,
})

function JourneyRoute() {
  const { journeyId } = Route.useParams()

  return <JourneyFoundationScreen journeyId={journeyId} />
}
