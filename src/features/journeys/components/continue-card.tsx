import { Link } from '@tanstack/react-router';

import { PrimaryButton } from '@/components/shared/primary-button';
import { Card, CardContent } from '@/components/ui/card';
import type { NextStep } from '@/lib/models';

export function ContinueCard({
  hasCompletedActivity,
  journeyId,
  journeyName,
  nextStep,
}: {
  hasCompletedActivity: boolean;
  journeyId: string;
  journeyName: string;
  nextStep: NextStep | null;
}) {
  return (
    <Card className="border border-ink/15 bg-paper py-0 ring-0">
      <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:p-10">
        <div className="min-w-0">
          <p className="mb-3 font-bold text-ink/60 text-sm [overflow-wrap:anywhere]">
            {journeyName}
          </p>
          <p className="mb-4 text-ink/60 text-sm">
            {hasCompletedActivity
              ? 'Continue where you left off.'
              : 'Your first Pomodoro starts here.'}
          </p>
          <h1
            id="home-continue-heading"
            className="mb-0 max-w-[22ch] font-bold text-[clamp(2.25rem,7vw,3.75rem)] leading-[1.05] tracking-[-0.045em] [overflow-wrap:anywhere]"
          >
            {nextStep?.title ?? 'Choose the next thing you can work on'}
          </h1>
        </div>
        {nextStep ? (
          <PrimaryButton
            asChild
            className="w-full scroll-mb-[calc(5rem+env(safe-area-inset-bottom))] md:w-auto md:scroll-mb-0"
          >
            <Link
              to="/focus"
              search={{ journeyId, nextStepId: nextStep.id }}
              aria-label={`Start 25:00 for ${nextStep.title} in ${journeyName}`}
            >
              Start 25:00
            </Link>
          </PrimaryButton>
        ) : (
          <PrimaryButton
            asChild
            className="w-full scroll-mb-[calc(5rem+env(safe-area-inset-bottom))] md:w-auto md:scroll-mb-0"
          >
            <Link
              to="/journeys/$journeyId"
              params={{ journeyId }}
              aria-label={`Add a Next step to ${journeyName}`}
            >
              Add a Next step
            </Link>
          </PrimaryButton>
        )}
      </CardContent>
    </Card>
  );
}
