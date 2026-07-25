import { Target } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WeeklyProgress {
  completedPomodoros: number;
  targetPomodoros: number;
  remainingPomodoros: number;
  activeDays: number;
}

export function HomeWeeklyProgress({ weekly }: { weekly: WeeklyProgress | null }) {
  if (weekly === null) {
    return (
      <section aria-labelledby="weekly-progress-heading">
        <Card className="h-full border border-ink/20 py-0 ring-0">
          <CardContent className="flex h-full min-h-52 flex-col justify-center p-6">
            <p className="mb-3 font-bold text-[0.68rem] text-ink/60 uppercase tracking-[0.14em]">
              This week
            </p>
            <h2
              id="weekly-progress-heading"
              className="mb-3 font-bold text-2xl tracking-[-0.025em]"
            >
              No weekly goal yet
            </h2>
            <p className="mb-0 max-w-[34ch] text-ink/60 text-sm leading-relaxed">
              Your focused sessions still count. A weekly target can be added when that setting is
              available.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const percent =
    weekly.targetPomodoros <= 0
      ? 0
      : Math.min(100, (weekly.completedPomodoros / weekly.targetPomodoros) * 100);

  return (
    <section aria-labelledby="weekly-progress-heading">
      <Card className="h-full border-2 border-ink py-0 shadow-[5px_5px_0_var(--ink)] ring-0">
        <CardContent className="p-6">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 font-bold text-[0.68rem] text-ink/60 uppercase tracking-[0.14em]">
                This week
              </p>
              <h2
                id="weekly-progress-heading"
                className="mb-0 font-bold text-2xl tracking-[-0.025em]"
              >
                Weekly progress
              </h2>
            </div>
            <Target aria-hidden="true" className="size-5 text-pomodoro-red" />
          </div>

          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="mb-0 font-bold text-4xl tabular-nums tracking-[-0.04em]">
              {weekly.completedPomodoros}{' '}
              <span className="text-ink/50 text-xl">/ {weekly.targetPomodoros}</span>
            </p>
            <p className="mb-1 text-right font-bold text-xs uppercase tracking-[0.12em]">
              Pomodoros
            </p>
          </div>

          <Progress
            value={percent}
            aria-label={`Weekly goal: ${weekly.completedPomodoros} of ${weekly.targetPomodoros} pomodoros`}
            className="h-2 rounded-none bg-ink/12 [&_[data-slot=progress-indicator]]:bg-pomodoro-red"
          />

          <dl className="mt-6 grid grid-cols-2 border-ink/15 border-t pt-4">
            <div className="border-ink/15 border-r pr-4">
              <dt className="mb-1 font-bold text-[0.65rem] text-ink/60 uppercase tracking-[0.12em]">
                Remaining
              </dt>
              <dd className="mb-0 font-bold text-lg tabular-nums">{weekly.remainingPomodoros}</dd>
            </div>
            <div className="pl-4">
              <dt className="mb-1 font-bold text-[0.65rem] text-ink/60 uppercase tracking-[0.12em]">
                Active days
              </dt>
              <dd className="mb-0 font-bold text-lg tabular-nums">{weekly.activeDays}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
