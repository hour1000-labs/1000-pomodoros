# Current Feature: Consistent Focused Duration Formatting

Display recorded and calculated focused durations in a consistent, readable format that omits unnecessary zero-valued units.

## Status

Ready to Commit

## Goal

Users can read every focused-duration value without decimals, inconsistent abbreviations, or unnecessary zero-valued units.

## Acceptance Criteria

- [x] Every dynamic UI value that represents recorded, accumulated, target, contributed, or remaining focused time uses one shared duration-formatting contract across Home, Journey detail, recent sessions, Pomodoro details, Session Complete, milestone detail, Settings, and saved-data import messaging.
- [x] Durations of at least one hour always show hours. Nonzero remainder minutes are shown with seconds omitted; when remainder minutes are zero, minutes are omitted and nonzero remainder seconds may be shown. For example, `60` minutes renders as `1 hour`, `60 minutes 3 seconds` as `1 hour 3 seconds`, and `201.9` minutes as `3 hours 21 minutes`.
- [x] Durations under one hour omit a zero-minute segment when seconds are nonzero, omit zero seconds, and preserve `0 minutes` as the exact-zero fallback. For example, `1 / 60` minute renders as `1 second`, `18.05` minutes as `18 minutes 3 seconds`, and `25` minutes as `25 minutes`.
- [x] Each displayed unit uses its singular label only for a value of exactly `1` and its plural label otherwise, including zero.
- [x] Fractional source minutes are converted by flooring the total elapsed seconds after neutralizing sub-nanosecond floating-point representation error, so formatting does not otherwise round focused time upward.
- [x] Existing countdown clocks, duration-selection controls, form labels and validation copy, static explanatory copy, Pomodoro counts, dates, percentages, and persisted focused-minute values remain unchanged.
- [x] Focused-duration formatting has automated coverage for the exact-zero fallback, seconds-only values, omitted zero seconds, singular and plural units, fractional minutes, the boundary immediately below one hour, exact hours, hour-plus-seconds values, multi-hour values with remainder minutes, and multi-hour values whose seconds must not be shown.

## Plan

1. Inventory dynamic focused-duration displays and distinguish them from countdowns, inputs, static copy, and other numeric values that remain outside this change.
2. Replace the existing Journey-specific helper with a shared focused-duration formatter that floors total seconds, derives the required units, and pluralizes each displayed unit.
3. Adopt the shared formatter in every in-scope aggregate, session, contribution, completion, milestone, Settings, and import display while preserving the surrounding wording and layout.
4. Add focused unit tests for the formatting contract and update affected component assertions for the standardized text.
5. Run the required quality, test, build, and browser checks, including compact mobile layouts where the longer unabbreviated durations could wrap.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] No relevant console errors
- [x] Focused formatter tests cover all documented unit, flooring, and one-hour boundary cases
- [x] Browser checks confirm representative seconds-only, hour-plus-seconds, and multi-hour durations on affected screens
- [x] Long in-scope duration text remains readable without clipping or horizontal overflow at 320px and desktop widths
- [x] `git diff --check` passes

## Notes

- Loaded from the inline request on 2026-08-08; no implementation, branch creation, or implementation verification was performed during `feature load`.
- “All the focused minutes” means dynamic values describing focused time or focused progress, including individual session durations, aggregate totals, milestone targets and remaining time, and Pomodoro contribution details.
- For values below one hour, zero minutes are omitted when nonzero seconds remain, while an exact zero remains `0 minutes`. At one hour or above, hours are always shown. Nonzero remainder minutes are shown without seconds; zero remainder minutes are omitted, allowing nonzero seconds to follow the hour directly.
- Unit labels use natural English plurality: only exactly `1` is singular; zero and values greater than one are plural.
- Existing UI wording, information hierarchy, stored minute precision, calculations, and persistence schema are not changed by this presentation-only feature.
- Countdown timers retain their existing clock format because they communicate live remaining time rather than a prose focused-duration value. Duration choices, manual-entry fields, and static statements such as “1 Pomodoro is 25 focused minutes” also remain outside scope.
- The pending product decisions do not materially affect this formatting-only feature.
- The worktree already contained unrelated changes to `src/features/settings/settings-screen.tsx` and an untracked `.playwright-cli/` directory when this feature was loaded; preserve them and do not treat them as feature work.
- Started implementation on `codex/feature/consistent-focused-duration-formatting` on 2026-08-08. Added the shared formatter under `src/lib`, retained the prior Journey helper as a compatibility re-export, and adopted the shared contract across the documented UI surfaces.
- The landing foundation's hard-coded focused-time number is an in-scope metric display rather than explanatory prose, so it now uses the shared formatter; static instructional sentences and timer/setup copy remain unchanged.
- The initial `pnpm check` found one unused formatter and two formatting differences; those were corrected before testing. The initial full suite then found eight assertions for the previous duration copy; the assertions were updated, and the subsequent full suite passed with 25 files and 226 tests.
- A 320×568 browser check found the Home Today duration wrapping to five lines under the generic 36px statistic style. This localized UI remediation relabeled the metric from “Focused minutes” to “Focused time” and reduced only that value to readable, normal-wrapping type. Revalidation passed `pnpm check`, the 10-test Home suite, `pnpm build`, and `git diff --check`; browser measurements at 320×568 and 1280×800 showed no horizontal overflow, the mobile value wrapping to two lines, and no console errors or warnings.
- The start-phase browser inspection confirmed the prior zero-seconds wording before the user's later refinement; that sub-hour evidence was invalidated when zero seconds were removed from the contract. The multi-hour `17 hours 55 minutes`, `25 hours 0 minutes`, layout, overflow, and console evidence was unaffected.
- Scope update on 2026-08-08: at the user's request, a zero-valued seconds segment is now omitted. `1 second` is singular and every higher displayed seconds value is plural. This is a localized behavioral remediation affecting the shared formatter and rendered duration copy; baseline, targeted, build, diff, and browser evidence must be rerun before review.
- The updated formatter and component assertions passed focused verification across 4 test files and 41 tests. Fresh browser checks exercised Home, Journey detail, recent sessions, Pomodoro contribution details, Session Complete, milestone progress, Settings, saved-data import preview, and the running countdown at 320×568 and 1280×800. They confirmed `25 minutes`, `0 minutes 1 second`, `5 minutes 2 seconds`, `18 minutes 3 seconds`, and `3 hours 21 minutes`, preserved `MM:SS` countdown output, no clipping or horizontal overflow, and no relevant console errors or warnings.
- The browser export check created `.playwright-cli/1000-pomodoros-backup-2026-08-08.json`, whose missing final newline caused the first post-remediation `pnpm check` attempt to fail. That exact test-generated artifact was removed without changing the pre-existing `.playwright-cli/` contents, after which the full baseline passed: `pnpm check` (120 files), `pnpm test` (25 files, 226 tests), `pnpm build` (client, SSR, and 11 prerendered pages), and `git diff --check`.
- The final feature-record update was documentation-only, so the full test, build, and browser evidence remained valid; the required cheap gates were rerun afterward and passed with `pnpm check` (120 files) and `git diff --check`.
- Scope update during review on 2026-08-08: zero-minute segments are also omitted except for the exact-zero fallback. Exact hours omit `0 minutes`; when an hour value has zero remainder minutes but nonzero remainder seconds, those seconds follow the hour. This is a localized behavioral remediation to the shared formatter and its visible output, invalidating formatter, affected component, build, and representative browser evidence until rerun.
- The first check after the review refinement found only a Biome line-wrap difference in the new seconds-only branch. The formatter source was adjusted to the required layout before behavioral verification continued.
- The first refined browser fixture exposed a floating-point boundary in a Pomodoro contribution: the mathematical one-second remainder from `25 - (24 + 59 / 60)` reached the formatter as `0.9999999999999432` seconds and displayed the exact-zero fallback. A sub-nanosecond conversion tolerance and regression case were added so arithmetic representation error does not erase a whole elapsed second; this remains within the localized formatter remediation.
- Final revalidation for the review refinement passed `pnpm check` (120 files), focused formatter and component tests (4 files, 43 tests), the complete `pnpm test` suite (25 files, 231 tests), `pnpm build` (client, SSR, and 11 prerendered pages), and `git diff --check`. Browser checks at 320×568 confirmed `1 second` in a real Pomodoro contribution, `1 hour 3 seconds` and `3 hours 21 minutes` in recent sessions, and `1 hour` for an exact-hour milestone; the exact-hour milestone also passed at 1280×800. Document and body widths matched both viewports with no horizontal overflow and no console errors or warnings. Earlier cross-screen evidence for formats whose output branches did not change was reused.
- Review classified the final formatter refinement as localized behavioral: it changes only shared presentation output at zero-minute and arithmetic one-second boundaries, with no persistence, routing, calculation, or dependency changes. The targeted tests, full suite, production build, representative browser boundaries, `pnpm check`, and `git diff --check` were rerun; only unaffected earlier cross-screen UI evidence was reused.
- Review also observed untracked `public/logo.png` and the pre-existing `.playwright-cli/` directory as unrelated workspace artifacts. They remain outside feature scope and must not be staged with this feature; browser files generated by this review were removed individually.
- Final review found no blocking bugs, regressions, accessibility issues, missing error handling, dependency changes, or unapproved feature scope. Every intended code change maps to the shared formatting, coverage, or narrow responsive-readability criteria; the unrelated Settings layout relocation and workspace artifacts remain explicitly excluded from the feature.
- Advancing the evidence-backed status to `Ready to Commit` changed documentation only. The complete test, build, and browser evidence remained applicable, and the final `pnpm check` (120 files) and `git diff --check` gates passed afterward.

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
