import { Link } from '@tanstack/react-router';
import { ArrowRight, Check, Clock3, Play } from 'lucide-react';

import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Card, CardContent } from '@/components/ui/card';
import { learnGuitarMockData } from '@/lib/mock-data';
import { deriveJourneyProgress } from '@/lib/progress';

import { PublicLayout } from './components/public-layout';

const benefits = [
  'Know what to work on next',
  'Stay consistent',
  'See your effort accumulate',
  'Build meaningful skills',
] as const;

export function LandingPage() {
  const { journey, nextSteps, focusSessions, milestones } = learnGuitarMockData;
  const progress = deriveJourneyProgress(journey, focusSessions);
  const nextStep = nextSteps.find((step) => step.status === 'current');
  const nextMilestone = milestones.find((milestone) => milestone.earnedAt === null);
  const milestonePercent = nextMilestone
    ? (progress.focusedMinutes / nextMilestone.targetFocusedMinutes) * 100
    : 100;

  return (
    <PublicLayout
      className="max-w-none px-0 py-0"
      headerAction={
        <Link
          to="/onboarding/journey"
          className="inline-flex min-h-11 items-center text-right text-sm font-bold underline-offset-4 hover:underline"
        >
          Start your first journey
        </Link>
      }
    >
      <section className="mx-auto grid w-full max-w-content items-center gap-9 px-gutter-mobile pt-6 pb-14 md:px-gutter-desktop md:pt-16 md:pb-24 lg:grid-cols-[minmax(0,0.82fr)_minmax(32rem,1.18fr)] lg:gap-16">
        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.16em] text-ink/60 uppercase">
            A record of effort
          </p>
          <h1 className="mb-5 max-w-[12ch] text-[clamp(2.6rem,7vw,4rem)] leading-[1.05] font-bold tracking-[-0.04em]">
            Turn focused work into visible progress.
          </h1>
          <p className="mb-7 max-w-[39rem] text-base leading-relaxed text-ink/60 md:text-lg">
            Complete pomodoros, build skills, and see every hour you invest on the path toward
            mastery.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <PrimaryButton asChild>
              <Link to="/onboarding/journey">
                Start your first journey
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </PrimaryButton>
            <a
              href="#product-demonstration"
              className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-bold underline underline-offset-4"
            >
              See how it works
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>

        <Card
          id="product-demonstration"
          aria-label={`Product demonstration for the ${journey.name} Journey`}
          className="scroll-mt-6 gap-0 overflow-hidden border-2 border-ink py-0 shadow-[10px_10px_0_var(--ink)] ring-0"
        >
          <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3 text-[0.6875rem] font-bold tracking-[0.12em] uppercase sm:px-5">
            <span>1000 Pomodoros</span>
            <span className="text-ink/60">Journey 01</span>
          </div>
          <CardContent className="grid p-0 sm:grid-cols-2">
            <div className="border-b-2 border-ink p-4 sm:border-r-2 sm:border-b-0 sm:p-5">
              <p className="mb-2 text-[0.6875rem] font-bold tracking-[0.12em] text-ink/60 uppercase">
                Current Journey
              </p>
              <h2 className="mb-5 text-2xl leading-tight font-bold tracking-[-0.025em]">
                {journey.name}
              </h2>
              <div className="border-y border-ink/20 py-3">
                <p className="mb-1 text-[0.6875rem] font-bold tracking-[0.12em] text-ink/60 uppercase">
                  Next step
                </p>
                <p className="mb-0 text-sm font-bold">{nextStep?.title}</p>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-[0.6875rem] font-bold tracking-[0.12em] text-ink/60 uppercase">
                    Focused time
                  </p>
                  <p className="mb-0 text-xl font-bold">
                    {Math.floor(progress.focusedMinutes / 60)}h {progress.focusedMinutes % 60}m
                  </p>
                </div>
                <span
                  className="grid size-11 place-items-center rounded-full bg-pomodoro-red text-paper"
                  role="img"
                  aria-label="Focused effort recorded"
                >
                  <Check aria-hidden="true" className="size-5" />
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <p className="mb-1 text-[0.6875rem] font-bold tracking-[0.12em] text-ink/60 uppercase">
                Focus session
              </p>
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-ink/20 pb-3">
                <p
                  className="mb-0 text-4xl font-bold tracking-[-0.04em] tabular-nums"
                  role="timer"
                  aria-label="25 minute timer"
                >
                  25:00
                </p>
                <span
                  className="grid size-11 place-items-center rounded-full bg-ink text-paper"
                  role="img"
                  aria-label="Start focus session preview"
                >
                  <Play aria-hidden="true" className="size-4 fill-current" />
                </span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold">
                <span className="text-ink/60">Your visible effort</span>
                <span>{progress.fullPomodoros} / 50</span>
              </div>
              <PomodoroGrid
                focusedMinutes={progress.focusedMinutes}
                totalPomodoros={50}
                latestIndex={progress.fullPomodoros - 1}
              />
              <div className="mt-4 rounded-md bg-ink p-3 text-paper">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pomodoro-red">
                    <Clock3 aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="mb-0 text-xs text-paper/65">Next milestone</p>
                    <p className="mb-0 text-sm font-bold">{nextMilestone?.name}</p>
                  </div>
                </div>
                <MilestoneProgress
                  value={milestonePercent}
                  label="Milestone progress"
                  detail={`${Math.round(milestonePercent)}%`}
                  className="[&_[data-slot=progress]]:bg-paper/20 [&_[data-slot=progress-indicator]]:bg-pomodoro-red [&_span]:text-paper"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="benefits-heading"
        className="relative left-1/2 w-dvw -translate-x-1/2 bg-ink text-paper"
      >
        <div className="mx-auto w-full max-w-content px-gutter-mobile py-16 md:px-gutter-desktop md:py-24">
          <p className="mb-4 text-xs font-bold tracking-[0.16em] text-paper/65 uppercase">
            A simple practice loop
          </p>
          <h2
            id="benefits-heading"
            className="mb-10 max-w-[19ch] text-3xl leading-tight font-bold tracking-[-0.03em] md:text-4xl"
          >
            Small sessions. A body of work you can see.
          </h2>
          <ol className="grid border-t border-paper/20 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <li
                key={benefit}
                className="min-h-32 border-r border-b border-paper/20 p-5 last:border-r-0"
              >
                <span className="text-xs font-bold text-paper/65">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-7 mb-0 max-w-[14ch] text-base font-bold">{benefit}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-content px-gutter-mobile py-16 md:px-gutter-desktop md:py-24">
        <div className="border-t-2 border-ink pt-8">
          <p className="mb-0 max-w-[25ch] text-3xl leading-tight font-bold tracking-[-0.03em] md:text-5xl">
            What will your next 1,000 pomodoros make possible?
          </p>
        </div>
      </footer>
    </PublicLayout>
  );
}
