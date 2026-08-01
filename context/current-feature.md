# Current Feature: Milestone Reached

Turn the existing milestone route into a calm, earned-only record of a completed milestone with honest persisted progress, a completed PomodoroGrid section, the next goal, and a direct return to the Journey.

## Status

Ready to Commit

## Goal

A user who reaches a milestone can review the work that earned it, understand the next milestone, and continue the related Journey, while missing or unearned milestone URLs never display celebratory content.

## Acceptance Criteria

- [x] `/milestones/$milestoneId` resolves the requested Milestone and its related Journey from the persisted application state without accessing browser storage directly from the screen.
- [x] A missing Milestone, a Milestone without its related Journey, or a Milestone whose `earnedAt` is `null` shows a useful non-celebratory not-found state with a route back to Home.
- [x] The earned state follows `context/screenshots/milestone-ui.png` and `context/DESIGN.md` within existing application patterns, with one restrained visual hierarchy and “25 hours” as the largest element for the seeded milestone.
- [x] Every displayed achievement value is derived from persisted state; `createMilestoneReachedAppState()` renders “Learn guitar,” “25 hours,” “You showed up for 60 pomodoros.”, and “Reached July 12, 2026.”
- [x] The earned state renders the completed milestone range as a responsive 10-column `PomodoroGrid`, with all 60 seeded milestone pomodoros visibly complete and the milestone boundary identified accessibly.
- [x] The next later Milestone for the same Journey is derived from persisted state and shows its target plus the remaining progress; the seeded state shows “50 focused hours” with 25 focused hours remaining.
- [x] The single primary “Continue Journey” action routes to `/journeys/$journeyId` for the persisted Journey.
- [x] The earned content uses only one short entrance transition, disables that nonessential motion for `prefers-reduced-motion`, and adds no confetti, coins, XP, badges, fireworks, streak pressure, or looping animation.
- [x] The screen preserves semantic headings, descriptive progress text, visible keyboard focus, WCAG AA contrast, and minimum 44px interactive touch targets.
- [x] The full earned, loading, recoverable-error, and not-found states remain readable without page-level horizontal scrolling at 320px and work at desktop widths and 200% zoom.

## Plan

1. Add focused milestone-detail derivation that resolves an earned Milestone, its Journey, the completed pomodoro count, and the next later Journey Milestone from persisted state.
2. Replace the current milestone placeholder with the screenshot-informed earned layout using the existing persisted-state boundary, design tokens, shared actions, and `PomodoroGrid`.
3. Render the persisted Journey name, earned date, milestone values, completed 10-column grid, remaining next-milestone progress, and Journey continuation route.
4. Preserve useful loading and recoverable-error behavior, strengthen the invalid or unearned state, and add the short reduced-motion-aware entrance treatment.
5. Add focused automated coverage for earned, missing, unearned, persisted-value, next-milestone, grid, and navigation behavior.
6. Verify the completed screen in a real browser across responsive, accessibility, reduced-motion, and persistence boundary cases.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused tests cover earned, missing, unearned, persisted-value, next-milestone, grid, and Continue Journey behavior
- [x] Seeded earned, missing, and unearned milestone routes are verified in a real browser
- [x] The affected UI is verified at 320px, desktop, and a 200%-zoom equivalent without page-level horizontal scrolling
- [x] Keyboard access, focus visibility, semantic structure, touch targets, contrast, and reduced motion are verified
- [x] No relevant console errors

## Notes

- Version-one scope intentionally excludes “Share milestone,” the Web Share API, clipboard fallback, and copied-summary confirmation after the user chose not to include milestone sharing in version one. The screenshot's secondary share action is therefore not part of this feature.
- `context/decisions.md` keeps milestone sharing pending for possible later work; because sharing is excluded here, that pending choice does not block this feature.
- Preserve the existing `PomodoroGrid` complete and milestone states rather than resolving the broader pending visual-treatment decision in this feature.
- Outcome-based milestones remain outside scope; this screen uses the existing time-based `targetFocusedMinutes` and `earnedAt` model.
- Reuse the existing route, persisted-state boundary, repository-owned state, design system, and shared components. Do not add dependencies or broaden this work into milestone creation, manual time entry, social features, or share-card generation.
- `context/screenshots/milestone-ui.png` is a visual reference rather than a pixel-perfect desktop layout; the implementation must adapt its hierarchy to the established application shell and responsive constraints.
- The initial implementation TypeScript check exposed that the earned resolver still returned `earnedAt` as nullable after validating it. The derived data now narrows that field without a cast, and the rerun passes.
- Next-milestone progress counts only eligible completed-session minutes beyond the reached target. Earned milestones above 100 pomodoros render only their final bounded 100-block section, preserving the established large-grid convention.
- Implementation checks on 2026-07-26 passed: `pnpm check` (107 files), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 162 tests), `pnpm build` (client and SSR), and `git diff --check`. Vitest emitted its existing non-failing jsdom `window.scrollTo()` notices.
- Browser, responsive, accessibility, reduced-motion, and console verification were completed during `feature test`; criterion completion and `Ready to Commit` remained gated on the completed `feature review`.
- Post-verification evidence recording was documentation-only and cannot affect runtime, types, tests, or bundles. `pnpm check`, `git diff --check`, and the feature-file contract audit pass after the update; the current TypeScript, test, and build evidence is reused.
- Fresh feature-test verification on 2026-07-31 passed: `pnpm check` (107 files), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 162 tests), `pnpm build` (1,943 client modules and 179 SSR modules), and `git diff --check`. Vitest emitted only its existing non-failing jsdom `window.scrollTo()` notices.
- Real-browser checks on 2026-07-31 covered the earned, missing, and unearned URLs; the seeded persisted copy and 60-block grid; the milestone boundary; the next milestone; exclusion of Share; the 48px Continue and Return Home targets; keyboard focus visibility; semantic headings, figure, block labels, and progress; reduced motion; and the Continue Journey route. Visual and overflow checks passed at 1280×800, 320×568, a 640×400 200%-zoom equivalent, and 320px with long unbroken persisted names. Browser and Vite output contained zero errors or warnings.
- The live contrast audit found the feature-local 10.88px uppercase labels at 3.94:1. This was classified as a localized behavioral remediation and corrected by raising only those four label colors from `text-ink/55` to `text-ink/60`; the labels now measure 4.66:1, while red achievement text and the primary action measure 5.05:1. The remediation reran `pnpm check` (107 files), the two milestone test files (12 tests), `pnpm build`, `git diff --check`, and the affected browser contrast, responsive, focus, reduced-motion, and console checks. The full 162-test and TypeScript evidence is reused because this feature-local opacity-token change cannot affect application logic or types; the production build was rerun because generated CSS could change.
- Feature review on 2026-08-01 inspected the complete change set from base `f66ec40`, including all tracked and untracked feature files, and found no blocking correctness, regression, accessibility, error-handling, dependency, or scope findings. Fresh live review passed at 1440×900, 768×1024, and 375×812 for the earned layout, hover and keyboard focus, 48px primary action, Journey navigation, missing and unearned routes, a simulated recoverable storage-read error, reduced motion, responsive fit, and zero browser or Vite warnings/errors. The recorded 320px, 200%-zoom-equivalent, maximum-content, full-suite, TypeScript, and production-build evidence remains applicable because no executable source changed after `feature test`.
- The review validated the contrast change as a localized behavioral remediation: its four feature-local opacity tokens have a bounded visual impact, and the recorded focused tests, production build, affected browser checks, `pnpm check`, and `git diff --check` satisfy the required revalidation while unrelated full-suite and type evidence can be reused. The review-status and checklist update is documentation-only; `pnpm check`, `git diff --check`, and the feature contract audit pass after it without invalidating runtime evidence.
- `context/screenshots/milestone-ui-v2.png` remains an unrelated untracked user file and is excluded from this feature's change set and future staging.

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

### 2026-07-14 — Feature-First Source Organization

- Branch: `codex/chore/feature-first-source-organization`
- Summary: Reorganized existing screens, tests, and composed components into cohesive landing, onboarding, journeys, focus, and milestones modules while preserving routes, behavior, persisted state, and visual results.
- Verification: `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, and Playwright checks across every route, persistence success/empty/recovery states, mobile and desktop layouts, and console output passed.

### 2026-07-14 — Adopt Biome Code Quality Tooling

- Branch: `codex/chore/adopt-biome`
- Summary: Installed pinned Biome tooling, standardized formatting and linting across the repository, added warning-strict quality scripts and editor integration, and documented the convention for future work.
- Verification: `pnpm check` (78 files), `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, generated-route integrity, and headed Playwright checks at 1280x800 and 320x800 with no console errors or warnings passed.

### 2026-07-14 — Auto-sort Tailwind classes with Biome

- Branch: `codex/chore/auto-sort-tailwind-classes-with-biome`
- Summary: Enabled automatic Tailwind class sorting through the existing Biome fix-on-save workflow and normalized existing class strings without adding another formatter.
- Verification: `pnpm check` (78 files), `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, a 108-string token-preservation audit, and headed Playwright checks at 1280x800 and 320x800 with no console errors or warnings passed.

### 2026-07-14 — Add Motivation Onboarding

- Branch: `codex/feature/add-motivation-onboarding`
- Summary: Added the optional motivation onboarding step with Journey context, reason persistence and restoration, Continue, Skip, and Back navigation, responsive mobile layouts, and accessible interaction states.
- Verification: `pnpm check` (80 files), `pnpm test` (7 files, 40 tests), `pnpm build` (client and SSR), `git diff --check`, and headed-browser checks for navigation, persistence, redirect, character boundaries, accessibility, mobile, desktop, 200% zoom, maximum-content overflow, and console output passed.

### 2026-07-14 — Risk-based feature revalidation policy

- Branch: `codex/chore/risk-based-feature-revalidation-policy`
- Summary: Added proportional post-verification revalidation rules with universal cheap gates, risk-based targeted checks, evidence reuse, and incremental remediation review guidance.
- Verification: Initial `pnpm check` (80 files), `pnpm test` (7 files, 40 tests), `pnpm build` (client and SSR), and `git diff --check` passed; documentation-only remediations passed repeated `pnpm check`, `git diff --check`, and focused cross-document contract audits.

### 2026-07-15 — Choose Target Onboarding

- Branch: `codex/feature/choose-target-onboarding`
- Summary: Added the responsive third onboarding step with accessible preset and custom focused-time targets, pomodoro conversions, validation, draft persistence, and forward/back navigation.
- Verification: `pnpm check` (82 files), `pnpm test` (8 files, 45 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for navigation, persistence, keyboard and screen-reader semantics, validation boundaries, responsive layouts from 320px through desktop, 200% zoom, maximum-content overflow, and console output passed.

### 2026-07-15 — Add Next Step Onboarding

- Branch: `codex/feature/add-next-step-onboarding`
- Summary: Added the final onboarding step with actionable Next step validation, atomic Journey and 10-pomodoro milestone creation, idempotent submission, draft-safe Back navigation, and a direct handoff into focus setup.
- Verification: `pnpm check` (84 files), `pnpm test` (9 files, 52 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for the full onboarding-to-focus flow, validation, persistence, repeated submission, keyboard and screen-reader semantics, responsive layouts from 320px through desktop, 200% zoom, maximum-content overflow, touch targets, and console output passed.

### 2026-07-15 — UI Polish and pnpm 11 Cleanup

- Branch: `codex/fix/remove-duplicate-next-step-guidance`
- Summary: Removed repeated Next step guidance, added pointer feedback to shared clickable buttons, and migrated the dependency build allowlist to pnpm 11 settings.
- Verification: `pnpm install --frozen-lockfile`, `pnpm check` (84 files), `pnpm test` (9 files, 52 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks at desktop and 320×568 mobile widths for single guidance rendering, pointer cursors, layout overflow, and console output passed.

### 2026-07-15 — Timer Setup

- Branch: `codex/feature/timer-setup`
- Summary: Added the responsive `/focus` setup flow with Journey and Next step selection, validated durations, persisted duplicate-safe session creation, and running or paused session restoration.
- Verification: `pnpm check` (85 files), `pnpm test` (10 files, 62 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks at 1280×800, 320×568 including Custom 240, and a 640×400 200%-zoom equivalent for selection, redirect, validation, accessibility, duplicate activation, persistence, restoration, responsive fit, and console output passed.

### 2026-07-15 — Running Focus Timer

- Branch: `codex/feature/running-focus-timer`
- Summary: Added a distraction-free, persisted running countdown with timestamp-based drift recovery, atomic Pause and natural completion, leave protection, fullscreen controls, and concise assistive announcements.
- Verification: `pnpm check` (87 files), `pnpm test` (11 files, 76 tests), `pnpm build` (client and SSR), focused remediation tests (18 tests), `git diff --check`, and headed production-browser checks for reload and background recovery, Pause persistence, leave and return, fullscreen, completion idempotence, reduced motion, accessibility, 320px mobile, desktop, 200% zoom, maximum-length content, and console output passed.

### 2026-07-15 — Paused Focus Timer

- Branch: `codex/feature/paused-focus-timer`
- Summary: Added a responsive persisted paused timer with Resume, eligible Finish early, confirmed cancellation, accessible feedback and focus handoff, failure recovery, and duplicate-safe progress handling.
- Verification: `pnpm check` (87 files), `pnpm test` (11 files, 89 tests), `pnpm build` (client and SSR), `git diff --check`, and headed production-browser checks for reload restoration, Resume, eligible and ineligible Finish early, dismissed and confirmed cancellation, persistence failures, accessibility, 320px mobile, desktop, 200% zoom, maximum-length content, and console output passed.

### 2026-07-16 — Session Complete

- Branch: `codex/feature/session-complete`
- Summary: Added a refresh-safe completion experience with exact session credit, milestone awards, visible newly earned progress, optional reflection, and contextual progress or restart actions.
- Verification: `pnpm check` (88 files), `pnpm test` (12 files, 99 tests), focused remediation tests (1 file, 9 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for completion paths, refresh safety, attribution boundaries, actions, reflection, responsive layouts, accessibility, reduced motion, and console output passed.

### 2026-07-18 — Journey Detail

- Branch: `codex/feature/journey-detail`
- Summary: Added the responsive Journey progress experience with inspectable Pomodoro sections, milestone context, scoped focus handoff, lightweight Next-step management, recent sessions, and resilient empty and persistence states.
- Verification: `pnpm check` (97 files), `pnpm exec tsc --noEmit`, `pnpm test` (14 files, 129 tests), `pnpm build` (client and SSR), `git diff --check`, and live-browser checks from 320px through desktop plus a 200%-zoom equivalent for progress inspection, progressive full-Journey rendering, Next-step flows, focus handoff, responsive layout, accessibility, contrast, reduced motion, persistence states, and console output passed.

### 2026-07-25 — Home Screen

- Branch: `codex/feature/home-screen`
- Summary: Added a returning-user Home screen with onboarding and landing redirects, next-action-first focus handoff, session-derived Today and weekly progress, Active Journeys, recent sessions, responsive accessibility, and local-midnight refresh.
- Verification: `pnpm check` (104 files), `pnpm exec tsc --noEmit`, `pnpm test` (17 files, 150 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for onboarding and landing redirects, seeded, empty, and maximum-content states, focus and navigation behavior, 320px mobile, desktop, a 200%-zoom equivalent, midnight rollover, contrast, touch targets, overflow, and console output passed.
