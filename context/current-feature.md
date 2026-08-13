# Current Feature: Fix Stale Timer Tab Title After Completion

Ensure a completed focus session cannot leave the browser tab showing a frozen countdown after the app has saved progress and moved to completion or milestone views.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- User-visible outcome of the feature -->

After a focus session ends, including a backgrounded 50-minute session that reaches a milestone, the user's progress is credited once and the browser tab reliably returns to `1000 Pomodoros` instead of remaining stuck on an old countdown.

## Acceptance Criteria

<!-- Checklist of testable outcomes -->

- [x] While a running or paused session is active on `/focus`, the browser tab title continues to match the timestamp-derived visible timer in the exact `MM:SS — 1000 Pomodoros` format.
- [x] When a 50-minute running session last observed at `00:33` catches up past its target time, successful natural completion occurs exactly once, credits exactly 50 focused minutes, clears that session's active timer, records it as the last completed session, and navigates to `/focus/complete` with its `sessionId`.
- [x] If that 50-minute completion crosses a Journey's 250-minute / 10-pomodoro boundary, the existing 10-pomodoro milestone is awarded exactly once in the same persisted completion and Session Complete shows `2 pomodoros complete.` with the correct `View milestone` destination.
- [x] Every non-active-Focus route deterministically owns the default `1000 Pomodoros` title, so successful natural completion, Finish early, confirmed navigation away, Session Complete, View milestone, and later Journey navigation cannot retain a stale countdown even if Focus effect cleanup is delayed.
- [x] A failed completion save remains recoverable on `/focus`: it does not navigate, clear the active timer, award a milestone, or play the completion sound, and it keeps the existing error guidance.
- [x] Existing pause/resume behavior, visibility catch-up, navigation protection, mute state, completion sound rules, and completion idempotence remain unchanged.

## Plan

<!-- Implementation steps -->

1. Add a router-level regression fixture with prior progress below 250 minutes, an unearned 10-pomodoro milestone, and a running 50-minute session initially showing `00:33`; advance time past expiry through visibility catch-up and assert the complete persisted and routed outcome.
2. Move default document-title ownership to a route-aware level that remains mounted across sibling route transitions, while keeping the running and paused Focus states responsible for the live countdown only.
3. Reset the title synchronously at successful completion/leave boundaries before programmatic navigation, retaining cleanup as a fallback and removing any ineffective route-local title repair made redundant by the durable owner.
4. Preserve the repository's existing atomic completion and milestone-award logic; add only the integration assertions needed to prove full 50-minute credit, one award, one navigation, and no false side effects on persistence failure.
5. Extend route tests through Session Complete and `View milestone` to prove both destinations show the default title after starting from a nonzero countdown, and retain focused coverage for pause/resume, confirmed navigation, sound, and idempotence.
6. Reproduce the boundary in Chromium with a production-style base path by backgrounding a `00:33` timer past expiry, returning to the tab, and confirming the completion, milestone link, default title, persisted progress, and absence of relevant console errors.
7. Run the full quality gates and review the complete diff against every acceptance criterion before advancing the feature status.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused timer, repository, Session Complete, and Milestone regression tests pass
- [x] Chromium verifies `00:33` background/visibility catch-up through 50-minute completion and the 10-pomodoro milestone
- [x] Chromium verifies `1000 Pomodoros` on Session Complete, Milestone Detail, and subsequent non-Focus navigation
- [x] No relevant browser console errors or warnings occur during the completion flow

## Notes

<!-- Decisions, blockers, and scope changes -->

- Investigation diagnosis: this was a stale browser-title failure, not a stuck or lost focus session. The current live UI shows the reported 50-minute session in recent activity, 11.7 total pomodoros / 4h53m, Pomodoro 10 marked as a milestone, a normal start action, and the default `1000 Pomodoros` title.
- The exact browser scheduling trigger cannot be reproduced after the fact. The strongest explanation is a background-throttling/title-cleanup race: `00:33` was the last rendered countdown, completion later saved and navigated, and the destination had no title owner to repair a delayed or missed Focus cleanup.
- The 10-pomodoro milestone is correlated, not causal. Completion, milestone awarding, active-timer clearing, and last-completed pointer repair occur in one synchronous repository state write; milestone rendering and navigation do not write `document.title`.
- The concrete ownership gap is that running and paused Focus components imperatively set the countdown and reset it only during effect cleanup. The existing route-aware fallback also lives inside the departing `/focus` screen, while sibling Session Complete, Milestone Detail, and Journey routes do not reassert the default title.
- Existing tests cover title synchronization, visibility catch-up, an already-expired timer, 50-minute setup, 50-minute completion display, and milestone awarding separately. They do not cover a nonzero `00:33` title crossing expiry, awarding the 250-minute milestone, navigating twice, and remaining repaired end to end.
- A stale second tab is a secondary unproven possibility because repository subscriptions are in-memory and there is no cross-tab storage-event reconciliation. Only one app tab is currently open, so cross-tab synchronization is excluded unless the bug is reproduced with multiple app tabs.
- No pending decision in `context/decisions.md` changes this fix. This scope does not change timer arithmetic, persisted schemas, milestone calculations, audio design, completion copy/layout, or other UI.
- `feature load` is documentation-only: no branch or application-code change is part of this action, and all acceptance and verification checkboxes remain unchecked until current implementation evidence exists.
- Implementation: `DocumentTitleManager` now owns the default title from the root shell for every route except active `/focus`, while running and paused Focus states retain countdown-title ownership and cleanup. Successful natural completion, Finish early, and cancellation reset the title synchronously before navigation or leave callbacks.
- Regression coverage: the Focus suite now drives a timestamp-derived `00:33` countdown through a delayed 50-minute completion, asserts one repository completion, full credit, active-timer clearing, last-completed identity, one 250-minute milestone award, Session Complete copy/link, and default title after milestone navigation. Milestone Detail also has a direct stale-title recovery test.
- Verification evidence: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (36 files / 407 tests), `pnpm build`, and `git diff --check` all passed. The first sandboxed build attempt could not bind TanStack's prerender preview server (`listen EPERM ::1`); the same build passed with approved elevated local binding.
- Chromium production-preview check: observed `00:33 — 1000 Pomodoros`, switched to a second tab past expiry, returned to `/focus/complete`, and confirmed title `1000 Pomodoros`, `2 pomodoros complete.`, `50 minutes`, the earned milestone link, persisted `activeTimer: null`, `lastCompletedSessionId`, `focusedMinutes: 50`, and one earned 250-minute milestone. Milestone Detail and Journey routes retained the default title; console reported 0 errors and 0 warnings. The browser fixture was disposable and the preview/browser sessions were closed afterward.

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

### 2026-08-09 — Manage and Reorder Next Steps

- Branch: `codex/feature/manage-and-reorder-next-steps`
- Summary: Added flexible Upcoming-step management with fluid mouse, touch, and keyboard reordering; explicit current-step promotion; completion and history-safe deletion; active-session blockers; deterministic focus and announcements; and a valid empty-queue state.
- Verification: `pnpm check` (128 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 316 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and production-browser checks at desktop, 320×800, and 640×400 for ordering, persistence, focus, announcements, dialogs, maximum-length content, responsive overflow, and console output passed.

### 2026-08-09 — Timer Tab Countdown and Completion Sound

- Branch: `codex/feature/timer-tab-countdown-and-completion-sound`
- Summary: Added timestamp-synced `/focus` tab countdown titles, accessible running and paused mute controls, and a brief guarded Web Audio completion chime for successful natural timer completion.
- Verification: `pnpm check`, `pnpm test` (28 files, 323 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and browser checks for title lifecycle, responsive layouts, keyboard focus, 44-by-44 control sizing, muted and unmuted completion paths, and zero browser console errors/warnings passed. Real Chromium created one audio context for unmuted completion and none for same-visit muted completion; the user accepted this browser audio-graph evidence as sufficient.

### 2026-08-09 — Product Logo and Search Identity

- Branch: `codex/feature/product-logo-and-search-identity`
- Summary: Added the supplied tomato logo across shared wordmarks, browser/install assets, manifest, social metadata, crawl directives, and the public landing-page identity while removing scaffold placeholders.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (30 files, 328 tests), focused logo/site tests (2 files, 5 tests), default and Pages-base `pnpm build`, `git diff --check`, asset alpha-bound and dimensions audits, Pages-style fixture HTTP 200 checks, desktop/mobile browser checks with no overflow or console errors, and post-publication Pages smoke verification passed.
- Post-publication smoke verification: the live landing URL, `robots.txt`, `sitemap.xml`, manifest, favicon, brand mark, and social image returned HTTP 200; published HTML contained the new title, description, canonical, indexable robots metadata, manifest, logo, and landing headline.

### 2026-08-10 — Edit Journey and Next Step Names

- Branch: `codex/feature/edit-journey-and-next-step-names`
- Summary: Added persisted Journey, current Next step, and upcoming Next step renaming with accessible overflow-menu actions, validation, recoverable saves, and state-driven updates across Journey and Focus surfaces.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (30 files, 335 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and desktop/320×568 browser checks for rename flows, persistence, Home/Journeys/Focus updates, unchanged progress/order/timer state, read-only `/sample`, and zero console errors or warnings passed.

### 2026-08-11 — Remember Journey Session Duration

- Branch: `codex/feature/remember-journey-session-duration`
- Summary: Restored each Journey's last successfully started timer duration, including 25-minute and 50-minute presets or exact Custom values, while preserving Journey-specific choices, Next-step changes, validation, and active-session behavior.
- Verification: `pnpm check`, focused focus-session tests (41 tests), full `pnpm test` (30 files, 347 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and desktop/320×568 browser checks with no relevant console errors or horizontal overflow passed.

### 2026-08-11 — Daily Streaks and Streak Freezes

- Branch: `codex/feature/daily-streaks-and-streak-freezes`
- Summary: Added a global 5-minute daily focus streak across persisted Journeys with automatic weekly freezes, deterministic manual-history reconciliation, restrained Home and completion feedback, and an accessible responsive monthly calendar.
- Verification: `pnpm check` (146 files), `pnpm exec tsc --noEmit`, `pnpm test` (35 files, 401 tests), `pnpm build` (client, SSR, and 13 prerendered pages), `git diff --check`, persistence/import/deletion/sample-isolation tests, and real-browser checks for keyboard and pointer navigation, completion and manual feedback, reduced motion, WCAG contrast, 320px/desktop/200%-zoom layouts, full/empty/protected/broken/10,000-day histories, and zero console warnings or errors passed.

### 2026-08-13 — Manual Activity Entry for Missed Sessions

- Branch: `codex/feature/manual-activity-entry-for-missed-sessions`
- Summary: Replaced the missed-session Next-step picker with a required plain activity field, persisted activity on manual sessions without mutating Next steps, and surfaced the activity across Journey and Home history while preserving legacy labels.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (36 files, 405 tests), `pnpm build` (client, SSR, and 13 prerendered pages), `git diff --check`, and real-browser checks for all validation and persistence boundaries, responsive layouts, keyboard traversal, accessibility semantics, focus restoration, and zero browser errors passed.
