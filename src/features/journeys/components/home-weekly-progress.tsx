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
        <Card className="h-full border border-ink/15 py-0 ring-0">
          <CardContent className="flex h-full min-h-52 flex-col justify-center p-6">
            <h2
              id="weekly-progress-heading"
              className="mb-3 font-bold text-2xl tracking-[-0.025em]"
            >
              No weekly goal
            </h2>
            <p className="mb-0 text-ink/60 text-sm">Focused sessions still count.</p>
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
      <Card className="h-full border border-ink/15 py-0 ring-0">
        <CardContent className="p-6">
          <h2 id="weekly-progress-heading" className="mb-7 font-bold text-2xl tracking-[-0.025em]">
            This week
          </h2>

          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="mb-0 font-bold text-4xl tabular-nums tracking-[-0.04em]">
              {weekly.completedPomodoros}{' '}
              <span className="text-ink/60 text-xl">/ {weekly.targetPomodoros}</span>
            </p>
            <p className="mb-1 text-right font-bold text-ink/60 text-sm">Pomodoros</p>
          </div>

          <Progress
            value={percent}
            aria-label={`Weekly goal: ${weekly.completedPomodoros} of ${weekly.targetPomodoros} pomodoros`}
            className="h-2 rounded-none bg-ink/12 [&_[data-slot=progress-indicator]]:bg-pomodoro-red"
          />

          <dl className="mt-6 grid grid-cols-2 border-ink/15 border-t pt-4">
            <div className="border-ink/15 border-r pr-4">
              <dt className="mb-1 font-bold text-ink/60 text-sm">Remaining</dt>
              <dd className="mb-0 font-bold text-lg tabular-nums">{weekly.remainingPomodoros}</dd>
            </div>
            <div className="pl-4">
              <dt className="mb-1 font-bold text-ink/60 text-sm">Active days</dt>
              <dd className="mb-0 font-bold text-lg tabular-nums">{weekly.activeDays}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
