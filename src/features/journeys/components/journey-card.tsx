import { ArrowRight, Play } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MilestoneProgress } from '@/components/shared/milestone-progress'

export function JourneyCard({
  journeyId,
  name,
  focusedTime,
  milestoneLabel,
  milestonePercent,
  nextStep,
}: {
  journeyId: string
  name: string
  focusedTime: string
  milestoneLabel: string
  milestonePercent: number
  nextStep?: string
}) {
  return (
    <Card>
      <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <Link
          to="/journeys/$journeyId"
          params={{ journeyId }}
          className="group min-w-0 rounded-md"
        >
          <span className="mb-2 flex items-center gap-2 text-xl font-bold">
            {name}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
          <span className="block text-sm text-ink/60">{focusedTime} focused</span>
          <span className="mt-4 block text-sm">
            <span className="font-bold">Next step:</span>{' '}
            {nextStep ?? 'Add your next action'}
          </span>
          <MilestoneProgress
            className="mt-5"
            value={milestonePercent}
            label={milestoneLabel}
          />
        </Link>
        <Button asChild variant="outline" size="icon" aria-label={`Focus on ${name}`}>
          <Link to="/focus">
            <Play aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
