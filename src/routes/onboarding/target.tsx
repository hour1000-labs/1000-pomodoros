import { createFileRoute } from '@tanstack/react-router'

import { OnboardingFoundationScreen } from '@/features/onboarding/onboarding-foundation-screen'

export const Route = createFileRoute('/onboarding/target')({
  component: () => <OnboardingFoundationScreen screen="target" />,
})
