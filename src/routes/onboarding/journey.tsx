import { createFileRoute } from '@tanstack/react-router'

import { OnboardingCreateJourney } from '@/features/onboarding/onboarding-create-journey'

export const Route = createFileRoute('/onboarding/journey')({
  component: OnboardingCreateJourney,
})
