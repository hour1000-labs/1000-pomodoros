import { Link } from '@tanstack/react-router';
import { ArrowRight, Play, Plus } from 'lucide-react';
import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { NextStep } from '@/lib/models';

export function JourneyCard({
  journeyId,
  name,
  focusedTime,
  milestoneLabel,
  milestonePercent,
  nextStep,
}: {
  journeyId: string;
  name: string;
  focusedTime: string;
  milestoneLabel: string;
  milestonePercent: number;
  nextStep: NextStep | null;
}) {
  return (
    <Card className="border border-ink/20 py-0 shadow-[5px_5px_0_var(--ink)] ring-0">
      <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <Link
          to="/journeys/$journeyId"
          params={{ journeyId }}
          className="group min-w-0 rounded-md"
          aria-label={`View ${name} Journey`}
        >
          <span className="mb-2 flex items-center gap-2 font-bold text-2xl [overflow-wrap:anywhere]">
            {name}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
          <span className="block text-ink/60 text-sm">{focusedTime} focused</span>
          <span className="mt-4 block text-sm">
            <span className="font-bold">Next step:</span>{' '}
            <span className="[overflow-wrap:anywhere]">
              {nextStep?.title ?? 'Add your next action'}
            </span>
          </span>
          <MilestoneProgress className="mt-5" value={milestonePercent} label={milestoneLabel} />
        </Link>
        {nextStep ? (
          <Button asChild variant="outline" size="icon">
            <Link
              to="/focus"
              search={{ journeyId, nextStepId: nextStep.id }}
              aria-label={`Start 25:00 for ${nextStep.title} in ${name}`}
            >
              <Play aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="icon">
            <Link
              to="/journeys/$journeyId"
              params={{ journeyId }}
              aria-label={`Add a Next step to ${name}`}
            >
              <Plus aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
