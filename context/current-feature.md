# Current Feature: Running Focus Timer

Add the distraction-free running state for an active focus session, with a drift-resistant persisted countdown, Pause, fullscreen support, safe completion, and accessible state announcements.

## Status

Ready to Commit

## Goal

When a focus session is running, the user can stay centered on the remaining time and current work, pause confidently, leave without stopping the timer, and reach completion without lost or duplicated progress.

## Acceptance Criteria

- [x] `/focus` renders the running timer state whenever the active `FocusSession` has `running` status, including after restoring a persisted active session on reload.
- [x] The running view fills the available viewport, removes application navigation and unrelated product chrome, and shows only the dominant tabular-numeral countdown, Journey name, current Next step, one prominent Pause button, and a quiet fullscreen control when the Fullscreen API is available.
- [x] The running view does not show analytics, upcoming steps, streaks, session history, task lists, or other distracting information, and its responsive presentation follows `context/screenshots/focus-timer-ui.png` and `context/DESIGN.md` without copying reference-only browser or Figma chrome.
- [x] Remaining time is derived from persisted timestamps as the source of truth; a lightweight interval only refreshes the display, so background tabs, device sleep, delayed callbacks, and reloads do not introduce countdown drift.
- [x] Selecting Pause calculates and persists the current remaining seconds from the timestamp-derived countdown, changes the active session and timer state to `paused`, prevents further countdown, and renders the paused `/focus` state.
- [x] Reaching zero finalizes the elapsed session exactly once and routes to `/focus/complete`; repeated callbacks, rerenders, or reloads cannot duplicate session progress, totals, or milestone awards.
- [x] Attempting to navigate away while the timer is running presents a confirmation explaining that the timer will continue, and confirming departure leaves the persisted running session active so returning shows the correct remaining time.
- [x] The fullscreen control enters and exits fullscreen through the browser API, reflects the current fullscreen state, remains keyboard accessible, and is omitted when the API is unavailable.
- [x] Assistive technology receives concise announcements for Pause, Resume, five minutes remaining, one minute remaining, and completion, with each threshold or state change announced once rather than every second.
- [x] The running timer honors reduced-motion preferences and uses no pulsing, ticking, looping, or other visually noisy animation.
- [x] The experience remains usable with keyboard navigation, visible focus, 44px minimum touch targets, long Journey and Next step text, 320px mobile layouts, desktop layouts, and 200% zoom without clipping or overflow.

## Plan

1. Inspect the existing focus session screen, active-timer model, repository persistence, completion flow, and test helpers; define the running-state calculations and transitions against the existing data contracts.
2. Add pure timestamp-based remaining-time and threshold logic, including reload/background recovery and single-execution completion guards.
3. Extend repository-backed active-session transitions for pausing and idempotent natural completion while preserving the existing setup and paused-state boundaries.
4. Build the responsive running focus UI on `/focus` with the required Journey and Next step context, dominant tabular countdown, Pause action, conditional fullscreen control, and distraction-free layout.
5. Add navigation-leave protection, fullscreen lifecycle handling, reduced-motion behavior, and one-time assistive announcements for state changes and meaningful time thresholds.
6. Add focused automated coverage for timestamp calculations, persistence restoration, Pause, completion idempotence, navigation confirmation, fullscreen availability, and accessible announcements.
7. Run the required quality gates and verify the complete running-timer flow in a real browser across responsive, reload, backgrounding, keyboard, zoom, reduced-motion, and maximum-content cases.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Automated timer tests cover timestamp-derived remaining time, delayed refreshes, reload restoration, Pause persistence, and single-execution completion
- [x] Automated interaction tests cover leave confirmation, supported and unsupported Fullscreen API states, and one-time assistive announcements at Pause, Resume, five minutes, one minute, and completion
- [x] Running, Pause-to-paused, natural-completion, confirmed-leave-and-return, reload, and background/sleep-equivalent flows are verified in a production browser build
- [x] The UI is verified at 320px mobile, desktop, and 200% zoom with long Journey and Next step text, keyboard navigation, visible focus, and no clipping or overflow
- [x] Reduced motion is verified with no pulsing, ticking, looping, or essential animation
- [x] No relevant browser console errors or warnings occur

## Notes

- Source: `context/features/focus-timer-running-spec.md`.
- Visual references are `context/screenshots/focus-timer-ui.png` and `context/DESIGN.md`; the screenshot guides hierarchy and composition, while the repository design tokens and accessibility rules remain authoritative.
- The existing Timer Setup feature already persists `FocusSession` and `ActiveTimer` records and restores running or paused sessions; this feature should extend those contracts rather than create a parallel timer store.
- The paused screen's Resume, Finish early, and Cancel behaviors remain scoped to `context/features/focus-timer-paused-spec.md`; this feature owns only the Pause transition and the resulting handoff to the paused state.
- The credited completion presentation and optional reflection remain scoped to `context/features/session-complete-spec.md`; this feature owns safe natural finalization and routing into that flow.
- Browser-native unload confirmations may not display application-defined copy. The implementation should provide the specified explanatory confirmation for in-app navigation and use the strongest supported protection for tab close, reload, or external navigation without stopping the persisted timer.
- Overtime, break timers, ambient sound, browser notifications, analytics, and timer settings are outside this feature.
- The pending overtime-cap and break-timer decisions do not affect this running countdown because overtime is off by default and break timers are out of scope. No pending decision blocks loading this feature.
- Implementation uses persisted `targetEndAt` as the running countdown source of truth. `remainingSeconds` records the current running segment boundary for Pause and Resume accounting, while repository transitions atomically update the matching `FocusSession` and `ActiveTimer`.
- Natural completion records the scheduled target timestamp and the focused duration represented by accumulated plus current running-segment seconds, then reuses the repository's idempotent completion state transition before navigating.
- Preliminary implementation verification passed: `pnpm check` (87 files), `pnpm test` (11 files, 74 tests), `pnpm build` (client and SSR), and `git diff --check`. Production-browser checks passed for timestamp restoration, unload protection, Pause persistence, fullscreen enter/exit, natural completion and reload idempotence, keyboard focus, reduced motion, long content, 320×568 mobile, 1280×800 desktop, and zero console warnings.
- Browser verification found 40px of vertical overflow at the 640×400 200%-zoom equivalent with maximum-length context. This localized responsive remediation reduced only short-viewport padding and gaps; current `pnpm check`, `pnpm build`, the focused timer suite (16 tests), `git diff --check`, and the exact 640×400 browser case passed afterward. The prior full-suite evidence was reused because the remediation changed only responsive class values and could not affect timer or repository behavior.
- Formal `feature test` verification passed on 2026-07-15: `pnpm check` checked 87 files with no warnings, `pnpm test` passed 11 files and 76 tests, `pnpm build` completed the client and SSR builds, and `git diff --check` passed. Two focused interaction tests were added for Pause-save and natural-completion-save failures; both confirm persisted running state is retained and a recoverable error is shown.
- Fresh headed production-browser verification covered 1280×800 desktop, 320×568 mobile, and the 640×400 200%-zoom equivalent with maximum-length Journey and Next step text. All viewports had exact document/main bounds with no horizontal or vertical overflow, and Pause remained a visible 48px control with a visible keyboard focus ring.
- Production-browser behavior passed for timestamp restoration after reload, a 3.2-second frozen-tab interval without persisted-counter mutation, native unload protection, confirmed leave to Home and return to the still-running timer, Pause persistence with no countdown during a 2.2-second wait or reload, Fullscreen API enter/exit state, reduced motion with zero active animations, natural completion, completion announcement, and refresh idempotence with one 25-minute completed record. The browser console contained zero errors or warnings.
- Updating acceptance and verification evidence is documentation-only and cannot affect executable behavior, tests, builds, or browser results. Revalidation after this update is limited to `pnpm check`, `git diff --check`, the required-section audit, and confirmation that every checked item has evidence recorded above; the fresh test, build, and browser evidence remains applicable.
- `feature review` on 2026-07-15 found a blocking 200%-zoom-equivalent overlap at 640×400 with maximum-length Journey and Next step text: the absolutely positioned fullscreen control intersects both context text boxes (about 2,819 px² of Journey overlap and 1,208 px² of Next step overlap). The document still reports exact viewport bounds, so the earlier overflow-only check did not detect this element-level collision. Acceptance criterion 11 and its UI verification item remain open pending a responsive layout remediation and targeted browser recheck.
- The review remediation is a localized behavioral UI change limited to two short-viewport responsive classes: the fullscreen label collapses to its existing accessible icon control below 500px height, and the context text receives a centered maximum width that reserves a safe area around the control. Revalidation passed `pnpm check` (87 files), `git diff --check`, the focused focus-screen suite (18 tests), and the client and SSR production builds.
- Fresh headed production-browser revalidation passed the exact 640×400 maximum-content case with zero measured overlap, exact viewport/document bounds, and a visible keyboard focus treatment. At 1440×900 the labeled fullscreen control remained intact; at 320×568 the fullscreen and Pause controls remained fully visible with 44px and 48px heights; the browser console contained zero errors or warnings. Earlier full-suite, timer, persistence, completion, and interaction evidence was reused because the remediation changes only responsive presentation and cannot affect those behaviors. The remediation diff and complete feature diff have no remaining blocking findings.

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
