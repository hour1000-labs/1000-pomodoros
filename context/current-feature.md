# Current Feature: Timer Setup

Add the distraction-free `/focus` ready state so users can confirm their Journey, Next step, and duration and start one persisted focus session.

## Status

Ready to Commit

## Goal

Users can review or change what they will focus on, choose a valid duration, and begin a session from a compact setup screen that reliably restores any session already in progress.

## Acceptance Criteria

- [x] `/focus` shows the timer ready state in the distraction-free focus layout with no application navigation.
- [x] The setup resolves a valid Journey and current Next step from route search parameters when provided, otherwise from the most recently active Journey, and displays both selections.
- [x] Visiting `/focus` when no Journey exists redirects to `/onboarding/journey` instead of rendering an empty setup state.
- [x] Duration controls offer 25 minutes, 50 minutes, and Custom, with 25 minutes selected by default.
- [x] Selecting Custom reveals one labeled minutes input that accepts only whole durations from 5 through 240 minutes and provides clear inline validation for invalid values.
- [x] Quiet Change actions let users choose an existing Journey or Next step in keyboard-accessible, focus-managed dialogs or sheets without exposing Journey-management controls.
- [x] The setup previews the progress earned by the selected duration, including that 25 focused minutes fills one pomodoro block.
- [x] The screen has one primary action labeled `Start focus session`.
- [x] Starting creates and persists one `running` FocusSession with its start time, planned duration, Journey ID, and Next step ID, together with the active timer state needed for restoration.
- [x] Repeated activation while session creation is in flight cannot create duplicate active sessions.
- [x] After a successful start, the same `/focus` route renders the running-session state instead of the setup state.
- [x] An existing running or paused active session is restored on `/focus` instead of showing or creating a new setup session.
- [x] Persistence failures are surfaced recoverably and do not transition the UI into a false running state.
- [x] The complete setup form and primary action fit within one common mobile viewport from 320px width without clipping or horizontal overflow, while remaining usable on desktop and at 200% zoom.
- [x] All setup controls have accessible names, visible focus treatment, keyboard operation, and at least 44px touch targets; nonessential motion respects reduced-motion preferences.

## Plan

1. Define and validate `/focus` search parameters, then resolve the requested or most recently active Journey and its current Next step with an onboarding redirect when no Journey exists.
2. Build the responsive timer setup surface from the existing focus layout and shared primitives, matching the supplied visual reference and design tokens without application navigation.
3. Add duration selection, conditional custom-duration input, 5-to-240-minute validation, and the pomodoro-progress preview.
4. Add accessible, selection-only Change dialogs or sheets for Journey and Next step and keep route selection state synchronized.
5. Add an atomic repository operation that creates the running FocusSession and active timer metadata once, reports save failure, and prevents duplicate starts.
6. Make `/focus` dispatch from persisted active-session state so successful starts and restored running or paused sessions bypass setup and enter the appropriate focus state.
7. Add focused unit and component tests for resolution precedence, redirects, duration boundaries, selection changes, persistence failure, duplicate prevention, and active-session restoration.
8. Verify the complete flow and responsive layout in a real browser against the screenshot, including keyboard, mobile-height, desktop, 200% zoom, reload, and repeated-click cases.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Journey and Next step resolution, missing-Journey redirect, and existing-session restoration pass automated tests
- [x] Duration defaults, 5/240-minute boundaries, custom validation, and selection dialogs pass automated tests
- [x] Session creation, persistence failure, and duplicate-start prevention pass automated tests
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] 320px width, common short mobile height, and 200% zoom verified with the full setup and primary action reachable
- [x] Keyboard navigation, dialog focus management, visible focus, accessible names, and 44px touch targets verified
- [x] Reload restoration and repeated Start activation verified without duplicate active sessions
- [x] No relevant console errors

## Notes

- Visual implementation follows `context/screenshots/timer-setup-ui.png` and `context/DESIGN.md`, using the existing three-color system and shared focus-layout primitives.
- Client-side persistence must go through the repository layer; components must not access `localStorage` directly, and browser-only APIs must remain SSR-safe.
- One pomodoro remains exactly 25 focused minutes. The selected duration controls the preview and persisted planned duration; Custom is available here as explicitly required by this feature spec.
- Running countdown behavior, pause/resume, finish-early, cancellation, completion credit, and fullscreen behavior remain governed by the separate running, paused, and completion specs. This feature includes only the state-aware `/focus` handoff and restoration needed to keep setup from replacing an active session.
- Journey and Next step Change surfaces are selection-only. Creating, editing, ordering, completing, or scheduling them is outside this feature.
- The pending overtime cap, break-timer, progress-grid grouping, completed-next-step placement, sharing, and paid-tier decisions do not affect this ready-state scope. The pending final pomodoro-block treatment does not block the small preview because this feature uses the established shared block treatment and supplied screenshot.
- Assumption: a resolved Journey normally has a current Next step because the completed onboarding flow creates one. The feature does not invent a Next step management flow for malformed or legacy state.
- The shell defaults to unsupported Node 18.14.0; implementation typechecks and focused Vitest runs use the already-installed Node 22.22.0 runtime required by the project.
- Initial verification passed `pnpm check`, the full `pnpm test` suite (10 files, 61 tests), and client/SSR `pnpm build`. Browser testing then found the setup 16px too tall in the default 320×568 state and 147px too tall with Custom 240 selected.
- The responsive remediation was classified as localized behavioral because it changed only the timer setup's short-height composition and progress preview. It compacted short-height spacing and targets, kept one spec-required pomodoro preview block, and prevented the narrow Custom label from wrapping. The first focused revalidation passed `pnpm check`, `git diff --check`, the timer suite (1 file, 8 tests), client/SSR `pnpm build`, and the complete affected browser matrix; the other 53 tests were initially reused because the localized UI remediation could not affect them.
- A direct selection-dialog focus-restoration test was then added as test-only proof. Final current revalidation passed `pnpm check`, `git diff --check`, the full `pnpm test` suite (10 files, 62 tests), and client/SSR `pnpm build`, so no earlier automated evidence remains reused in place of a current full run.
- Production-browser verification passed at 1280×800, 320×568 including Custom 240, and a 640×400 200%-zoom equivalent. Search fallback and selection, onboarding redirect, dialog focus restoration, keyboard radio selection, visible 3px focus, 44px minimum controls, double activation, persisted record fields, running and paused reload restoration, and zero browser console warnings or errors were directly observed.
- The final evidence-recording update is documentation-only and cannot affect runtime, tests, build output, or browser behavior; its universal `pnpm check` and `git diff --check` gates were rerun while all current executable evidence remained applicable.
- Final review found no blocking bugs, regressions, accessibility issues, missing error handling, unrelated refactors, dependency changes, or scope expansion. Every feature code change maps to a documented acceptance criterion, and all automated and browser evidence remains current. The review-status update is documentation-only; `pnpm check` and `git diff --check` were rerun while the current test, build, and browser evidence remained applicable.

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
