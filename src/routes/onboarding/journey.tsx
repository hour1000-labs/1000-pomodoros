import { createFileRoute } from '@tanstack/react-router'

import { OnboardingCreateJourney } from '@/components/onboarding-create-journey'

export const Route = createFileRoute('/onboarding/journey')({
  component: OnboardingCreateJourney,
})
