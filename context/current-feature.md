# Current Feature: Paused Focus Timer

Turn a paused focus session into a clear, recoverable decision point for resuming, finishing early, or cancelling.

## Status

Ready to Commit

## Goal

When a user pauses a focus session, they can see exactly where they stopped and confidently resume it, finish with eligible focused progress, or cancel it without ambiguity.

## Acceptance Criteria

- [x] A persisted paused session renders a distraction-free paused timer that follows `context/screenshots/timer-paused-ui.png`: brand mark, Journey and Next step context, a clearly labelled paused state, frozen remaining time, elapsed-progress ring, and actions ordered as Resume, Finish early, then Cancel session.
- [x] Resume atomically restores the session and active timer to `running`, starts from the persisted remaining and accumulated focused time, excludes paused wall-clock time, and continues to work after reload or a return to the focus route.
- [x] Finish early is available once at least five focused minutes have accumulated, completes the session exactly once using only its actual focused time, clears the active timer, and opens the existing session-completion experience.
- [x] Before five focused minutes have accumulated, the paused UI clearly explains that the session cannot count yet and does not award Journey progress through Finish early.
- [x] Cancel session requires confirmation that explains that focused progress will be discarded; confirming marks the session cancelled exactly once, clears the active timer, awards no progress, and returns the user to focus setup, while dismissing leaves the paused session unchanged.
- [x] Failed Resume, Finish early, or Cancel persistence leaves the recoverable paused state on screen, prevents false navigation or duplicate mutations, and presents an accessible error message.
- [x] The paused-state actions and status changes are keyboard and screen-reader accessible, use visible focus states and adequate touch targets, and announce meaningful state changes without announcing every countdown second.
- [x] The paused timer remains usable without clipping or horizontal overflow from 320px mobile through desktop, at 200% zoom, and with maximum-length Journey and Next step content.

## Plan

1. Add focused-time helpers and atomic repository operations for resuming, finishing early, and cancelling a paused session while preserving idempotence and the five-minute counting rule.
2. Replace the paused-state placeholder with the reference-aligned responsive timer, progress treatment, action hierarchy, eligibility guidance, confirmation flow, and accessible feedback states.
3. Connect successful actions to the running timer, existing completion route, or focus setup as appropriate, without changing the completed running-session path.
4. Add focused unit and component coverage for timing calculations, persistence success and failure, reload restoration, threshold behavior, confirmation dismissal, duplicate actions, navigation, and accessible labels or announcements.
5. Verify the paused flow in a real browser across responsive, zoom, maximum-content, persistence, and error-free interaction cases.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] Reload restoration, Resume, eligible and ineligible Finish early, and confirmed or dismissed Cancel session flows verified
- [x] 320px layout, 200% zoom, and maximum-length Journey and Next step content verified without clipping or overflow
- [x] Keyboard navigation, accessible names, focus behavior, status announcements, and touch targets verified
- [x] Persistence-failure and repeated-action behavior verified without false navigation, progress, or duplicate mutation
- [x] No relevant console errors

## Notes

- Source reference: `context/screenshots/timer-paused-ui.png`.
- Confirmed product rules applied: a session must reach five focused minutes to count; eligible partial sessions contribute actual focused time; the timer remains visible during focus; overtime is out of scope because it is off by default and its safety cap is unresolved.
- The paused timer extends the existing `/focus` active-session screen and reuses the existing `/focus/complete` destination rather than introducing a new route.
- Cancelled sessions award no Journey progress. The cancelled record is retained for honest session state and duplicate-action protection; session-history presentation is outside this feature.
- Cancel uses the browser's native confirmation because confirming immediately replaces the entire paused view; the prompt states the discarded-progress consequence and avoids leaving an unmounting in-app dialog in the action path.
- Break timers, overtime controls, reflections, next-step completion, completion-screen redesign, and broader session-history UI are out of scope.
- No pending decision in `context/decisions.md` blocks this feature. The unresolved overtime cap is excluded, and the older product-spec suggestion to time-limit Cancel is not a confirmed requirement and conflicts with the supplied paused-state reference.
- Initial verification passed on Node 22.22.0: `pnpm check` (87 files, no warnings), `pnpm test` (11 files, 89 tests), `pnpm build` (client and SSR), and `git diff --check`.
- Headed production-browser verification passed at 1280×800, 320×568, and a 320×200 CSS viewport representing 640×400 at 200% reflow. The paused view restored after reload; Resume preserved 375 accumulated seconds and excluded paused wall time; eligible Finish early recorded 6.25 focused minutes and opened `/focus/complete`; the 299-second boundary disabled Finish early with guidance; and dismissed or confirmed cancellation respectively preserved or cancelled the session with no progress.
- Browser accessibility and resilience checks passed: semantic button names and paused status were exposed, Tab order was Resume → Finish early → Cancel session, the focused control had a visible ring, all action targets were 44–48px high, 80-character Journey and 120-character Next step strings caused no horizontal overflow, all controls remained reachable at the zoom-equivalent viewport, and the clean production session reported zero console errors or warnings.
- Testing found the short-mobile brand mark overlapping maximum-length Journey text. This was a localized behavioral remediation limited to hiding the low-priority brand mark at heights up to 640px. Revalidation passed `pnpm check`, `git diff --check`, the focused timer/repository/component suite (3 files, 50 tests), `pnpm build`, and affected clean-browser desktop, mobile, maximum-content, and zoom-equivalent checks. The earlier full `pnpm test` evidence remains applicable because the remediation changed only responsive brand visibility and cannot affect timer, persistence, or routing behavior.
- The final verification-record update is documentation-only; `pnpm check` and `git diff --check` were rerun afterward, while all executable, build, and browser evidence above remains applicable because documentation cannot affect it.
- Feature review found one blocking accessibility gap in confirmed cancellation: the repository update synchronously replaces the paused view before `setAnnouncement('Focus session cancelled. No progress was added.')` can render, so the only live region disappears without exposing the cancellation result and keyboard focus falls back to the document body. Responsive review otherwise passed at 1440x900, 768x900, and 375x667 with no horizontal overflow, clipped actions, or console warnings. This review-record update is documentation-only; prior executable evidence remains applicable, with `pnpm check` and `git diff --check` rerun afterward.
- The cancellation finding was fixed as a localized behavioral remediation: `FocusSessionScreen` now carries the successful cancellation result across the paused-view replacement, and focus setup exposes that result in its own polite live region while moving focus to the setup heading. Revalidation passed `pnpm check`, the full `pnpm test` suite (11 files, 89 tests) including new announcement and focus assertions, `pnpm build` (client and SSR), `git diff --check`, and the confirmed-cancellation flow in a headed production browser at 375x667 with the heading focused, the cancellation status exposed, no horizontal overflow, and zero console warnings or errors. Earlier responsive and feature-flow evidence remains applicable because the remediation only changes the successful cancellation handoff.

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
