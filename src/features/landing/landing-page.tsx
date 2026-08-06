import { Link } from '@tanstack/react-router';

import { ImportSavedData } from '@/components/shared/import-saved-data';
import { PrimaryButton } from '@/components/shared/primary-button';
import { Button } from '@/components/ui/button';

import { PublicLayout } from './components/public-layout';

export function LandingPage() {
  return (
    <PublicLayout headerAction={<ImportSavedData compact confirmBeforeImport={false} />}>
      <section className="flex min-h-[min(32rem,calc(100dvh-8rem))] items-center">
        <div>
          <h1 className="mb-5 max-w-[15ch] font-bold text-[clamp(2.5rem,7vw,4rem)] leading-[1.05] tracking-[-0.04em]">
            Track focused work, one pomodoro at a time
          </h1>
          <p className="mb-7 max-w-[36rem] text-base text-ink/60 leading-relaxed md:text-lg">
            Choose a Journey, start a Focus session, and see your progress grow.
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <PrimaryButton asChild>
              <Link to="/onboarding/journey">Start your first Journey</Link>
            </PrimaryButton>
            <Button asChild variant="outline">
              <Link to="/sample">Explore sample Journey</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
