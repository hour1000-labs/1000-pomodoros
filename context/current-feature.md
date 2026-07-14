# Current Feature: Feature-First Source Organization

Reorganize the existing React screens, tests, and feature-specific components into cohesive feature modules without changing application behavior.

## Status

Ready to Commit

## Goal

Make each product area easier and safer to navigate and change while preserving every existing route, user flow, persisted state behavior, and visual result.

## Acceptance Criteria

- [x] `src/features/` contains cohesive modules for `landing`, `onboarding`, `journeys`, `focus`, and `milestones`, covering every existing product screen.
- [x] Each feature owns its screen entrypoints, feature-specific components, and colocated tests; reusable design-system primitives remain in `src/components/ui/`, and genuinely cross-feature composed UI is organized under `src/components/shared/`.
- [x] The multi-feature `src/components/foundation-screens.tsx` module is removed after its landing, onboarding, home, journey, focus, completion, and milestone implementations are moved into their owning feature modules.
- [x] Every file-based route keeps its current URL, route parameters, and behavior while acting as a thin TanStack Router adapter that imports the appropriate feature entrypoint.
- [x] Existing application-wide hooks and non-React modules remain under `src/hooks/` and `src/lib/` without duplicating business rules or persistence behavior inside feature folders.
- [x] The root document retains `HeadContent` in `<head>` and `Scripts` in `<body>`, the required Vite plugin order remains unchanged, and `src/routeTree.gen.ts` is not edited manually.
- [x] Landing, onboarding, home, journey detail, focus, session completion, and milestone flows render and behave as they did before the reorganization, including recoverable local persistence states.
- [x] The reorganization adds no product behavior, copy, styling, dependencies, server APIs, data-model changes, or speculative architecture layers.

## Plan

1. Inventory the current route-to-screen and component dependency graph, then assign every existing React module to a feature, shared UI, or design-system primitive boundary.
2. Create the five feature directories and move the existing landing and onboarding implementations with their colocated tests.
3. Split `foundation-screens.tsx` into focused home/journey, focus/completion, milestone, and remaining onboarding entrypoints, moving feature-owned components beside them.
4. Organize genuinely cross-feature composed UI under `src/components/shared/`, preserve `src/components/ui/`, and update imports without introducing unnecessary barrel files or circular feature dependencies.
5. Keep all TanStack route files thin and behaviorally equivalent, regenerate route output only through the configured tooling if required, and verify the complete diff is structural and within scope.
6. Run type checking, tests, production build, diff checks, and browser smoke tests across every existing route on desktop and mobile viewports; remediate any regression before review.

## Verification

- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] `/`, `/home`, every onboarding route, `/focus/`, `/focus/complete`, a Journey detail route, and a Milestone detail route are smoke-tested in a real browser
- [x] Existing persistence success, empty, and recoverable-error states remain reachable and correct
- [x] Mobile and desktop layouts match the pre-reorganization behavior
- [x] No relevant console errors

## Notes

- This is a behavior-preserving source-organization change covering all currently implemented screens, not a product feature or visual redesign.
- Target feature boundaries are `landing`, `onboarding`, `journeys`, `focus`, and `milestones`; add no empty scaffolding for unimplemented product-spec features.
- `src/components/ui/` remains the home of low-level design-system primitives. Only components with real cross-feature consumers belong in `src/components/shared/`; feature-specific components remain private to their owning feature.
- `src/hooks/use-app-state.ts` and the current `src/lib/` modules stay in place during this feature. Splitting persistence, models, or business rules into additional architecture layers is explicitly out of scope.
- TanStack Start and Router structure must remain intact: route files stay under `src/routes/`, the root document contract is preserved, and the generated route tree is never hand-edited.
- The pending product decisions in `context/decisions.md` do not block this structural refactor because no product behavior, data model, or UI decision changes.
- No new dependency is required.
- Implementation split the former `layouts.tsx` by actual ownership: `PublicLayout` belongs to landing, `OnboardingLayout` to onboarding, `ApplicationLayout` to journeys, and the focus-and-milestone `FocusLayout` remains shared.
- `getJourneyContext` moved to `src/lib/journey-context.ts` because journeys, focus, and session completion consume the same pure lookup; feature modules do not import one another.
- The currently unused `LandingFoundationScreen` and `FullTargetFoundationDemo` exports were retained under their owning features so the reorganization does not silently remove internal behavior or examples.
- Start-action checks: `pnpm exec tsc --noEmit` and `git diff --check` passed on 2026-07-13. Tests, production build, and browser verification remain for the `feature test` action.
- Test-action checks on 2026-07-14: `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), and `git diff --check` passed.
- Playwright smoke-tested `/`, `/home`, all four onboarding routes, `/focus/`, `/focus/complete`, seeded Journey detail, earned and unavailable Milestone states, and the associated headings at 1440×1000. Representative landing, onboarding, home, Journey, focus, completion, and Milestone layouts also passed at 320×900 without page-level horizontal overflow.
- Browser persistence checks passed for seeded state, a valid empty state, malformed local storage, the recoverable error UI, its confirmation dialog, and successful reset to the sample Journey. Playwright reported zero console errors or warnings, and the Vite terminal reported no application errors.
- Non-blocking command output remains unchanged: pnpm warns that `pnpm.onlyBuiltDependencies` is ignored, and Vitest/jsdom reports that `window.scrollTo()` is not implemented while all tests pass.
- Review on 2026-07-14 inspected the complete tracked and untracked change set against all eight acceptance criteria. Existing standalone modules differ only by relocated imports or formatting, split screen and layout implementations preserve their prior behavior, framework and route invariants are unchanged, and no blocking finding or unapproved scope expansion remains.

## History

<!--
Append completed work from earliest to latest using this format:

### YYYY-MM-DD — <feature name>

- Branch: `codex/feature/<feature-name>`
- Summary: ...
- Verification: ...
-->

### 2026-07-12 — MVP UI Foundation

- Branch: `codex/feature/mvp-ui-foundation`
- Summary: Added the responsive MVP layouts and routes, shared design system and components, typed Journey data, session-derived progress, and recoverable SSR-safe local persistence.
- Verification: `pnpm exec tsc --noEmit`, `pnpm test` (4 files, 27 tests), `pnpm build` (client and SSR), `git diff --check`, and Playwright checks for routes, persistence recovery, mobile/desktop layouts, accessibility, and progress boundaries passed.

### 2026-07-12 — Landing Page

- Branch: `codex/feature/landing-page`
- Summary: Added the polished responsive public landing page with exact product copy, onboarding actions, an accessible seeded Journey demonstration, full-width benefits band, and closing statement.
- Verification: `pnpm test` (5 files, 29 tests), `pnpm build` (client and SSR), `git diff --check`, and browser checks for CTA navigation, console output, semantic structure, focus and touch targets, reduced motion, 320px/mobile, tablet, desktop, 200% zoom, full-width Ink treatment, and unclipped progress passed.

### 2026-07-13 — Create Journey Onboarding

- Branch: `codex/feature/create-journey-onboarding`
- Summary: Added the responsive first onboarding step with Journey-name validation, draft persistence and restoration, suggestion controls, loss-aware Exit behavior, and WCAG AA-compliant visual treatment.
- Verification: `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, and headed-browser checks for validation boundaries, persistence, routing, focus, confirmation, 320px/desktop/200% layouts, touch targets, WCAG contrast, and console output passed.
