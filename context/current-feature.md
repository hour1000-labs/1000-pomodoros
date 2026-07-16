# Current Feature: Session Complete

Add a refresh-safe completion screen that credits a finished focus session, makes its progress visible, and offers clear next actions.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

After finishing eligible focused work, the user immediately sees exactly what was earned and can review the updated Journey, continue focusing, or optionally save a short reflection without receiving duplicate credit.

## Acceptance Criteria

- [x] `/focus/complete` resolves a completed session from a validated session ID search parameter or the persisted latest-completed-session fallback, and redirects safely to `/home` when no valid completed session, Journey, or Next step can be resolved.
- [x] The completed session and any milestone crossed by it are finalized and awarded exactly once before credited totals render; refreshing or revisiting the completion URL cannot duplicate focused minutes, sessions, totals, or milestone awards.
- [x] Completion uses the session's actual focused minutes, preserves fractional pomodoro progress as `focusedMinutes / 25`, and renders grammatically correct singular or plural earned-credit copy from real session and Journey data.
- [x] Earned credit appears before optional input and includes the Journey, Next step, session duration, updated Journey total, current milestone progress, and the relevant milestone-scoped section of the `PomodoroGrid` with every newly earned full or partial block visually and accessibly identified.
- [x] Newly earned blocks use one nonessential 200–400ms fill or scale animation, the animation is disabled when reduced motion is requested, and the screen contains no confetti, coins, XP, fireworks, or looping celebration.
- [x] An optional reflection control is collapsed initially, accepts at most 280 characters, and saves the submitted reflection to the resolved completed session without changing its credited duration or duplicating completion side effects.
- [x] The single primary action is `View progress` and routes to `/journeys/$journeyId`, except when this session crossed a milestone, when it becomes `View milestone` and routes to `/milestones/$milestoneId`.
- [x] A secondary `Start another pomodoro` action returns to `/focus` with the same Journey and Next step selected.
- [x] The completion experience is keyboard and screen-reader accessible, has visible focus states and 44px minimum touch targets, and remains readable without horizontal scrolling from 320px through desktop, at 200% zoom, and with maximum-length supported content.

## Plan

1. Define the completion-state derivation needed to resolve the completed session and related Journey, Next step, totals, milestone progress, newly earned blocks, and milestone crossing from persisted data.
2. Extend the repository and progress logic only where necessary so completion, milestone awards, and reflection updates are atomic, idempotent, and preserve actual focused minutes and fractional pomodoro progress.
3. Validate the `/focus/complete` search parameter, recover the persisted latest completed session when needed, and add safe redirect and recoverable persistence behavior.
4. Build the feature-owned completion screen from the supplied visual reference using existing shared buttons, progress primitives, and the milestone-scoped `PomodoroGrid`, with earned credit and real session details ahead of optional input.
5. Add the collapsed, 280-character reflection flow and the contextual Journey, milestone, and restart navigation while preserving the same Journey and Next step selection.
6. Add the short newly-earned-block animation with a reduced-motion path, responsive styling, accessible labels and focus behavior, and no out-of-scope celebration effects.
7. Add focused repository, progress, route, and UI tests for resolution, invalid state, idempotence, partial and multi-pomodoro credit, pluralization, reflection persistence, milestone crossing, navigation, accessibility, and reduced motion.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused automated tests cover session lookup and fallback, missing data, exact-once finalization, refresh safety, fractional and multi-pomodoro credit, reflection limits and persistence, milestone crossing, action routing, and reduced motion
- [x] Browser verification covers natural timer completion and eligible Finish early, direct refresh, missing or invalid session recovery, partial and multi-pomodoro sessions, milestone and non-milestone outcomes, reflection save, and both next actions
- [x] Affected UI is verified at 320px mobile, desktop, 200% zoom, and with maximum-length Journey and Next step content without clipping or horizontal scrolling
- [x] Keyboard navigation, screen-reader names and status messaging, visible focus, touch targets, animation timing, and `prefers-reduced-motion` behavior are verified
- [x] No relevant console errors

## Notes

- Source: `context/features/session-complete-spec.md` and `context/screenshots/session-complete-ui.png`.
- Confirmed product rules apply: one pomodoro is 25 focused minutes, eligible partial sessions preserve actual minutes after the five-minute minimum, and progress totals are derived from completed sessions where practical.
- The supplied screenshot is a visual reference, not authority to add behavior absent from the spec. In particular, this feature displays the selected Next step but does not automatically mark it complete.
- The pending general decisions about full-Journey grouping and final block treatment do not block this feature: it is limited to the existing milestone-scoped `PomodoroGrid` and its established complete, partial, latest, milestone, and future states. A broader grid redesign remains out of scope.
- Persistence remains in the existing SSR-safe client repository. Authentication, a database, manual time entry, session editing, ratings, Next step management, and milestone sharing are out of scope.
- The untracked `context/screenshots/milestone-ui-v2.png` is an unrelated existing user file and is not part of this feature.
- Implementation uses the validated `sessionId` search parameter for natural and early completion navigation while retaining `lastCompletedSessionId` as the refresh/direct-entry fallback.
- Session completion now awards every newly crossed persisted milestone in the same idempotent repository write. The highest milestone crossed by the resolved session controls the contextual primary action.
- Newly earned grid highlights now retain the resolved session's original block positions by deriving the focused total immediately after that session, independent of any work completed later.
- Reflection persistence is a separate completed-session-only repository update capped at 280 characters; it cannot change duration, completion state, totals, or milestone awards.
- Start-action implementation checks passed: `pnpm check` (88 files), focused Vitest coverage (4 files, 58 tests), `pnpm build` (client and SSR), and `git diff --check`. Formal full-suite, browser, and review gates remain pending for `feature test` and `feature review`.
- A standalone `pnpm exec tsc --noEmit` probe reported two pre-existing nullability errors in unchanged assertions at `src/lib/repository.test.ts:256` and `src/lib/repository.test.ts:312`; the repository's required build gate passes, so this is recorded as nonblocking follow-up rather than feature scope.
- Feature-test baseline passed: `pnpm check` (88 files), `pnpm test` (12 files, 99 tests), `pnpm build` (client and SSR), and `git diff --check`.
- Production-browser verification used past-due persisted timer timestamps and paused accumulated-focus state to exercise the real natural-completion and Finish-early handlers without waiting in real time. A 25-minute completion was saved once and stayed unchanged after refresh; eligible Finish early credited 6.25 minutes; a 50-minute result identified every affected full and partial block; and a crossed milestone was awarded in the same write without duplication on refresh.
- Browser checks also confirmed validated-session lookup, latest-completed fallback, `/home` recovery when no completion context exists, singular and plural earned-credit copy, non-milestone and milestone outcomes, working milestone and restart navigation, and a collapsed reflection that accepts and persists exactly 280 characters without changing session credit.
- Responsive and accessibility checks passed with maximum-length 80-character Journey and 120-character Next step content at 320×568 mobile, 1280×800 desktop, and a 640×400 200%-zoom equivalent. All tested document and body scroll widths matched the viewport, primary controls measured 48px high on mobile, semantic snapshots exposed the heading, details, figure labels, progress status, and live completion status, and keyboard focus produced a visible 3px focus ring.
- The newly earned blocks compute a 0.3s `enter` animation with normal motion and `animation-name: none` when an emulated `prefers-reduced-motion: reduce` preference is active. The production browser reported zero console errors and zero warnings.
- The only post-verification repository change in this test action is this evidence documentation. It is classified as documentation-only, so earlier unit, build, and browser evidence is reused; the universal `pnpm check` and `git diff --check` gates were rerun after the update.
- Review found a blocking historical-session attribution issue in `resolveSessionCompletion`: the selected session's `previousFocusedMinutes` is compared with the Journey's current all-session total. After later sessions exist, revisiting an older completion can therefore highlight blocks earned later and treat a milestone earned by a later session as crossed by the older one, changing its primary action incorrectly. The resolver must derive the focused total immediately after the selected session for milestone crossing and highlighted-block bounds, with focused regression coverage.
- Review also found a blocking grid-window boundary issue: choosing `gridStartIndex` from the latest filled block can move the rendered window to the next 100-block section when a session straddles that boundary, leaving an earlier newly affected block outside the grid. The visible window must contain every index attributed to the completed session, with a regression case around the 100-block boundary.
- The complete feature diff otherwise maps to the documented acceptance criteria, adds no dependency or unrelated refactor, and keeps the unrelated untracked `context/screenshots/milestone-ui-v2.png` outside feature scope. Review-time `pnpm check` (88 files) and `git diff --check` passed.
- This review evidence update is documentation-only. Earlier unit, build, and browser evidence remains applicable to unchanged executable files; `pnpm check` and `git diff --check` were rerun after this update.
- Review remediation is classified as localized behavioral: it changes only completion-context derivation and the visible `PomodoroGrid` window for two known attribution boundaries, without changing persistence, routing, styling, dependencies, or unrelated feature behavior.
- The historical-session fix derives milestone crossing and highlighted-block bounds from sessions completed through the selected session, so later work can no longer change that session's milestone action or claimed blocks. The boundary fix chooses a grid window guaranteed to contain the complete highlighted range, including a 50-minute session spanning blocks 100 and 101.
- Remediation revalidation passed `pnpm check` (88 files), `git diff --check`, the focused Session Complete suite (1 file, 9 tests), `pnpm build` (client and SSR), and targeted production-browser checks for both review scenarios with zero console errors or warnings.
- Earlier full-suite, natural-timer, Finish-early, reflection, general responsive, accessibility, and reduced-motion evidence is reused because this bounded resolver/window change cannot affect those previously verified paths. The two reopened acceptance criteria remain unchecked until the required remediation review confirms the complete feature diff.
- This evidence update is documentation-only; the universal `pnpm check` and `git diff --check` gates were rerun after it.
- Formal remediation testing confirmed the localized-behavior classification. Current reruns passed `pnpm check` (88 files), `git diff --check`, the focused Session Complete suite (1 file, 9 tests), and `pnpm build` (client and SSR).
- The latest-source production-browser evidence remains applicable: the historical-session scenario showed only its own newly earned block with `View progress`, while the 99-to-101 boundary scenario rendered both blocks 100 and 101 as newly earned; both checks had zero console errors or warnings. Only documentation changed after those observations.
- The earlier full `pnpm test` baseline and unaffected natural-completion, Finish-early, reflection, responsive, accessibility, and reduced-motion evidence are reused under the localized-behavior policy. The affected resolver, grid-window, action-routing, and highlighted-block behavior was rerun directly in the focused suite and browser.
- This formal test evidence update is documentation-only; `pnpm check` and `git diff --check` were rerun after it.
- Formal remediation review found no remaining blockers. The localized-behavior classification is valid: the source change is confined to selected-session attribution and grid-window derivation, with focused automated and production-browser evidence covering both affected boundaries.
- The complete feature diff maps to every acceptance criterion, adds no dependency or unrelated refactor, and continues to exclude the unrelated untracked `context/screenshots/milestone-ui-v2.png`. Review-time `pnpm check` (88 files) and `git diff --check` passed; the focused remediation, build, browser, full-suite, responsive, accessibility, and reduced-motion evidence recorded above remains applicable under the documented revalidation policy.

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
