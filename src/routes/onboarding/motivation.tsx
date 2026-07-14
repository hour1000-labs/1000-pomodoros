import { createFileRoute } from '@tanstack/react-router';

import { OnboardingAddMotivation } from '@/features/onboarding/onboarding-add-motivation';

export const Route = createFileRoute('/onboarding/motivation')({
  component: OnboardingAddMotivation,
});
