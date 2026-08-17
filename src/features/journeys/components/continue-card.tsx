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
    <Card className="rounded-2xl border border-ink/8 bg-card py-0 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] ring-1 ring-ink/5">
      <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:p-10">
        <div className="min-w-0">
          <p className="mb-2.5 font-bold text-ink/60 text-xs uppercase tracking-wider [overflow-wrap:anywhere]">
            {journeyName}
          </p>
          <p className="mb-3 text-ink/60 text-sm">
            {hasCompletedActivity
              ? 'Continue where you left off.'
              : 'Your first Pomodoro starts here.'}
          </p>
          <h1
            id="home-continue-heading"
            className="mb-0 max-w-[22ch] font-extrabold text-[clamp(2.25rem,6.5vw,3.5rem)] leading-[1.04] tracking-[-0.04em] [overflow-wrap:anywhere]"
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
