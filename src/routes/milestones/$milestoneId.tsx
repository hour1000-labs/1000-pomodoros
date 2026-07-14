import { createFileRoute } from '@tanstack/react-router'

import { MilestoneDetailScreen } from '@/features/milestones/milestone-detail-screen'

export const Route = createFileRoute('/milestones/$milestoneId')({
  component: MilestoneRoute,
})

function MilestoneRoute() {
  const { milestoneId } = Route.useParams()

  return <MilestoneDetailScreen milestoneId={milestoneId} />
}
