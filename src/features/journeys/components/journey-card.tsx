import { Link } from '@tanstack/react-router';
import { useId } from 'react';
import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Journey, NextStep } from '@/lib/models';
import { cn } from '@/lib/utils';

function formatJourneyStatus(status: Journey['status']) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function JourneyCard({
  journeyId,
  name,
  focusedTime,
  milestoneLabel,
  milestonePercent,
  nextStep,
  status,
}: {
  journeyId: string;
  name: string;
  focusedTime: string;
  milestoneLabel: string;
  milestonePercent: number;
  nextStep: NextStep | null;
  status: Journey['status'];
}) {
  const isActive = status === 'active';
  const nextStepLabel =
    nextStep?.title ?? (isActive ? 'Add your next action' : 'No current Next step');
  const summaryDescriptionId = useId();
  const safeMilestonePercent = Math.round(Math.min(100, Math.max(0, milestonePercent)));
  const summaryDescription = `${focusedTime} focused. Next step: ${nextStepLabel}. ${milestoneLabel}. ${safeMilestonePercent}% complete.`;

  return (
    <Card className="rounded-2xl border border-ink/8 bg-card py-0 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-ink/20 hover:shadow-md">
      <CardContent
        className={cn(
          'grid gap-6 p-6 sm:p-7',
          isActive && 'sm:grid-cols-[1fr_auto] sm:items-start'
        )}
      >
        <span id={summaryDescriptionId} hidden>
          {summaryDescription}
        </span>
        <Link
          to="/journeys/$journeyId"
          params={{ journeyId }}
          className="group min-w-0 rounded-lg"
          aria-label={isActive ? `View ${name} Journey` : `View ${name} Journey (${status})`}
          aria-describedby={summaryDescriptionId}
        >
          <span className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-extrabold text-2xl text-ink tracking-tight underline-offset-4 [overflow-wrap:anywhere] group-hover:underline">
              {name}
            </span>
            {isActive ? null : (
              <span className="rounded-full border border-ink/12 bg-ink/[0.03] px-2.5 py-0.5 font-bold text-ink/60 text-xs">
                {formatJourneyStatus(status)}
              </span>
            )}
          </span>
          <span className="block text-ink/60 text-sm">{focusedTime} focused</span>
          <span className="mt-4 block text-sm">
            <span className="font-bold">Next step:</span>{' '}
            <span className="[overflow-wrap:anywhere]">{nextStepLabel}</span>
          </span>
          <MilestoneProgress className="mt-5" value={milestonePercent} label={milestoneLabel} />
        </Link>
        {isActive && nextStep ? (
          <Button asChild variant="outline">
            <Link
              to="/focus"
              search={{ journeyId, nextStepId: nextStep.id }}
              aria-label={`Start 25:00 for ${nextStep.title} in ${name}`}
            >
              Start
            </Link>
          </Button>
        ) : isActive ? (
          <Button asChild variant="outline">
            <Link
              to="/journeys/$journeyId"
              params={{ journeyId }}
              aria-label={`Add a Next step to ${name}`}
            >
              Add step
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
