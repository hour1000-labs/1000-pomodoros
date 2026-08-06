import { Link } from '@tanstack/react-router';

import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Card, CardContent } from '@/components/ui/card';
import { learnGuitarMockData } from '@/lib/mock-data';
import { deriveJourneyProgress } from '@/lib/progress';

import { PublicLayout } from './components/public-layout';

export function LandingPage() {
  const { journey, nextSteps, focusSessions, milestones } = learnGuitarMockData;
  const progress = deriveJourneyProgress(journey, focusSessions);
  const nextStep = nextSteps.find((step) => step.status === 'current');
  const nextMilestone = milestones.find((milestone) => milestone.earnedAt === null);
  const milestonePercent = nextMilestone
    ? (progress.focusedMinutes / nextMilestone.targetFocusedMinutes) * 100
    : 100;

  return (
    <PublicLayout>
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(28rem,1.2fr)] lg:gap-16">
        <div>
          <h1 className="mb-5 max-w-[15ch] font-bold text-[clamp(2.5rem,7vw,4rem)] leading-[1.05] tracking-[-0.04em]">
            Track focused work, one pomodoro at a time
          </h1>
          <p className="mb-7 max-w-[36rem] text-base text-ink/60 leading-relaxed md:text-lg">
            Choose a Journey, start a Focus session, and see your progress grow.
          </p>
          <PrimaryButton asChild>
            <Link to="/onboarding/journey">Start your first Journey</Link>
          </PrimaryButton>
        </div>

        <Card
          aria-label={`${journey.name} Journey preview`}
          className="gap-0 border border-ink/10 py-0 shadow-none ring-0"
        >
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="mb-1 font-bold text-ink/60 text-sm">Journey</p>
                <h2 className="mb-0 font-bold text-2xl leading-tight tracking-[-0.025em]">
                  {journey.name}
                </h2>
              </div>
              <div className="shrink-0 text-right">
                <p className="mb-1 text-ink/60 text-sm">Focused time</p>
                <p className="mb-0 font-bold text-lg tabular-nums">
                  {Math.floor(progress.focusedMinutes / 60)}h {progress.focusedMinutes % 60}m
                </p>
              </div>
            </div>

            <div className="border-ink/10 border-y py-4">
              <p className="mb-1 text-ink/60 text-sm">Next step</p>
              <p className="mb-0 font-bold">{nextStep?.title}</p>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-ink/60 text-sm">Focus session</p>
                <p
                  className="mb-0 font-bold text-4xl tabular-nums tracking-[-0.04em]"
                  role="timer"
                  aria-label="25-minute Focus session"
                >
                  25:00
                </p>
              </div>
              <p className="mb-1 text-right text-ink/60 text-sm">
                <span className="block font-bold text-ink tabular-nums">
                  {progress.fullPomodoros} / 50
                </span>
                Pomodoros
              </p>
            </div>

            <PomodoroGrid
              focusedMinutes={progress.focusedMinutes}
              totalPomodoros={50}
              latestIndex={progress.fullPomodoros - 1}
            />

            <div className="border-ink/10 border-t pt-4">
              <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                <span className="text-ink/60">Next milestone</span>
                <span className="font-bold">{nextMilestone?.name}</span>
              </div>
              <MilestoneProgress
                value={milestonePercent}
                label="Milestone progress"
                detail={`${Math.round(milestonePercent)}%`}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
