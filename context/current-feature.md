# Current Feature: Home Screen

Create the returning-user Home screen that routes onboarded users into a next-action-first view before showing recent progress and supporting statistics.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- Describe what should change from the user's perspective. -->

Users with a Journey consistently arrive on Home after onboarding or when revisiting the landing route, where they can immediately see what to work on next, start a preselected 25-minute focus session, and review concise, session-derived progress.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] `/home` uses the application-page layout and responsive application navigation, and redirects to `/onboarding/journey` when no Journey exists.
- [x] Successfully completing the final onboarding step creates the first Journey and current Next step as before, then routes the user to `/home` instead of `/focus`.
- [x] Navigating to `/` redirects to `/home` when persisted state contains at least one Journey; users without a Journey continue to see the landing page.
- [x] The first viewport is dominated by a Continue section that appears before supporting statistics and shows the most recently active Journey and its current Next step.
- [x] Continue has one primary `Start 25:00` action that routes to `/focus` with that Journey and Next step selected.
- [x] When the Continue Journey has no current Next step, the Start action is replaced by one `Add a Next step` action.
- [x] Compact Today statistics show completed pomodoros and focused minutes, and the seeded state displays `2` pomodoros and `50` focused minutes.
- [x] Weekly progress shows the completed amount, goal amount, remaining amount, and active days, and the seeded state displays `7 of 10` pomodoros, `3` remaining, and `3` active days.
- [x] Every displayed statistic is derived from persisted completed focus sessions rather than a conflicting stored total.
- [x] One or two Active Journey cards appear below Continue, and each card shows the Journey name, focused time, current milestone, and current Next step.
- [x] Each Active Journey card body routes to `/journeys/$journeyId`, while its Start action remains a separate keyboard-focusable control that opens `/focus` with that Journey and Next step selected.
- [x] Two or three recent completed sessions appear below Active Journeys as supporting context.
- [x] A Journey with no completed activity receives a calm state containing `Your next pomodoro starts here` without guilt-heavy language.
- [x] Mobile layouts preserve Continue and its CTA before all supporting statistics; the full Home experience remains usable from 320px upward, at 200% zoom, and with long Journey and Next step text.
- [x] Home follows the referenced visual hierarchy and design system, including compact supporting numbers, visible keyboard focus, accessible names and semantics, and minimum 44px touch targets.
- [x] Home does not add trend charts, productivity scores, comparison metrics, streak-loss warnings, or a grid of equal-weight analytics cards.

## Plan

1. Inspect the existing `/`, final onboarding, and `/home` routes, application layout and navigation, shared Home/Journey components, repository selectors, persisted models, mock data, and related tests.
2. Add or refine Home data derivation for the most recently active Journey, current Next step, completed-session Today and weekly statistics, Active Journeys, and recent completed sessions.
3. Change successful onboarding completion to enter `/home`, and guard `/` so persisted Journey owners bypass the landing page while new users can still view it.
4. Build the responsive Continue experience with its preselected Start action and no-Next-step fallback.
5. Add the compact Today and weekly progress regions, Active Journey cards, recent sessions, zero-activity state, and required routing and focus semantics.
6. Add or update automated tests for session-derived values, seeded values, onboarding and landing redirects, empty states, section ordering, and Journey and focus navigation.
7. Verify the completed Home experience and entry flows across mobile and desktop viewports, 200% zoom, long content, keyboard interaction, persistence states, and console output.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Automated routing tests cover final onboarding success to `/home`, `/` with a persisted Journey to `/home`, `/` without a Journey remaining on the landing page, and `/home` without a Journey redirecting to onboarding
- [x] Automated Home tests cover completed-session derivation, seeded Today and weekly values, no-Journey redirect, no-Next-step fallback, and Journey and focus destinations
- [x] Onboarding-to-Home and persisted landing-to-Home entry flows verified in the browser
- [x] Seeded, zero-activity, and long-content Home states verified in the browser
- [x] Continue hierarchy, section order, card/body action separation, and keyboard focus behavior verified in the browser
- [x] Mobile at 320px, desktop, and 200% zoom verified without clipping or horizontal overflow
- [x] No relevant browser or terminal errors

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- Source specification: `context/features/home-spec.md`.
- Visual and behavior references: `context/screenshots/home-ui.png`, `context/DESIGN.md`, `context/features/mvp-ui-foundation-spec.md`, `context/features/journey-detail-spec.md`, `context/features/timer-setup-spec.md`, and `src/lib/mock-data.ts`.
- Use the existing client-side repository layer for persisted state; Home components must not access `localStorage` directly.
- Seeded screenshot values are presentation fixtures, but their displayed statistics must still be produced from the seeded completed sessions.
- 2026-07-24 scope update: Journey existence is the completed-onboarding signal for routing. Successful final onboarding now enters `/home`, and `/` is reserved for users without a Journey.
- This explicit routing direction supersedes the existing onboarding spec requirements to route successful submission to `/focus` and not end onboarding on Home; it also makes the landing-page spec conditional on having no persisted Journey.
- Implementation derives Home data through a pure selector with an injected current time. Production uses the real local date; seeded screenshot verification uses local July 12, 2026, the date represented by the fixed seed sessions.
- Today statistics are app-wide. Weekly statistics respect the persisted goal's Journey scope and Sunday/Monday week start, and a missing weekly goal receives a calm no-goal state rather than an invented target.
- Persisted-state redirects happen only after client hydration and use replacement navigation. User-clicked destinations remain real links with typed Journey and Next-step search parameters.
- 2026-07-25 feature test automated evidence: `pnpm check` passed for 102 files with no warnings; `pnpm test` passed 16 files and 147 tests; `pnpm build` completed the client and SSR bundles; `pnpm exec tsc --noEmit`, `git diff --check`, and whitespace checks for the untracked Home files passed.
- Production-browser verification used the built preview. With the browser clock fixed to local July 12, 2026, Home displayed `2` pomodoros and `50` focused minutes Today plus `7 / 10`, `3` remaining, and `3` active days for the week.
- Browser flows verified Journey-free `/home` to onboarding, Journey-free `/` staying on Landing, the full four-step onboarding flow ending on Home with exactly one Journey, one current Next step, one milestone, and no session, and persisted `/` replace-redirecting to Home without exposing Landing or returning there on Back.
- Browser interaction checks verified both Home Start controls opened `/focus` with the correct Journey and Next step preselected, the Journey-card body opened Journey detail independently, and keyboard traversal exposed distinct focus stops with visible focus treatment.
- Browser state checks covered seeded, zero-activity, missing-weekly-goal, missing-current-step, maximum-length unbroken Journey and Next-step text, and no-active-Journey states. The long-content state remained horizontally contained at 320px.
- Responsive checks passed at 1280×800 desktop, 320×568 mobile, and a 640×400 200%-zoom equivalent. At 320px, every visible Home navigation/action target measured at least 44px and the document width matched the viewport.
- The production browser console reported zero errors and zero warnings, and the preview terminal reported no errors. Vitest printed the existing jsdom `Window.scrollTo()` not-implemented notices without test failures.
- Post-verification remediation classification: localized behavioral (test-suite-only impact). Four focused coverage gaps were added for per-Journey summary/card isolation, recent-session eligibility, cross-Journey Next-step references, and the missing-weekly-goal UI. Because no production code changed, the earlier production build and browser evidence remained applicable; `pnpm check`, the full `pnpm test`, `pnpm exec tsc --noEmit`, `git diff --check`, and whitespace checks for the untracked Home files were rerun and passed.
- Final evidence-recording update classification: documentation-only. This checkbox and Notes update cannot affect executable behavior, build output, or browser results, so those results remain applicable; the required cheap gates and feature-document structure were rerun after the update.
- 2026-07-25 feature review finding (blocking, criteria 14 and 15): at 375×812 with a valid 80-character Journey name and 120-character unbroken Next step, keyboard focus moves the Continue CTA to `764–812px` while the fixed mobile navigation covers `751–812px`, leaving the focused primary action entirely obscured. The same long-content state pushes the CTA well below the first viewport at 320×568. Normal seeded layouts remain contained and all controls meet the 44px target.
- 2026-07-25 feature review finding (blocking, criterion 15): the 10.88px Pomodoro Red Continue eyebrow on the Ink card measures `3.51:1`, below the design system's WCAG AA `4.5:1` requirement for text of this size.
- 2026-07-25 feature review finding (low severity): Home samples `new Date()` only when state renders, so an open tab crossing local midnight or the weekly boundary retains stale Today and weekly values until another state update or reload.
- 2026-07-25 feature review observation (non-blocking): Home and Journey Detail duplicate deterministic Next-step ordering and current-step selection; a shared Journey-step selector would prevent the policies from drifting.
- Feature review verdict: Needs Changes. Status remains `In Progress` until the blocking accessibility findings and stale calendar-boundary behavior are remediated and the affected browser evidence is rerun.
- Feature-review record update classification: documentation-only. After recording the findings and invalidating the affected criteria and browser evidence, `pnpm check` passed for 102 files, `git diff --check` and untracked-file whitespace checks passed, and the required feature-document structure remained intact. Unaffected test, build, and browser evidence remains applicable.
- 2026-07-25 post-review remediation classification: localized behavioral. The bounded change adds mobile focus-scroll clearance to both Continue actions, changes the eyebrow to an approved Paper-on-Ink pairing, and introduces a client-side local-midnight refresh hook. It does not change persistence, routing, session eligibility, or data derivation.
- Remediation tests added direct hook rollover/rescheduling and cleanup coverage plus a Home integration test that crosses local midnight. `pnpm check` passed for 104 files, the focused suites passed 10 tests, the full `pnpm test` passed 17 files and 150 tests, `pnpm exec tsc --noEmit` passed, `pnpm build` completed client and SSR bundles, and `git diff --check` plus untracked-file whitespace checks passed.
- Remediation browser evidence: at 375×812 with valid maximum-length unbroken Journey and Next-step text, keyboard focus scrolled the Start CTA to `684–732px` above the mobile navigation at `751–812px`, leaving about `19px` clearance and no horizontal overflow. The Start and Add fallbacks also remained fully visible at 320×568 and the 640×400 200%-zoom equivalent; normal seeded mobile and 1440×900 desktop layouts remained contained with 44px-or-larger targets.
- The remediated Continue eyebrow computes to `8.01:1` contrast at 10.88px, exceeding the required `4.5:1`. A production-browser rollover from local July 12 at 23:59:50 to July 13 changed Today from `2` pomodoros and `50` focused minutes to `0` and `0` without reload. Both browser sessions reported zero errors and zero warnings, and the preview terminal reported no errors.
- Full valid Next-step text remains visible rather than being truncated. Focus scroll-margin accounts for the fixed mobile navigation and safe-area inset without changing the primary information hierarchy.
- Post-remediation evidence-recording update classification: documentation-only. Checking the remediated criteria and recording test evidence cannot affect executable behavior or published output; `pnpm check` passed for 104 files, `git diff --check` and untracked-file whitespace checks passed, and the feature-document structure remained intact. The completed test, build, and browser evidence remains applicable.
- 2026-07-25 remediation review: no blocking findings remained. Independent code review found no concrete issue in the remediation, and independent UI review confirmed the maximum-length Start and Add actions remained above the fixed navigation at mobile and 200%-zoom-equivalent viewports with no horizontal overflow, 44px-or-larger controls, and zero console errors or warnings. All acceptance criteria are satisfied, so the feature status advanced to `Ready to Commit`.
- Final review-record update classification: documentation-only. Updating the status and recording the review result cannot affect executable behavior or published output, so the completed automated and browser evidence remains applicable; the universal cheap gates and feature-document structure are rerun after this update.
- Pending decisions about pomodoro-grid treatment, full-Journey grouping, and milestone sharing do not materially affect this Home scope and are not blockers.
- Excluded from scope: trend charts, productivity scores, comparison metrics, streak-loss warnings, equal-weight analytics cards, and unrelated navigation or data-model expansion.
- No unresolved blocker was identified during `feature load`.

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
