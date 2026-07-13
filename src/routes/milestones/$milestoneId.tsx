import { createFileRoute } from '@tanstack/react-router'

import { MilestoneFoundationScreen } from '@/components/foundation-screens'

export const Route = createFileRoute('/milestones/$milestoneId')({
  component: MilestoneRoute,
})

function MilestoneRoute() {
  const { milestoneId } = Route.useParams()

  return <MilestoneFoundationScreen milestoneId={milestoneId} />
}
