import { createFileRoute } from '@tanstack/react-router';

import { OnboardingChooseTarget } from '@/features/onboarding/onboarding-choose-target';

export const Route = createFileRoute('/onboarding/target')({
  component: OnboardingChooseTarget,
});
