# MVP UI Foundation Spec

## Overview

This spec establishes the shared frontend foundation for the 1000 Pomodoros coded MVP. Build this before implementing individual screens. The MVP validates the complete loop with client-side persistence: create a Journey, choose a Next step, focus, complete a session, and see progress become visible.

## Requirements

- Use the existing TanStack Start, React 19, TypeScript, Tailwind CSS v4, and Lucide React stack.
- Initialize ShadCN UI for the existing Tailwind v4 project.
- Install only the ShadCN components required by the screen specs: Button, Card, Input, Textarea, Progress, Dialog, Sheet, Select, Tooltip, and Separator.
- Treat `@context/DESIGN.md` as the visual source of truth for colors, typography, spacing, radii, component behavior, responsive layout, and accessibility.
- Load Manrope with `font-display: swap` and use a system sans-serif fallback.
- Define the three brand colors as Tailwind theme variables: Ink `#191816`, Paper `#FFFFFF`, and Pomodoro Red `#C63F32`.
- Create shared layout primitives for public pages, onboarding pages, application pages, and distraction-free focus pages.
- Create responsive application navigation with Home and Journeys destinations. Hide application navigation on focus and onboarding screens.
- Use these routes:
  - `/` for the landing page.
  - `/onboarding/journey` for Journey creation.
  - `/onboarding/motivation` for the optional reason.
  - `/onboarding/target` for target selection.
  - `/onboarding/next-step` for the first Next step.
  - `/home` for the returning-user Home screen.
  - `/journeys/$journeyId` for Journey details.
  - `/focus` for ready, running, and paused timer states.
  - `/focus/complete` for session completion.
  - `/milestones/$milestoneId` for milestone completion.
- Create typed MVP models for Journey, NextStep, FocusSession, Milestone, WeeklyGoal, and AppState.
- Create `@src/lib/mock-data.ts` with the shared “Learn guitar” sample data used by every screen.
- Create a small client-side repository layer that reads and writes MVP data to localStorage. Components must not access localStorage directly.
- Seed mock data only when no saved state exists. Do not overwrite returning-user progress.
- Guard browser-only APIs so TanStack Start SSR does not access `window` during server rendering.
- Persist onboarding drafts, Journeys, Next steps, completed sessions, active timer state, and earned milestones.
- Derive totals from completed sessions where practical instead of maintaining conflicting copies of the same number.
- Use one full pomodoro for every 25 focused minutes. Preserve partial progress as actual minutes.
- Sessions under 5 focused minutes do not add progress unless a later spec explicitly changes the rule.
- Create reusable components for AppNavigation, ScreenHeader, PrimaryButton, JourneyCard, ContinueCard, PomodoroGrid, PomodoroBlock, MilestoneProgress, StatItem, EmptyState, and ConfirmDialog.
- Provide shared loading, empty, and recoverable error states. These are states within existing screens, not additional routes.
- Use skeletons only while persisted state hydrates. Avoid indefinite global spinners.
- Every interactive control must be keyboard accessible, have a visible focus state, and meet a minimum 44px touch target.
- Respect `prefers-reduced-motion` and keep nonessential motion disabled when requested.
- Support widths from 320px upward, 200% zoom, long Journey names, zero progress, partial pomodoros, and the full 2,400-pomodoro target.
- Do not add authentication, a database, payments, manual time entry, full session history, settings, notifications, social feeds, or AI features in this MVP.

## References

- @context/DESIGN.md
- @context/features/landing-page-spec.md
- @context/features/onboarding-create-journey-spec.md
- @context/features/timer-setup-spec.md
- @context/features/journey-detail-spec.md
- @src/lib/mock-data.ts

