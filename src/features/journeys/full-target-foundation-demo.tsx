import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import type { Journey } from '@/lib/models';

export function FullTargetFoundationDemo({ journey }: { journey: Journey }) {
  return (
    <PomodoroGrid
      focusedMinutes={0}
      totalPomodoros={journey.targetMinutes / 25}
      renderLimit={100}
    />
  );
}
