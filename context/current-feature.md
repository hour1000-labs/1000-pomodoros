# Current Feature: Journey Detail

Build the primary Journey progress screen with inspectable visual effort, lightweight Next-step management, recent-session context, and a direct handoff into focus.

## Status

Ready to Commit

## Goal

Users can open a Journey, understand and inspect how their focused effort is accumulating, manage what they will do next, and start another session without losing context.

## Acceptance Criteria

- [x] AC1 — `/journeys/$journeyId` resolves a persisted Journey by route parameter inside the responsive application layout and shows an actionable Journey-not-found state for an unknown ID.
- [x] AC2 — The screen shows the Journey name, optional reason, total focused time, total pomodoros, current time-based milestone, next time-based milestone, percentage toward the next milestone, and remaining pomodoros to that milestone, all derived from persisted state.
- [x] AC3 — The seeded “Learn guitar” state renders 43 pomodoros, 17 hours 55 minutes, and 72% progress toward the 25-hour milestone for screenshot verification.
- [x] AC4 — The PomodoroGrid is the dominant product element and defaults to the 100-pomodoro section containing current progress, using 10 columns and clearly identifying the next milestone rather than rendering the full target first.
- [x] AC5 — Pomodoro blocks implement the `context/DESIGN.md` complete, proportional partial, future, latest, and milestone treatments without relying on color alone; manual time counts normally and is labeled in inspection details rather than visually penalized in the overview.
- [x] AC6 — Every progress-bearing block can be reached and activated with a keyboard and exposes its contributing session date, duration, Next step, and timer or manual source in an accessible Tooltip or Dialog; multiple contributing sessions are represented without fabricating a single source.
- [x] AC7 — “View full Journey” switches or expands the same page into target-derived 100-pomodoro sections, including 24 sections for the default 2,400-pomodoro target, while pagination, virtualization, or progressive rendering prevents 2,400 interactive blocks from entering the initial DOM.
- [x] AC8 — The current Next step appears prominently above one “Start 25:00” primary action, and activating Start opens `/focus` with that Journey and Next step selected through the existing focus-selection contract.
- [x] AC9 — When the Journey has no current Next step, the screen replaces the unavailable Start action with a clear “Add a Next step” path rather than starting an unscoped session.
- [x] AC10 — A lightweight ordered list shows upcoming incomplete Next steps below the primary progress content without displaying a completed-step history.
- [x] AC11 — The user can add one valid Next step inline or in a small accessible dialog, and the new item is persisted without introducing task-manager fields or behaviors.
- [x] AC12 — The user can mark the current Next step complete, persist its completion, and atomically promote the next incomplete item to current; an empty state appears when none remain.
- [x] AC13 — Two or three recent completed sessions appear as supporting context only and show useful Journey-specific session information derived from persisted state.
- [x] AC14 — Dedicated, actionable states cover zero progress, no Next step, no sessions, hydration, recoverable persistence failure, and an unknown Journey without inventing progress or activity.
- [x] AC15 — On mobile, one sticky Start action remains reachable without covering grid content or conflicting with responsive application navigation; the page remains usable from 320px upward, at 200% zoom, with long Journey and Next-step text, and on desktop.
- [x] AC16 — The screen preserves visible focus, appropriate accessible names and semantics, minimum 44px touch targets, WCAG AA contrast, and reduced-motion preferences across grid, dialogs, Next-step controls, and navigation.
- [x] AC17 — The feature adds no subtasks, priorities, labels, due dates, dependencies, Kanban behavior, outcome-based milestones, Journey editing, personal milestones, manual-time creation, full session history, or additional route for the full-Journey view.

## Plan

1. Extend the Journey progress derivation and repository mutation layer for sectioned milestone progress, honest block-to-session inspection data, Next-step creation, and atomic completion/promotion (AC2, AC3, AC5, AC6, AC7, AC11, AC12, AC13).
2. Evolve the shared PomodoroBlock and PomodoroGrid APIs to support accessible inspection, exact visual states, target-derived 100-block sections, and bounded progressive rendering while preserving existing consumers (AC4–AC7, AC14, AC16).
3. Compose the persisted Journey Detail screen and route states with the application layout, header metrics, current milestone section, full-Journey disclosure, recent sessions, and empty/error experiences (AC1–AC7, AC13, AC14).
4. Add the current and upcoming Next-step presentation plus accessible add and complete interactions backed by repository persistence (AC8–AC12, AC14, AC16, AC17).
5. Wire the Journey and current Next step into the existing `/focus` selection flow and implement the non-overlapping sticky mobile Start treatment (AC8, AC9, AC15).
6. Preserve and, where necessary, extend seeded data so the visual reference state remains exactly reproducible without overwriting returning-user progress (AC2, AC3, AC13, AC14).
7. Add focused unit and integration coverage for derived progress, block attribution and interaction, full-view render bounds, routing, focus handoff, Next-step mutations, persistence failure, and empty states (AC1–AC14, AC16).
8. Verify the complete Journey Detail experience against the screenshot and design system in real desktop and mobile browsers, including responsive, accessibility, maximum-content, empty, and large-target cases (AC3–AC17).

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused tests verify minute-to-pomodoro conversion, partial progress, milestone boundaries and rounding, including 1,075 minutes = 43 pomodoros = 17 hours 55 minutes and 72% of 25 hours
- [x] Route and state tests verify valid, unknown, hydrating, recoverable-error, zero-progress, no-Next-step, and no-session cases
- [x] PomodoroGrid tests verify 10-column current sections, complete/partial/future/latest/milestone states, manual-source details, multi-session attribution, accessible block activation, and existing-consumer compatibility
- [x] Full-Journey tests prove target-derived 100-block grouping and that the initial DOM does not contain 2,400 interactive blocks
- [x] Next-step tests verify validation, addition, persistence, current-step completion, promotion order, failure recovery, and the final empty state
- [x] Focus-handoff tests verify `/focus` receives and restores the selected Journey and Next step without creating a duplicate session
- [x] Desktop browser verification confirms the seeded metrics, dominant grid hierarchy, block inspection, full-Journey disclosure, Next-step flows, recent sessions, focus handoff, and visual-reference fidelity
- [x] Mobile browser verification from 320px upward confirms responsive navigation, 10-column grid usability, sticky Start reachability, safe-area spacing, no covered content, and 44px touch targets
- [x] Browser verification covers 200% zoom, keyboard-only use, visible focus and focus restoration, long Journey and Next-step text, reduced motion, zero progress, no Next step, no sessions, and the 2,400-pomodoro target
- [x] No relevant browser console errors or warnings occur during the verified flows

## Notes

- Source specification: `context/features/journey-detail-spec.md`; visual reference: `context/screenshots/journey-detail-ui.png`; visual and interaction contract: `context/DESIGN.md`.
- On 2026-07-17, the user approved feature-scoped use of the existing design defaults: complete/partial/future/latest/milestone block treatments, 100-pomodoro sections with 10 columns, an in-page progressively rendered full-Journey view, time-based milestones only, and no completed-step history on this screen.
- The approval above unblocks Journey Detail without changing the broader pending entries in `context/decisions.md`; those decisions remain open for other product surfaces unless resolved separately.
- The default view is the 100-pomodoro section containing current progress and the next time-based milestone. The full view derives its section count from the Journey target; 2,400 blocks and 24 sections apply to the default 1,000-hour target rather than being hard-coded for every Journey.
- Progress is derived from eligible completed-session minutes. Partial blocks remain proportional to actual focused minutes, and manual sessions are disclosed in details without a punitive overview style.
- When more than one session contributes minutes to a block, inspection must disclose the contributing sessions rather than assigning misleading singular metadata.
- If no current Next step exists, the screen offers the scoped Add action and does not start focus with a missing Next-step selection.
- The dedicated Journey Detail spec defines this feature slice. Journey icon/color editing, outcome-based and personal milestones, completed-step history, manual-time creation, and broader Journey-management capabilities from the product specification remain out of scope.
- `feature load` documents scope only. No application implementation, branch creation, or verification checkbox completion occurs during this action.
- `feature start` on 2026-07-17 created `codex/feature/journey-detail` and implemented the persisted progress derivation, inspectable and progressively rendered grid, Next-step add/complete flows, typed focus handoff, supporting session context, and non-overlapping mobile action dock. The feature remains `In Progress` pending the dedicated `feature test` and `feature review` actions.
- `feature test` on 2026-07-18 added direct Journey Detail loading and recoverable-retry route coverage. The focused Journey Detail suite passed 13 tests; the full suite passed 14 files and 129 tests. `pnpm check` checked 97 files with no warnings, `pnpm exec tsc --noEmit` passed, the client and SSR production build passed, and `git diff --check` passed.
- Live browser verification passed at 1440×900, 375×812, and 320×568, plus a 640×400 200%-zoom equivalent. It covered the seeded 43-pomodoro/17-hour-55-minute/72% state, 24-section progressive view with 300 initial blocks, keyboard block activation and focus restoration, Next-step validation/addition/completion, focus handoff without session creation, maximum unbroken text, reduced motion, zero/no-step/no-session states, and the unknown-Journey route. Mobile measurements found no document overflow, one visible dock action, 12px between the content viewport and dock, 19px between the dock and navigation, contained horizontal grid scrolling, and 44×44px progress controls.
- Browser-computed colors passed WCAG AA contrast checks: ink at 60% on white was 4.64:1, ink at 65% was 5.50:1, and white/red combinations were 5.05:1. The browser console reported 0 errors and 0 warnings; Vitest separately printed jsdom's non-failing `Window.scrollTo()` not-implemented diagnostic.
- Post-verification change classification: documentation-only. This working-file update records evidence and checks completed criteria without affecting executable behavior; `pnpm test`, `pnpm build`, TypeScript, and browser evidence remain applicable. `pnpm check`, `git diff --check`, and a focused current-feature structure audit were rerun after the documentation update.
- `feature review` on 2026-07-18 found no blocking correctness, regression, accessibility, performance, dependency, or scope issues across AC1–AC17. A fresh live review at 1440×900, 768×900, and 375×812 confirmed the visual hierarchy, responsive reflow, contained mobile scrolling, distinct fixed action/navigation bands, progressive 300-block full view, dialog focus trapping and restoration, blank-input feedback, 44×44px minimum visible controls, and zero browser errors or warnings.
- Post-review change classification: documentation-only. The status and review record do not affect executable behavior, so the passing test, TypeScript, build, and browser evidence above remain applicable; the universal `pnpm check`, `git diff --check`, and current-feature structure audit were rerun after this update.

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
