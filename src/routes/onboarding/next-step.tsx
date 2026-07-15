import { createFileRoute } from '@tanstack/react-router';

import { OnboardingAddNextStep } from '@/features/onboarding/onboarding-add-next-step';

export const Route = createFileRoute('/onboarding/next-step')({
  component: OnboardingAddNextStep,
});
