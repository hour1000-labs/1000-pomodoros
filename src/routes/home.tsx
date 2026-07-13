import { createFileRoute } from '@tanstack/react-router'

import { HomeFoundationScreen } from '@/components/foundation-screens'

export const Route = createFileRoute('/home')({ component: HomeFoundationScreen })
