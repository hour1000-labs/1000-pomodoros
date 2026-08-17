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
      <div className="space-y-20 md:space-y-28">
        {/* Hero Section & Product Preview */}
        <section
          aria-labelledby="hero-title"
          className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-6">
            <h1
              id="hero-title"
              className="mb-5 max-w-[15ch] font-extrabold text-[clamp(2.5rem,5.5vw,3.75rem)] text-ink leading-[1.04] tracking-[-0.04em]"
            >
              Turn focused work into visible progress
            </h1>
            <p className="mb-8 max-w-[32rem] text-base text-ink/75 leading-relaxed md:text-lg">
              Complete 25-minute pomodoros, build skills, and watch every hour you invest add up to
              long-term mastery.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <PrimaryButton asChild size="lg" className="w-full sm:w-auto">
                <Link to="/onboarding/journey">Start your first Journey</Link>
              </PrimaryButton>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/sample">Explore sample Journey</Link>
              </Button>
            </div>
          </div>

          {/* Product Preview Showcase (Non-persisted) */}
          <div className="lg:col-span-6">
            <Card className="gap-0 rounded-2xl border border-ink/8 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] ring-1 ring-ink/5 sm:p-8">
              <CardContent className="space-y-6 p-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-extrabold text-ink text-xl tracking-tight sm:text-2xl">
                      Learn guitar
                    </h2>
                    <p className="mt-1 text-ink/65 text-sm">
                      Next step:{' '}
                      <span className="font-bold text-ink">Practice the F chord transition</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-ink/8 bg-ink/[0.02] px-3 py-1.5 text-right">
                    <p className="mb-0 font-extrabold text-ink text-lg tabular-nums">43 / 50</p>
                    <p className="mb-0 font-bold text-[11px] text-ink/50 uppercase tracking-wider">
                      pomodoros
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 border-ink/8 border-t pt-6 sm:flex-nowrap">
                  <div>
                    <span className="block font-black text-4xl text-ink tabular-nums tracking-[-0.05em]">
                      25:00
                    </span>
                    <span className="font-bold text-ink/50 text-xs uppercase tracking-wider">
                      Focus session
                    </span>
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
          <div className="mb-10 text-center md:mb-14">
            <h2
              id="how-it-works-title"
              className="mb-3 font-extrabold text-3xl text-ink tracking-[-0.03em] sm:text-4xl"
            >
              How it works
            </h2>
            <p className="mx-auto max-w-[32rem] text-base text-ink/70">
              Three simple steps to turn focused work into visible progress.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            <div className="group space-y-3.5 rounded-2xl border border-ink/8 bg-card p-6 shadow-sm transition-all duration-200 hover:border-ink/16 hover:shadow-md sm:p-8">
              <span className="inline-block rounded-md bg-ink/[0.04] px-2.5 py-1 font-black text-ink/70 text-xs tracking-wider">
                01
              </span>
              <h3 className="font-extrabold text-ink text-lg tracking-tight">
                Choose what you want to improve
              </h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Create a Journey for any skill, project, or goal you want to master over time.
              </p>
            </div>

            <div className="group space-y-3.5 rounded-2xl border border-ink/8 bg-card p-6 shadow-sm transition-all duration-200 hover:border-ink/16 hover:shadow-md sm:p-8">
              <span className="inline-block rounded-md bg-ink/[0.04] px-2.5 py-1 font-black text-ink/70 text-xs tracking-wider">
                02
              </span>
              <h3 className="font-extrabold text-ink text-lg tracking-tight">
                Focus on the next step
              </h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Work in 25-minute focus sessions with one clear, actionable next step always in
                view.
              </p>
            </div>

            <div className="group space-y-3.5 rounded-2xl border border-ink/8 bg-card p-6 shadow-sm transition-all duration-200 hover:border-ink/16 hover:shadow-md sm:p-8">
              <span className="inline-block rounded-md bg-ink/[0.04] px-2.5 py-1 font-black text-ink/70 text-xs tracking-wider">
                03
              </span>
              <h3 className="font-extrabold text-ink text-lg tracking-tight">
                Watch your focused effort add up
              </h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Every finished pomodoro fills your visual progress grid, turning effort into visible
                proof.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center md:mt-16">
            <PrimaryButton asChild size="lg">
              <Link to="/onboarding/journey">Start your first Journey</Link>
            </PrimaryButton>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
