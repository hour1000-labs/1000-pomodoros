# Current Feature: MVP UI Foundation

Establish the shared design system, layouts, routes, data model, persistence, and reusable UI primitives required by the coded MVP screens.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

Users can move through a consistent, accessible, responsive MVP shell whose Journey, focus-session, and progress data persists safely between visits.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] ShadCN UI is initialized for Tailwind CSS v4 with only Button, Card, Input, Textarea, Progress, Dialog, Sheet, Select, Tooltip, and Separator installed, without replacing the existing TanStack Start, React 19, TypeScript, Tailwind, or Lucide stack.
- [x] The shared theme follows `context/DESIGN.md`: Manrope loads with `font-display: swap` and a system sans-serif fallback; Ink `#191816`, Paper `#FFFFFF`, and Pomodoro Red `#C63F32` are exposed as Tailwind theme variables; shared spacing, radii, focus, touch-target, and reduced-motion behavior is available to MVP screens.
- [x] Public, onboarding, application, and distraction-free focus layout primitives exist; application navigation links to Home and Journeys responsively and is absent from onboarding and focus layouts.
- [x] File-based routes exist for `/`, all four specified onboarding steps, `/home`, `/journeys/$journeyId`, `/focus`, `/focus/complete`, and `/milestones/$milestoneId`, while loading, empty, and recoverable error experiences remain states within those routes rather than extra routes.
- [x] Typed models exist for Journey, NextStep, FocusSession, Milestone, WeeklyGoal, and AppState, and shared “Learn guitar” sample data is defined in `src/lib/mock-data.ts` for reuse across screens.
- [x] A client-side repository is the sole interface to localStorage; it is safe during SSR, seeds sample data only when saved state is absent, and preserves onboarding drafts, Journeys, Next steps, completed sessions, active timer state, and earned milestones across reloads without overwriting returning-user progress.
- [x] Progress is derived from completed-session minutes where practical, represents each 25 focused minutes as one full pomodoro, preserves partial minutes proportionally, and excludes sessions shorter than 5 focused minutes.
- [x] Reusable AppNavigation, ScreenHeader, PrimaryButton, JourneyCard, ContinueCard, PomodoroGrid, PomodoroBlock, MilestoneProgress, StatItem, EmptyState, and ConfirmDialog components are available and use the shared foundation rather than screen-specific duplication.
- [x] Persisted-state hydration uses a bounded skeleton state, zero-data and recoverable-failure states are available, and no indefinite global spinner is introduced.
- [x] The foundation remains usable by keyboard with visible focus and at least 44px touch targets, respects `prefers-reduced-motion`, and handles 320px widths, desktop widths, 200% zoom, long Journey names, zero progress, partial pomodoros, and a 2,400-pomodoro target without inaccessible or broken layout.
- [x] Authentication, databases, payments, manual time entry, full session history, settings, notifications, social feeds, and AI features are not added.

## Plan

1. Inspect the scaffold, installed dependencies, route conventions, global styles, and referenced screen specs; load the most specific applicable TanStack Intent guidance before implementation.
2. Initialize ShadCN for the existing Tailwind v4 setup, add only the approved primitives, and establish the DESIGN.md theme, Manrope loading, accessibility defaults, and reduced-motion behavior.
3. Define the typed MVP domain model, shared Learn guitar data, progress derivations, and an SSR-safe localStorage repository with first-run seeding and persisted hydration/error handling.
4. Build the four shared layout modes and responsive application navigation, then add the specified file-based route shells with their appropriate layout and state boundaries.
5. Build the reusable navigation, header, action, card, progress, grid, statistic, empty-state, and confirmation components on top of the shared theme and ShadCN primitives.
6. Add focused tests for persistence, seeding, progress rules, SSR guards, and critical shared-component behavior, including accessibility and boundary states.
7. Verify the full foundation with automated tests, a production build, and real-browser checks at mobile and desktop sizes, 200% zoom, keyboard-only interaction, reduced motion, long content, zero/partial progress, and the 2,400-pomodoro target.

## Verification

- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] No relevant console errors
- [x] Repository seeding, reload persistence, returning-user preservation, and SSR guards verified
- [x] Progress derivation verified for under-5-minute, partial, full, and multi-pomodoro sessions
- [x] Keyboard navigation, visible focus, 44px touch targets, and reduced-motion behavior verified
- [x] 320px width, 200% zoom, long Journey names, zero progress, partial progress, and 2,400-pomodoro target verified

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- Source: `context/features/mvp-ui-foundation-spec.md`.
- `context/DESIGN.md` is the visual source of truth; this feature establishes shared foundations and does not invent screen-specific product behavior.
- The pending final treatment of complete/partial blocks and grouping/navigation for 2,400 pomodoros does not block a reusable grid foundation. Final screen behavior remains deferred until those decisions are confirmed.
- Loading, empty, and recoverable error experiences are states inside the specified routes, not new routes.
- Persisted totals should be derived from completed sessions wherever practical to avoid conflicting state.
- Out of scope: authentication, databases, payments, manual time entry, full session history, settings, notifications, social feeds, and AI features.
- Implementation branch: `codex/feature/mvp-ui-foundation`.
- ShadCN CLI 4.13 was initialized in-place with the Radix/Nova preset; only the ten approved component source files were added, and its semantic tokens were remapped to Ink, Paper, and Pomodoro Red with Manrope replacing the generated preset font.
- The required routes intentionally provide shared foundation shells and reusable states. Screen-specific forms, timer behavior, Journey management, completion behavior, and milestone sharing remain assigned to their individual feature specs.
- The localStorage repository is accessed after client hydration through a shared boundary; route modules and server rendering do not read browser globals.
- The progress grid renders 100 blocks at a time for a 2,400-pomodoro target. Selectable blocks use 44px native buttons inside an internally scrollable grid so touch targets do not shrink below the accessibility minimum.
- Review 2026-07-12: `isAppState` validates only the top-level container, so malformed domain records can pass as ready state and crash persisted routes instead of reaching the recoverable error state.
- Review 2026-07-12: rejected saved state is not recoverable in the UI because “Try again” reloads the unchanged invalid value and no reset action is exposed.
- Review 2026-07-12: `completeSession` returns early for an already-completed session, preventing a replay from converging missing milestone, active-timer, Journey timestamp, or last-completed side effects.
- Review 2026-07-12: zero and partial Journey progress pass `latestIndex={0}`, so the first block renders as a full red “latest” pomodoro instead of future or proportional progress.
- Review 2026-07-12: application loading, empty, and persistence-error states render outside `ApplicationLayout`, so Home and Journey lose their required application navigation in those states.
- Review 2026-07-12: direct completion can fabricate a 25-minute result when no completed session resolves, and an unearned milestone can render as completed because `earnedAt` is not checked. These screen-shell states must not present progress that was not earned.
- Remediation 2026-07-12: all review findings above were addressed with nested saved-state validation, confirmed reset recovery, convergent completion replay, accurate zero/partial display, application-shell state handling, and earned-state guards. Formal `feature test` and `feature review` remain required before completion.
- Test 2026-07-12: `pnpm exec tsc --noEmit`, `pnpm test` (4 files, 25 tests), `pnpm build` (client and SSR), and `git diff --check` passed. Playwright verified all required routes, layout-specific navigation, invalid-state reset, zero-data application state, 320px and 1440px layouts, an effective 200% viewport, long Journey content, zero and 20%-partial blocks, the 2,400-pomodoro target window, keyboard focus, visible focus, visible touch targets, reduced motion, reload persistence, and no relevant console errors.
- Review 2026-07-12: Home filters “Today” sessions with the fixed date `2026-07-12`, so completed sessions on any other date are omitted from the displayed daily totals.
- Review 2026-07-12: Journey detail falls back to the last-active or first Journey when the requested `$journeyId` does not exist, so the URL can display an unrelated Journey instead of a not-found/empty state.
- Review 2026-07-12: completion presentation resolves Journey context before resolving the completed session, and completion replay uses the incoming session Journey ID even when preserving an existing completed session. Multi-Journey or replayed state can therefore display or update the wrong Journey.
- Remediation 2026-07-12: replaced the fixed Today date with local-calendar filtering, made Journey detail require the requested ID, bound completion presentation and replay side effects to the completed session's Journey, and corrected singular focused-time copy. Added regression tests for local-date selection and conflicting multi-Journey replay input; targeted browser checks confirmed the not-found, daily-total, and multi-Journey completion states without console errors.
- Test 2026-07-12: `pnpm exec tsc --noEmit`, `pnpm test` (4 files, 27 tests), `pnpm build` (client and SSR), and `git diff --check` passed. Playwright reverified the remediated states at 320px and 1440px: unknown Journey IDs remain in the application shell with a not-found state, Today reports only the current local-date session, completion follows its completed-session Journey when last-active differs, focused-time singular copy is correct, and no relevant console errors were emitted.
- Review 2026-07-12: full tracked and untracked diff from base `4b9c326` re-audited after remediation. Every acceptance criterion and verification item has implementation and current evidence; no blocking findings, unrelated scope, or unapproved dependency changes remain.

## History

<!--
Append completed work from earliest to latest using this format:

### YYYY-MM-DD — <feature name>

- Branch: `codex/feature/<feature-name>`
- Summary: ...
- Verification: ...
-->
