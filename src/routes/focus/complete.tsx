import { createFileRoute } from '@tanstack/react-router'

import { CompletionFoundationScreen } from '@/components/foundation-screens'

export const Route = createFileRoute('/focus/complete')({
  component: CompletionFoundationScreen,
})
