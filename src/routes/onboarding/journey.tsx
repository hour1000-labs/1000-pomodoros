import { createFileRoute } from '@tanstack/react-router'

import { OnboardingFoundationScreen } from '@/components/foundation-screens'

export const Route = createFileRoute('/onboarding/journey')({
  component: () => <OnboardingFoundationScreen screen="journey" />,
})
