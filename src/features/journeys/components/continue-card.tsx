import { Link } from '@tanstack/react-router';
import { ArrowRight, Timer } from 'lucide-react';

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
    <Card className="relative overflow-hidden border-0 bg-ink py-0 text-paper shadow-[8px_8px_0_var(--pomodoro-red)] ring-0">
      <span
        aria-hidden="true"
        className="absolute -top-20 -right-20 size-60 rounded-full border border-paper/25"
      />
      <span
        aria-hidden="true"
        className="absolute right-8 bottom-6 size-8 rounded-full bg-pomodoro-red"
      />
      <CardContent className="relative grid min-h-80 gap-10 p-6 sm:p-9 md:min-h-96 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:p-12">
        <div className="min-w-0 self-start">
          <p className="mb-8 font-bold text-[0.68rem] text-paper/65 uppercase tracking-[0.2em]">
            {hasCompletedActivity
              ? 'Continue where you left off'
              : 'Your next pomodoro starts here'}
          </p>
          <p className="mb-4 font-bold text-paper/70 text-sm [overflow-wrap:anywhere]">
            {journeyName}
          </p>
          <h1
            id="home-continue-heading"
            className="mb-5 max-w-[18ch] font-bold text-[clamp(2.5rem,8vw,4.75rem)] leading-[1.02] tracking-[-0.055em] [overflow-wrap:anywhere]"
          >
            {nextStep?.title ?? 'Choose the next thing you can work on'}
          </h1>
          <p className="mb-0 max-w-[40ch] text-base text-paper/65 leading-relaxed sm:text-lg">
            One clear next step. Twenty-five focused minutes.
          </p>
        </div>
        {nextStep ? (
          <PrimaryButton
            asChild
            className="z-10 w-full scroll-mb-[calc(5rem+env(safe-area-inset-bottom))] border-paper/40 shadow-[5px_5px_0_var(--paper)] hover:border-paper md:w-auto md:scroll-mb-0"
          >
            <Link
              to="/focus"
              search={{ journeyId, nextStepId: nextStep.id }}
              aria-label={`Start 25:00 for ${nextStep.title} in ${journeyName}`}
            >
              <Timer aria-hidden="true" className="size-4" />
              Start 25:00
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </PrimaryButton>
        ) : (
          <PrimaryButton
            asChild
            className="z-10 w-full scroll-mb-[calc(5rem+env(safe-area-inset-bottom))] border-paper/40 shadow-[5px_5px_0_var(--paper)] hover:border-paper md:w-auto md:scroll-mb-0"
          >
            <Link
              to="/journeys/$journeyId"
              params={{ journeyId }}
              aria-label={`Add a Next step to ${journeyName}`}
            >
              Add a Next step
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </PrimaryButton>
        )}
      </CardContent>
    </Card>
  );
}
