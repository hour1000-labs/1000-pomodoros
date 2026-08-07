import { Link } from '@tanstack/react-router';

import { ImportSavedData } from '@/components/shared/import-saved-data';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { PublicLayout } from './components/public-layout';

export function LandingPage() {
  return (
    <PublicLayout headerAction={<ImportSavedData compact confirmBeforeImport={false} />}>
      <div className="space-y-16 md:space-y-20">
        {/* Hero Section & Product Preview */}
        <section
          aria-labelledby="hero-title"
          className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14"
        >
          <div className="lg:col-span-6">
            <h1
              id="hero-title"
              className="mb-4 max-w-[16ch] font-bold text-[clamp(2.25rem,5vw,3.5rem)] text-ink leading-[1.08] tracking-[-0.035em]"
            >
              Turn focused work into visible progress
            </h1>
            <p className="mb-7 max-w-[32rem] text-base text-ink/70 leading-relaxed md:text-lg">
              Complete 25-minute pomodoros, build skills, and watch every hour you invest add up to
              long-term mastery.
            </p>
            <div className="flex flex-col items-start gap-3.5 sm:flex-row sm:items-center">
              <PrimaryButton asChild size="lg">
                <Link to="/onboarding/journey">Start your first Journey</Link>
              </PrimaryButton>
              <Button asChild variant="outline" size="lg">
                <Link to="/sample">Explore sample Journey</Link>
              </Button>
            </div>
          </div>

          {/* Product Preview Showcase (Non-persisted) */}
          <div className="lg:col-span-6">
            <Card className="gap-0 rounded-2xl border border-ink/12 bg-paper p-6 shadow-sm ring-0 sm:p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-ink text-xl sm:text-2xl">Learn guitar</h2>
                    <p className="mt-1 text-ink/70 text-sm">
                      Next step:{' '}
                      <span className="font-semibold text-ink">
                        Practice the F chord transition
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0 font-bold text-ink text-xl tabular-nums">43 / 50</p>
                    <p className="mb-0 text-ink/60 text-xs">pomodoros</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 border-ink/10 border-t pt-6 sm:flex-nowrap">
                  <div>
                    <span className="block font-bold text-4xl text-ink tabular-nums tracking-[-0.04em]">
                      25:00
                    </span>
                    <span className="text-ink/60 text-xs">Focus session</span>
                  </div>

                  <div className="w-full flex-1 sm:w-auto">
                    <PomodoroGrid focusedMinutes={43 * 25} totalPomodoros={50} latestIndex={42} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3-Step Core Loop Explanation */}
        <section aria-labelledby="how-it-works-title">
          <div className="mb-8 text-center md:mb-12">
            <h2
              id="how-it-works-title"
              className="mb-2.5 font-bold text-2xl text-ink tracking-[-0.025em] sm:text-3xl"
            >
              How it works
            </h2>
            <p className="mx-auto max-w-[32rem] text-base text-ink/70">
              Three simple steps to turn focused work into visible progress.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            <div className="space-y-3 rounded-xl border border-ink/12 bg-paper p-6 shadow-none sm:p-7">
              <span className="font-bold text-ink/40 text-xs uppercase tracking-widest">01</span>
              <h3 className="font-bold text-ink text-lg">Choose what you want to improve</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Create a Journey for any skill, project, or goal you want to master over time.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-ink/12 bg-paper p-6 shadow-none sm:p-7">
              <span className="font-bold text-ink/40 text-xs uppercase tracking-widest">02</span>
              <h3 className="font-bold text-ink text-lg">Focus on the next step</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Work in 25-minute focus sessions with one clear, actionable next step always in
                view.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-ink/12 bg-paper p-6 shadow-none sm:p-7">
              <span className="font-bold text-ink/40 text-xs uppercase tracking-widest">03</span>
              <h3 className="font-bold text-ink text-lg">Watch your focused effort add up</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Every finished pomodoro fills your visual progress grid, turning effort into visible
                proof.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center md:mt-14">
            <PrimaryButton asChild size="lg">
              <Link to="/onboarding/journey">Start your first Journey</Link>
            </PrimaryButton>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
