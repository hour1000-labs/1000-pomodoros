import { createFileRoute } from '@tanstack/react-router'

import { OnboardingFoundationScreen } from '@/components/foundation-screens'

export const Route = createFileRoute('/onboarding/next-step')({
  component: () => <OnboardingFoundationScreen screen="nextStep" />,
})
