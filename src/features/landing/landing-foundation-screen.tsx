import { Link } from '@tanstack/react-router';

import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardContent } from '@/components/ui/card';
import { formatFocusedDuration } from '@/lib/format-focused-duration';

import { PublicLayout } from './components/public-layout';

export function LandingFoundationScreen() {
  return (
    <PublicLayout>
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1.2fr)] md:gap-16">
        <ScreenHeader
          title="Track focused work, one pomodoro at a time"
          description="Choose a Journey, start a Focus session, and see your progress grow."
          actions={
            <PrimaryButton asChild>
              <Link to="/onboarding/journey">Start your first Journey</Link>
            </PrimaryButton>
          }
        />

        <Card className="gap-0 border border-ink/10 py-0 shadow-none ring-0">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="mb-1 text-ink/60 text-sm">Journey</p>
                <p className="mb-0 font-bold text-2xl">Learn guitar</p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-ink/60 text-sm">Focused time</p>
                <p className="mb-0 font-bold text-lg tabular-nums">
                  {formatFocusedDuration(43 * 25)}
                </p>
              </div>
            </div>

            <div className="border-ink/10 border-y py-4">
              <p className="mb-1 text-ink/60 text-sm">Next step</p>
              <p className="mb-0 font-bold">Practice the F chord transition</p>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-ink/60 text-sm">Focus session</p>
                <p className="mb-0 font-bold text-4xl tabular-nums tracking-[-0.04em]">25:00</p>
              </div>
              <p className="mb-1 text-right text-ink/60 text-sm">
                <span className="block font-bold text-ink tabular-nums">43 / 50</span>
                Pomodoros
              </p>
            </div>

            <PomodoroGrid focusedMinutes={43 * 25} totalPomodoros={50} latestIndex={42} />
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
