import { createFileRoute } from '@tanstack/react-router'

import { FocusSessionScreen } from '@/features/focus/focus-session-screen'

export const Route = createFileRoute('/focus/')({ component: FocusSessionScreen })
