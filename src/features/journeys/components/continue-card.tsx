import { Link } from '@tanstack/react-router';
import { ArrowRight, Timer } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Card, CardContent } from '@/components/ui/card';

export function ContinueCard({
  journeyId,
  journeyName,
  nextStep,
}: {
  journeyId: string;
  journeyName: string;
  nextStep?: string;
}) {
  return (
    <Card className="border-0 bg-ink text-paper ring-0">
      <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="mb-3 font-bold text-paper/65 text-sm">Continue {journeyName}</p>
          <h2 className="mb-0 font-bold text-2xl leading-tight tracking-[-0.02em] sm:text-3xl">
            {nextStep ?? 'Choose your next step'}
          </h2>
        </div>
        {nextStep ? (
          <PrimaryButton asChild className="w-full md:w-auto">
            <Link to="/focus">
              <Timer aria-hidden="true" className="size-4" />
              Start 25:00
            </Link>
          </PrimaryButton>
        ) : (
          <PrimaryButton asChild className="w-full md:w-auto">
            <Link to="/journeys/$journeyId" params={{ journeyId }}>
              Add a Next step
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </PrimaryButton>
        )}
      </CardContent>
    </Card>
  );
}
