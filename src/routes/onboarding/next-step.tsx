import { createFileRoute } from '@tanstack/react-router'

import { OnboardingFoundationScreen } from '@/features/onboarding/onboarding-foundation-screen'

export const Route = createFileRoute('/onboarding/next-step')({
  component: () => <OnboardingFoundationScreen screen="nextStep" />,
})
