# Current Feature: Manage and Reorder Next Steps

Let users reorder Upcoming steps, choose what is current, and complete or delete steps they no longer need.

## Status

Ready to Commit

## Goal

People can shape a lightweight, flexible queue of work, act on what feels right now, and leave a Journey with no unfinished Next steps when everything is done.

## Acceptance Criteria

- [x] Every Upcoming step on a persisted Journey has a dedicated drag handle and one compact, keyboard-accessible More actions control with `Work on this next`, `Mark complete`, `Move up`/`Move down`, and `Delete` actions as applicable; the read-only sample Journey exposes none of these controls.
- [x] Users can drag Upcoming steps into a new order with mouse or touch. The lifted row tracks the pointer, neighboring rows glide into the valid drop position, and the dropped row settles fluidly into place without obscuring step titles or the Journey's primary Start action. A successful drop does not add a persistent visible `Moved … to position …` message; concise assistive-technology confirmation remains available.
- [x] On a focused drag handle, Space or Enter picks up/drops, Arrow Up/Down moves, and Escape cancels; focus stays on that handle, boundaries are announced without moving, and announcements name the step plus its position and list size. `Move up`/`Move down` provide a non-drag fallback and are unavailable at their respective boundaries.
- [x] Every successful active-queue mutation normalizes that Journey's current step to position `0` and its Upcoming steps to contiguous positions `1…n`; reloading preserves the order, and completing the current step later promotes the first user-ordered Upcoming step.
- [x] Cancelling a drag, dropping outside the valid list, issuing an invalid/cross-Journey reorder, or encountering a persistence failure leaves the original order unchanged and provides recoverable feedback when appropriate.
- [x] Choosing `Work on this next` atomically promotes that Upcoming step to the Journey's sole current Next step and places the former current step first in Upcoming, followed by the remaining steps in their prior relative order; neither step is marked complete.
- [x] After promotion, the Journey detail current-step card and Start action, Home recommendations, and later focus defaults resolve to the newly current step through the existing persisted state.
- [x] Promotion requires no confirmation, prevents duplicate submissions, and reports a clear recoverable error if persistence fails while leaving the original current and Upcoming steps unchanged.
- [x] Choosing `Mark complete` on an Upcoming step immediately records it as completed and removes it from the Upcoming list without changing the Journey's current step or promoting another step.
- [x] A step referenced by the running or paused Focus session cannot be marked complete; selecting the action opens an accessible blocking message that explains the session must be finished or cancelled first and preserves all state.
- [x] Completing the current step continues to promote the first ordered Upcoming step; if none remains, the Journey has no current step and shows the valid no-unfinished-steps state.
- [x] Completion rejects missing, already-completed, current-when-using-the-Upcoming-action, or cross-Journey IDs as no-ops, prevents duplicate submissions, and reports a recoverable persistence failure without changing the saved step or list order.
- [x] Choosing `Delete` for an unused Upcoming step opens a controlled confirmation dialog that names the step, states that deletion cannot be undone, and provides distinct Cancel and `Delete step` actions; no deletion occurs before confirmation.
- [x] Confirming deletion removes only the selected Upcoming step from persisted state; the Journey, its current/completed/other Upcoming steps, focus-session progress and history, milestones, goals, onboarding data, timers, and other Journeys remain unchanged.
- [x] An Upcoming step referenced by any Focus session cannot be deleted, preserving its title throughout history; selecting Delete opens an accessible non-destructive message that directs the user to `Mark complete` instead and, for active work, to finish or cancel the session first.
- [x] Delete rejects current, completed, missing, or cross-Journey step IDs as no-ops, prevents duplicate submissions, and reports a clear recoverable error on persistence failure without dismissing the confirmation or changing saved state.
- [x] When no current or Upcoming steps remain, the Journey is still valid: Journey detail and Home show a calm empty state with `Add a Next step`, Start Focus is unavailable until a step is added, and no placeholder step is created automatically.
- [x] Reordering keeps focus on the moved handle; promotion moves focus to the current-step Start action; completion/deletion moves focus to the next row's More actions trigger, the previous row when last, or `Add Next step` when none remains. Assistive technology receives concise confirmation of each change.
- [x] The ordering and row actions remain understandable and operable with long valid step titles at 320px mobile, desktop, keyboard-only navigation, touch input, and a 200%-zoom-equivalent viewport; ghost-style controls stay visually subordinate and never cover the title.

## Plan

1. Add focused repository operations and unit tests for normalized active-queue ordering, promotion, completion, and history-safe deletion, including ownership, status, session-reference, persistence-failure, subscriber-notification, and unrelated-state boundaries.
2. Add a restrained sortable-row treatment to the existing Upcoming list with an accessible drag handle, clear movement feedback, keyboard drag behavior, and Move up/down fallbacks.
3. Add a compact per-row More actions menu using the established button, menu, dialog, and destructive-action patterns where available.
4. Connect `Work on this next` and `Mark complete` with in-flight protection, active-session blocking, recoverable feedback, deterministic focus management, and accessible announcements while preserving existing current-step completion behavior.
5. Add a controlled named delete confirmation plus a non-destructive session-history blocking state, retry-safe failure behavior, deterministic focus restoration, and an accessible success announcement.
6. Add the no-unfinished-steps state to Journey detail and verify existing Home and focus entry points guide the user to add a new step instead of treating the Journey as broken.
7. Extend Journey detail and cross-surface tests to prove ordering persistence, ordered promotion, current-step propagation, completion, deletion, progress/history preservation, and read-only sample behavior.
8. Verify the complete flow in a real browser across desktop, narrow mobile, mouse, touch, keyboard navigation, long content, and a 200%-zoom-equivalent viewport.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Repository tests cover active-queue normalization, ordered promotion, completion, history-safe deletion, invalid targets, active-session protection, write failure, notifications, and unrelated-state preservation
- [x] Journey detail tests cover drag/drop and keyboard reordering, Move up/down boundaries, menu semantics, completion, delete confirmation/cancellation, success, retryable failure, focus handoff, announcements, duplicate-action protection, empty state, and read-only sample behavior
- [x] Reordering is verified to survive reload and control which step is promoted after current-step completion
- [x] Promotion is verified to update Journey detail, Home, and focus-selection defaults from persisted state
- [x] Completing every unfinished step is verified to preserve the Journey and earned progress while disabling focus entry until a new step is added
- [x] Desktop, 320px mobile, and a 200%-zoom-equivalent viewport are verified with maximum-length Next step content and no clipping or horizontal overflow
- [x] Mouse, touch, and keyboard ordering plus keyboard-only menu/dialog operation, visible focus, touch targets, accessible names, destructive copy, and movement/success/error announcements are verified
- [x] No relevant browser console errors or warnings

## Notes

- UX decision: the dedicated current-step card stays fixed. Only Upcoming rows are sortable; choosing `Work on this next` is the explicit way to move an Upcoming step into the current slot.
- Each Upcoming row uses a drag handle so scrolling, selecting text, and opening its More actions menu do not accidentally begin a drag. Move up/down actions provide an equivalent fallback for touch and assistive-technology users.
- `Work on this next` and eligible `Mark complete` actions are immediate, deliberate status changes. Eligible `Delete` removes the record and therefore requires confirmation.
- Active queue invariant: current is position `0`; Upcoming is contiguous `1…n`. Given current A and Upcoming B/C/D, choosing C produces current C and Upcoming A/B/D. Completed/skipped records do not participate in active ordering.
- Marking an Upcoming step complete does not affect the current step. Marking the current step complete retains the existing behavior of promoting the first ordered Upcoming step.
- Zero unfinished Next steps is a supported state, not an error. The user keeps the Journey and all earned progress and can add another step whenever they are ready.
- Delete is available only for Upcoming steps with no Focus-session references. Worked-on steps retain their record and title and can be marked complete instead; active work must be finished or cancelled before completion.
- Session-reference blockers open a visible, keyboard/touch-accessible message rather than relying on a disabled menu item or tooltip.
- The confirmed product decision that each Journey has an ordered list with its current step at the top supports this feature. Completed steps leave the active queue; adding a completed-step history remains excluded, so the pending decision about where completed steps appear does not block this scope.
- Scope is limited to ordering, promoting, completing, and deleting from Journey detail. Editing step text, deleting the current/completed step, skipping, scheduling, due dates, a completed-step history, undo, and broader task-manager features are excluded.
- No drag-and-drop dependency is currently installed. Implementation should use the existing stack where practical; adding a dependency requires separate approval under repository rules.
- The active contract was refined after pre-implementation UX review to resolve queue ordering, session-history preservation, active-session protection, controlled retry behavior, and deterministic keyboard/focus handoff.
- Feature test baseline on 2026-08-08 passed `pnpm check`, `pnpm test` (27 files, 277 tests), `pnpm build` (client, SSR, and 12 prerendered routes), and `git diff --check`.
- Coverage review found evidence gaps rather than runtime defects. Test-only, proven non-semantic remediation added 11 tests for real cross-Journey no-ops, operation-specific write failures, unrelated-state preservation, duplicate-action protection, live announcements, last-row focus, and keyboard-only delete cancellation. Focused repository tests passed 58/58 and Journey detail tests passed 35/35.
- Keyboard-only browser testing exposed one localized behavioral defect: Escape closed the delete confirmation but lost focus to the page body. The dialog now retains its return target independently of closing state; the regression test, rebuilt production preview, and real keyboard menu → dialog → Escape flow confirm focus returns to the originating More actions button. Earlier unaffected responsive and drag evidence was reused; all source gates and the full suite were rerun after the fix.
- Final verification on 2026-08-08 passed `pnpm check` (128 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 288 tests), `pnpm build` (client, SSR, and 12 prerendered routes), and `git diff --check`. Vitest emitted existing jsdom `window.scrollTo` and empty test-router `href` notices, but no tests failed or were skipped.
- Production-browser verification passed at 1280×800, 320×800, and 640×400: mouse and keyboard ordering persisted across reload, touch-style pointer ordering passed automated coverage, the lifted row and displaced neighbors animated fluidly, drag-edge auto-scroll stayed within the list above the fixed dock, and the 120-character title had no horizontal overflow. Promotion propagated to Journey detail, Home, and focus defaults; completion/deletion focus and announcements worked; delete confirmation and blockers were accessible; the fully completed queue showed calm Journey-detail and Home add-step states with no Start action or generated placeholder. Browser console errors/warnings: 0/0.
- Feature review on 2026-08-08 found blocking gaps and made no source changes: zero-current/nonempty-Upcoming saved queues are not normalized by reorder, Upcoming completion, or deletion; keyboard blur and lost pointer capture can leave a drag latched; blocker dialogs and inactive-Journey promotion can lose focus; successful drops can repeat the prior movement string without a new live-region mutation; outcome feedback is duplicated across two live regions; and the 15px `Delete step` label measures approximately 4.38:1 against its tinted background, below WCAG AA. Repository coverage also lacks direct active-Upcoming deletion and historical-session completion cases. A suspected short-viewport dock overlap was disproved by measured browser geometry: the scroll viewport clips before the dock, focused rows scroll fully into view, and the dragged row cannot obscure the Start action.
- Remediation must keep repository and UI normalization aligned: if a reorder repairs a queue with no current step by promoting the first requested item, the UI must recognize the resulting current-plus-Upcoming order as success, synchronize to the saved Upcoming IDs, and choose an existing focus target. Add focused regressions for every review finding, use one live announcement channel per outcome, and use the approved Paper-on-Pomodoro-Red pairing for the destructive confirmation action.
- Review remediation on 2026-08-08 now normalizes zero-current and duplicate-current active queues across reorder, Upcoming completion, and deletion; recognizes and synchronizes the saved semantic queue in the UI; cancels keyboard drags on Tab/blur and pointer drags on lost capture; preserves dialog return targets; falls back from an unavailable Start link to the current step's `Mark complete` action; distinguishes movement from committed drops; and uses one announcement source per outcome. The destructive confirmation now uses Paper on Pomodoro Red with an Ink hover state.
- Remediation coverage adds zero-current first/last/only boundaries, same-order repairs, historical and active-session reference cases, Tab/blur and lost-capture termination, active and inactive promotion focus, blocker return focus, normalized-drop focus/announcements, repeated error announcements, and repeated identical successful-drop announcements. A post-fix static re-review found no remaining repository or interaction issue.
- Post-remediation verification passed `pnpm check` (128 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 310 tests), `pnpm build` (client, SSR, and 12 prerendered routes), and `git diff --check`. Vitest emitted only the existing jsdom `window.scrollTo` notices.
- Production-browser remediation checks passed at 1280px, 320×800, and 640×400: a real mouse drag displaced neighbors, settled cleanly, persisted, and restored handle focus; Tab and lost pointer capture cancelled without saving; malformed zero-current data repaired to one current step; inactive promotion focused `Mark complete`; blocker and delete dialogs returned focus to their originating More trigger; the long title stayed contained with 44px row controls; short-viewport edge scrolling clamped the list above the fixed action dock; Paper on Pomodoro Red measured approximately 5.05:1 at 15px; and browser console errors/warnings were 0/0. An independent UI review also found no remaining issue.
- Repeat feature testing after review remediation was classified broad/high-risk because it changed persistence invariants plus cross-cutting drag and focus behavior. The full baseline passed `pnpm check` (128 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 310 tests), `pnpm build` (client, SSR, and 12 prerendered routes), and `git diff --check`; Vitest emitted only the existing jsdom `window.scrollTo` notices.
- Fresh production-browser testing passed at desktop, 320×800, and 640×400 with maximum-length content: real mouse dragging displaced neighbors, settled, persisted across reload, restored handle focus, and showed no persistent movement text; Space and Enter drops plus Escape and Tab cancellation behaved correctly; promotion, completion, deletion, confirmation cancellation, active/history blockers, empty-queue recovery, and deterministic focus/announcements all passed. Long titles remained contained, row controls measured 44×44, short-viewport content stayed above the fixed action dock, and browser console errors/warnings were 0/0.
- During this test action, the repository history-preservation test gained one direct assertion that the completed step record survives an unrelated Upcoming deletion. This was classified as a proven non-semantic test-only change, so the unaffected build and browser evidence was reused; focused repository tests (72/72), `pnpm check`, `pnpm exec tsc --noEmit`, and `git diff --check` were rerun afterward and passed.
- Final feature review on 2026-08-08 found two blocking gaps and made no source changes. `completeCurrentNextStep` and the current-step card still allow a step referenced by a running or paused Focus session to be completed, leaving active work attached to a completed record. Pointer dragging also publishes a newly keyed assertive live-region message on every qualifying pointer move, even when the projected position is unchanged, rather than limiting announcements to actual position changes. The feature remains `In Progress`; add repository/UI regressions for active current-step completion and repeated same-position pointer moves before repeating `feature test` and `feature review`.
- The final review inspected the complete tracked and feature-relevant untracked diff and found no dependency, route, build, generated-file, or unrelated-refactor expansion. `pnpm check` passed for 128 files; independent browser review reconfirmed layout, 44px controls, keyboard reordering, menu/dialog focus, empty-state behavior, and 0/0 console errors/warnings from 320px through desktop. Those unaffected results remain valid, while the three announcement/active-session verification items above are reopened.
- The 2026-08-09 review remediation is classified broad/high-risk because it changes a persisted current-step completion invariant together with focus and live-region behavior. `completeCurrentNextStep` now leaves storage and subscribers unchanged when the exact current step belongs to a running or paused Focus session, while completed/cancelled historical references remain completable. Journey detail opens the existing-style named blocker before persistence and returns focus to `Mark complete`; pointer movement announcements now publish only when the projected position changes, without altering distinct drop confirmation.
- Focused remediation coverage passed 76/76 repository tests and 45/45 Journey Detail tests. Full revalidation passed `pnpm check` (128 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 316 tests), `pnpm build` (client, SSR, and 12 prerendered routes), and `git diff --check`. The first build attempt ran concurrently with the full suite and its temporary prerender server timed out; the immediate standalone build completed successfully, confirming transient local contention rather than an application failure. Vitest emitted only the existing jsdom `window.scrollTo` notices.
- Fresh production-browser remediation checks passed at desktop and 320×800. Paused and running current-step sessions opened the named non-destructive blocker, preserved the exact saved state, and returned focus to `Mark complete` on Escape; a completed historical reference remained completable and promoted the first ordered Upcoming step. Real mouse movement caused zero live-region mutations before a midpoint crossing, exactly one when the projected position changed, no repeats within that position, and a distinct saved-drop announcement; the reordered queue persisted and focus returned to its handle. The 320px dialog stayed fully within the viewport with no horizontal overflow, and browser console errors/warnings were 0/0.
- Final remediation review on 2026-08-09 independently rechecked repository invariants, UI accessibility, focus and announcement behavior, acceptance-to-evidence mapping, and the complete feature scope. No blocking findings remained, so the feature advanced to `Ready to Commit`.

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

### 2026-08-01 — Milestone Reached

- Branch: `codex/feature/milestone-reached`
- Summary: Added an earned-only milestone record built from persisted progress, with a responsive completed PomodoroGrid section, next-milestone guidance, non-celebratory fallback states, and a direct return to the related Journey.
- Verification: `pnpm check` (107 files), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 162 tests), focused remediation tests (2 files, 12 tests), `pnpm build` (client and SSR), `git diff --check`, and live-browser checks from 320px through desktop plus a 200%-zoom equivalent for earned, missing, unearned, and recoverable-error states, persisted values, grid and navigation behavior, maximum-content overflow, accessibility, contrast, reduced motion, and console output passed.

### 2026-08-05 — Simple Minimal App Redesign

- Branch: `codex/feature/simple-minimal-app-redesign`
- Summary: Simplified every implemented user-facing screen around one clear action, concise product language, a quieter Ink/Paper/Pomodoro Red system, and shared tomato-shaped Pomodoro progress units with left-to-right partial fill.
- Verification: `pnpm check` (108 files), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 169 tests), focused recovery and confirmation tests (2 files, 4 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks across all ten routes at 320×568, 375×812, 1280×800, and a 640×400 200%-zoom equivalent for complete flows, tomato states, persistence recovery, accessibility, contrast, reduced motion, responsive behavior, and console output passed.

### 2026-08-05 — Optional Sample Journey

- Branch: `codex/feature/optional-sample-journey`
- Summary: Starts new users with empty persisted data and adds a non-persisted, read-only Learn guitar sample Journey with brand-only navigation and explicit landing-page access.
- Verification: `pnpm check`, `pnpm test` (21 files, 173 tests), `pnpm build` (client and SSR), `git diff --check`, and browser checks for empty landing, sample exploration/reload/non-persistence, sample return navigation, full real-Journey onboarding creation, normal Journey navigation, responsive layouts, and no console errors or warnings passed.

### 2026-08-05 — Remove onboarding tomato previews

- Branch: `codex/feature/remove-onboarding-tomato-previews`
- Summary: Removed the static tomato progress previews from all four onboarding screens and recentered the setup forms while preserving intentional progress visuals in the sample Journey and other product screens.
- Verification: `pnpm check`, `pnpm test` (21 files, 173 tests), `pnpm build`, `git diff --check`, and browser checks at 1280×800 and 320×568 for the complete onboarding flow, zero onboarding tomato previews, no horizontal overflow or console errors, and preserved sample Journey tomato units passed.

### 2026-08-06 — Add New Journey

- Branch: `codex/feature/add-new-journey`
- Summary: Added an Add Journey action to Home that starts a fresh, reusable onboarding flow for additional Journeys while preserving existing Journeys and records.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (21 files, 176 tests), `pnpm build` (client and SSR), `git diff --check`, and browser checks at 1280×800, 640×400, and 320×568 with no overflow or console errors/warnings passed.

### 2026-08-06 — GitHub Pages Preview Deployment

- Branch: `codex/feature/github-pages-preview-deployment`
- Summary: Added an automated GitHub Pages preview workflow with static TanStack Start prerendering, project-path-aware assets and routing, client-side fallback handling, and repository setup instructions.
- Verification: `pnpm check`, `pnpm test` (21 files, 176 tests), `pnpm build`, project-path artifact inspection, workflow YAML parsing, `git diff --check`, and Pages-path browser checks at 1280×800 and 320×568 with client navigation and no console errors passed.

### 2026-08-06 — Import and export saved progress

- Branch: `codex/feature/import-export-saved-progress`
- Summary: Added versioned Settings backups for exporting and restoring saved Journeys and progress, plus an immediate top-right import path for Journey-free landing pages without an export action or replacement warning.
- Verification: `pnpm check` (115 files), `pnpm test` (22 files, 184 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and real-browser checks at desktop and 320×568 for landing import, Settings confirmation, responsive fit, restored navigation, and console output passed.

### 2026-08-06 — Add missed pomodoro entries

- Branch: `codex/feature/add-missed-pomodoro-entries`
- Summary: Added accessible manual missed-session recording from tomato details with date, Next step, focused minutes, persisted manual labels, same-date contributors, and 25-minute tomato progress allocation.
- Verification: `pnpm check`, `pnpm test` (23 files, 189 tests), `pnpm build` (SSR and prerendering), `git diff --check`, and desktop/320×568 browser checks for validation, persistence, multi-tomato progress, focus return, responsive layering, and browser console output passed.

### 2026-08-06 — Keep Session Complete heading words intact

- Branch: `codex/fix/session-complete-heading-wrap`
- Summary: Prevented the Session Complete heading from splitting the final “s” of “pomodoros” onto a separate line at narrow widths.
- Verification: `pnpm check`, `pnpm test` (23 files, 189 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and browser checks at 320×568 and 1280×800 with no document overflow or console errors/warnings passed.

### 2026-08-07 — Redesign Landing Page

- Branch: `codex/feature/redesign-landing-page`
- Summary: Redesigned the public landing page into a visually stunning, high-contrast, product-first experience with dynamic product previews, 3-step explanation section, and clear onboarding CTAs.
- Verification: `pnpm check`, `pnpm test` (23 files, 189 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, keyboard accessibility, WCAG AA contrast, reduced motion, 320px–1200px+ responsive layouts, and 200% zoom checks passed.

### 2026-08-07 — Realistic Loading Skeletons

- Branch: `codex/feature/realistic-loading-skeletons`
- Summary: Replaced generic loading fallback blocks with realistic, layout-matched skeleton components across Home, Journey Detail, Milestone Detail, Focus Setup, Session Complete, Onboarding, Settings, and Landing Page.
- Verification: `pnpm check`, `pnpm test` (24 files, 200 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and visual skeleton layout alignment checks passed.

### 2026-08-07 — Delete Journey from Settings

- Branch: `codex/feature/delete-journey-from-settings`
- Summary: Added safe, permanent Journey deletion from Settings with confirmation dialogs, cascade cleanup of owned records, pointer and goal repair, accessible status feedback, and empty state support.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` (11 pages prerendered), `git diff --check`, 39 repository tests, and 9 Settings interaction tests passed.

### 2026-08-07 — Explicit Journey Deletion Guard in Settings

- Branch: `codex/feature/explicit-journey-deletion-guard`
- Summary: Moved the Manage Journeys section below Saved Data in Settings and added a DeleteJourneyDialog requiring the user to type the exact Journey name before enabling permanent deletion.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` (11 pages prerendered), and `git diff --check` passed.

### 2026-08-08 — Diagnose and Fix Settings Test Hang

- Branch: `codex/fix/diagnose-and-fix-settings-test-hang`
- Summary: Fixed the Settings test harness document root so the suite completes reliably, and kept Journey deletion recoverable with accessible feedback when persistence fails.
- Verification: `pnpm check` (118 files), `pnpm test` (24 files, 215 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, focused Settings tests (11 tests), and live browser checks at 1280×800 and 320×568 passed with zero console errors or warnings.

### 2026-08-08 — Consistent Focused Duration Formatting

- Branch: `codex/feature/consistent-focused-duration-formatting`
- Summary: Standardized focused-time displays across the app with natural singular and plural units, floored seconds, omitted zero-valued segments, and compact hour-aware formatting.
- Verification: `pnpm check` (120 files), `pnpm test` (25 files, 231 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and browser checks at 320×568 and 1280×800 for seconds-only, exact-hour, hour-plus-seconds, multi-hour, responsive overflow, and console output passed.

### 2026-08-08 — Browse All Journeys

- Branch: `codex/feature/browse-all-journeys`
- Summary: Kept Home focused on two recent active Journeys and added a dedicated collection for every saved Journey with status-safe actions, clear navigation, empty recovery, and accessible summaries.
- Verification: `pnpm check` (125 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 249 tests), focused remediation tests (2 files, 15 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and production-browser checks for complete collection states, keyboard access, responsive layouts, overflow, current navigation, safe inactive actions, accessible descriptions, and console output passed.
