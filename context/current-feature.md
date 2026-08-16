# Current Feature: Compact Monthly Activity

<!-- One-sentence description of the feature or fix -->

Redesign the shared Monthly activity ledger around context-specific chronological disclosure so Home stays compact, keeps the newest work visible, and Journey Detail supports deeper review without a month-long default scroll.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- User-visible outcome of the feature -->

Users can see the selected month's exact result and a familiar chronological focused-work journal, with the latest active days visible by default and earlier history available on demand.

## Acceptance Criteria

<!-- Checklist of testable outcomes -->

- [x] On Home and Journey Detail, one flat, non-dashboard summary appears directly below the month controls and before the daily ledger: a clear `Month total` anchor pairs the selected month's exact Pomodoro value with its unit, while focused time appears as a smaller supporting line; the visible Active days metric is intentionally omitted, while disclosure status can still report exact active-day counts when history is hidden.
- [x] Active-day rows are ordered chronologically from oldest at the top to newest at the bottom; when today has countable focus in the current month, its correctly labeled row is the last visible row when the full month is shown.
- [x] The Today context label receives a restrained red marker and stronger text weight while ordinary weekday labels remain muted; the distinction is not color-only.
- [x] Home renders at most its 3 latest active days by default, while Journey Detail renders at most its 7 latest active days by default; a surface with no more than its default count shows every row and no disclosure control.
- [x] When a surface has hidden active days, concise status text reports the exact visible and total active-day counts, and a top-of-ledger caret control reveals the next batch of up to 7 earlier days without duplicates, gaps, or reordering until every active day is available.
- [x] The reveal control's accessible name states the exact number of earlier days it will add, and keyboard focus remains predictable after each activation.
- [x] Once any earlier rows are revealed, Home provides a quiet `Show latest 3 days` control and Journey Detail provides a quiet `Show latest 7 days` control; activating it restores that surface's compact latest-day window without changing the selected month.
- [x] When every active day is visible, the reveal-earlier control is removed but the surface-specific collapse control remains available until the user returns to the compact latest-day window; the compact default shows no redundant collapse control.
- [x] Changing the selected month resets Home to its latest 3 active days and Journey Detail to its latest 7 active days; disclosure state is transient and is not added to persisted app or Journey-view state.
- [x] Existing month behavior remains intact: current month is the default, future months cannot be opened, navigation crosses year boundaries, the current month follows local-month rollover unless the user explicitly selected history, and historical months never label a date as Today.
- [x] Existing daily and monthly values remain exact for all-Journey Home scope and Journey-specific Detail scope: qualifying timer and manual sessions combine by local date, partial Pomodoros remain proportional, and invalid, future, duplicated, orphaned, incomplete, or sub-five-minute sessions remain excluded.
- [x] Each visible day retains a semantic table row and row header, machine-readable date, full accessible date/minutes/Pomodoro summary, earned-only non-focusable tomato marks, partial fill, and the existing 24-mark dense-day cap with an exact overflow count.
- [x] The calm Journey-specific and all-Journey empty messages, Home's Continue-first section order, Journey Detail's persisted Progress/Monthly activity choice, and the read-only sample behavior remain unchanged.
- [x] The component uses normal page flow rather than a nested scrolling region, has no horizontal overflow or clipped content, and keeps every interactive target at least 44px at 320px, desktop, and a 200%-zoom-equivalent viewport.

## Plan

<!-- Implementation steps -->

1. Reorder the shared monthly activity data or presentation into canonical chronological active days while preserving all aggregation, filtering, and total calculations.
2. Move the exact two-value month summary ahead of the ledger in a flat hierarchy led by the Pomodoro total with smaller focused-time support, then add placement-owned initial visibility of 3 latest days on Home and 7 latest days on Journey Detail, with a top caret and seven-day reveal batches for earlier days plus reversible surface-specific collapse that reset safely on month changes without persistence.
3. Preserve the existing semantic table and tomato row treatment while adding accurate visible-count copy, reveal/collapse labels, and predictable keyboard focus behavior.
4. Update Home, Journey Detail, sample, data, component, and persistence tests for the compact state, successive batches, month resets, and unchanged cross-surface contracts.
5. Verify empty, current, historical, full 31-day, partial, dense-day, malformed-record, and responsive states in automated tests and a real browser.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused tests cover Home with 0, 1, 3, 4, 10, and 31 active days and Journey Detail with 0, 1, 7, 8, 15, and 31 active days, including repeated disclosure, partial and full expansion, collapse to each default, month resets, exact visible/total counts, reveal-control removal, and collapse-control visibility
- [x] Focused tests cover current/historical month behavior, exact Pomodoro/focused-time/active-day totals, singular/plural labels, and 5-, near-25-, 25-, 37.5-, and 50-minute boundaries
- [x] Regression tests cover same-day timer/manual aggregation, Journey scoping, malformed/duplicate/orphan/future exclusions, reload/import/delete recalculation, Journey-view persistence, and read-only sample isolation
- [x] Home and Journey Detail are verified in a real browser with empty, respective 3-day/7-day defaults, first hidden-day boundaries, repeated expand/collapse, full 31-day, partial-Pomodoro, dense-day-overflow, current-month, and historical-month states
- [x] Keyboard and accessibility checks verify heading/table relationships, row summaries, month announcements, exact reveal/collapse names, focus through expansion and collapse, decorative tomatoes, and 44px controls without relying on color alone
- [x] Browser layouts pass at 320px, desktop, and a 640×400 200%-zoom equivalent with normal page flow, reachable following content, no clipping, and no horizontal overflow
- [x] No relevant browser console errors or warnings

## Notes

<!-- Decisions, blockers, and scope changes -->

- UX decision: keep the exact tomato ledger, but put a single `Month total` anchor with a smaller focused-time line first, order active days chronologically from oldest at the top to newest at the bottom, show the latest 3 active days on Home and latest 7 active days on Journey Detail, and reveal earlier active days from a top-of-ledger caret in batches of 7. This keeps the traditional paper-journal reading direction while keeping Today visible and Home Continue-first without adding a dashboard-style Active days metric.
- Competitive research across Forest, Focus To-Do, TickTick, Daylio, Strava, Duolingo, and Opal supports summary-first hierarchy, bounded Home previews, and intentional access to older history. Several references use newest-first feeds, but the product decision here intentionally favors a traditional chronological journal. It adds one visual requirement—Pomodoros lead a flat summary while focused time supports beneath—and does not justify a calendar or analytics dashboard in this refinement. See `docs/monthly-activity-ui-inspiration.md`.
- Progressive disclosure is reversible: after expansion, the user can always restore the surface-specific compact default; revealing every day removes only the reveal-later action, not the collapse action.
- Product refinement on 2026-08-15: the user preferred a traditional pen-and-paper journal order over newest-first. The ledger now reads top-down from the earliest active day to the latest; Today appears at the bottom when the full month is expanded.
- Product refinement on 2026-08-15: the user then preferred the latest chronological window to remain visible without scrolling, so Home and Journey Detail show their latest active days by default, with a top caret labeled by the exact earlier-day count and a collapse action back to the latest window.
- Product refinement on 2026-08-15: the user preferred a minimal two-value summary, so the visible Active days metric was removed. The selected month's Pomodoro total remains primary, with focused time as a smaller right-aligned supporting line; disclosure status retains active-day counts when needed to explain hidden history.
- Product refinement on 2026-08-15: the combined Pomodoro total and unit now use one restrained bold treatment, while focused time remains the smaller muted line beneath; this keeps the primary value cohesive without making it feel oversized.
- Product refinement on 2026-08-15: the all-Journeys scope label now renders as `All Journeys` without the redundant `Scope ·` prefix, keeping the card header quieter.
- 2026-08-15 minimal-summary revalidation: the visible summary now uses one restrained bold `Pomodoros` line with focused time beneath, omits Active days, and renders concise scope copy. `pnpm check`, TypeScript, the focused three-file suite (80 tests), the full suite (40 files, 443 tests), `pnpm build`, and `git diff --check` passed. A live sample-Journey browser check at 1280px confirmed the new hierarchy, no Active days text, no horizontal overflow, and no captured warning/error logs; prior 320px and 640×400 evidence remains applicable because the summary became narrower and less dense.
- A seven-column calendar with selected-day details was considered, but it would compress dates, tomato progress, and interactive targets at 320px/200% zoom and hide exact daily effort behind another interaction. A fixed-height inner scroller was rejected because it creates nested scrolling and makes the full record harder to navigate.
- “Active day” means a selected-month local date with at least one already-countable focus session; inactive dates are not added as placeholder rows.
- This is a presentation and interaction redesign. Do not add a route, dependency, data-model field, persistence key, filter, session editor, new analytics, or changes to streak/freeze rules.
- Existing repository, import/export, deletion, local-date, Pomodoro math, all-Journey/Journey scope, month-navigation, and midnight-rollover contracts remain authoritative.
- No pending decision in `context/decisions.md` materially blocks this feature.
- TanStack Intent was listed during load; no available TanStack-specific skill matches this display-only feature definition.
- The unrelated untracked `context/screenshots/journey-detail-ui-v2.png` is outside this feature and must remain untouched.
- 2026-08-15 chronological-window revalidation: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (40 files, 443 tests), `pnpm build`, and `git diff --check` passed before this refinement. The focused three-file suite passed again after the latest-window change (80 tests), and the full suite still passes (40 files, 443 tests). A live browser pass verified the read-only sample, Home, and Journey Detail with latest 3/7 defaults, top caret placement, dynamic earlier-day counts (including 1, 2, and 6), earlier-day reveal, latest-window collapse, Today remaining at the bottom, 320px/640px layouts, 44px controls, no horizontal overflow, no nested scrolling, and no console errors or warnings. The remaining unchecked matrix is the exhaustive 31-day, partial-Pomodoro, and dense-day fixture coverage.
- 2026-08-15 month-summary refinement revalidation: the summary now has a labeled `Month total` anchor with Pomodoros attached as its unit, quieter focused-time and active-day support values, and a responsive weighted layout that keeps long durations readable. `pnpm check`, TypeScript, the focused three-file suite (80 tests), the full suite (40 files, 443 tests), `pnpm build`, and `git diff --check` passed; browser checks at 1280px and 320px confirmed the hierarchy, semantic summary label, 44px disclosure control, no horizontal overflow, and no console errors or warnings.
- 2026-08-15 Today-label refinement: current-day rows now use a small Pomodoro-red marker plus bold Ink text while other weekday context stays muted. Component coverage and the same desktop/mobile browser pass verify the marker remains decorative, the Today text remains semantic, and no overflow or console errors were introduced.
- Revalidation class: localized behavioral; the sort direction and disclosure copy changed the shared activity UI and its tests, so focused tests, the full suite, build, and responsive browser checks were rerun. Earlier unaffected persistence and data-contract evidence was retained where the implementation did not change.
- 2026-08-15 feature-test revalidation: with no implementation changes since the prior evidence, `pnpm test -- src/features/journeys/components/monthly-pomodoro-activity.test.tsx src/features/journeys/home-screen.test.tsx src/features/journeys/journey-detail-screen.test.tsx` completed the full repository suite (40 files, 443 tests), `pnpm check` passed (158 files), `pnpm build` passed for client, SSR, and 13 prerendered pages, and `git diff --check` passed. A live browser check of the sample Journey at 1280px verified the 7-of-9 latest-day default, top `Show 2 earlier days` control, chronological expansion to all 9 rows, `Show latest 7 days` collapse with focus returned to the reveal action, preserved `Total` header, no horizontal page overflow or monthly-section scrolling, and zero captured warning/error logs. Home's empty monthly state still renders the zero summary and unchanged empty message. The exhaustive active-day fixture and browser matrix remain unchecked.
- 2026-08-15 focused-test revalidation: `pnpm exec vitest run src/features/journeys/components/monthly-pomodoro-activity.test.tsx src/features/journeys/home-screen.test.tsx src/features/journeys/journey-detail-screen.test.tsx` passed 3 files and 80 tests. Vitest emitted only the repository's existing jsdom `Window's scrollTo()` notices.
- 2026-08-15 boundary-fixture revalidation: added data-driven Home coverage for 0, 1, 3, 4, 10, and 31 active days and Journey Detail coverage for 0, 1, 7, 8, 15, and 31 active days. The focused three-file suite passed 3 files and 92 tests; the full suite passed 40 files and 455 tests. `pnpm check`, TypeScript, `pnpm build`, and `git diff --check` also passed. The browser matrix was exercised against the read-only sample for current-month, 7-day default, earlier-day expansion, collapse, chronological Today placement, summary hierarchy, overflow, and console output; the remaining synthetic 31-day/partial/dense Home fixture was prepared but not imported because the browser import flow requires replacing saved data with an irreversible confirmation, so no saved browser data was changed.
- 2026-08-15 feature-test revalidation: this pass was documentation-only (`context/current-feature.md` evidence maintenance), so runtime and browser behavior evidence remains applicable. Reran `pnpm check`, `pnpm exec tsc --noEmit`, the focused three-file suite (92 tests), `pnpm test` (40 files, 455 tests), `pnpm build` (client, SSR, and 13 prerendered pages), and `git diff --check`; all passed. The complete synthetic browser matrix remains the only unchecked verification item.
- 2026-08-15 feature review: implementation and existing evidence satisfy the documented behavior without a code-level blocker or scope expansion. The exhaustive active-day/default-window fixture is now covered; readiness remains blocked only by the complete browser state matrix.
- 2026-08-15 feature-review revalidation: reviewed the complete tracked diff and the untracked research, documentation, and screenshot artifacts; `pnpm check` passed with no warnings. All 13 acceptance criteria remain satisfied by the shared ledger implementation and focused/full test evidence. No code-level finding or scope expansion was found; status remains `In Progress` solely because the complete synthetic browser state matrix is still unchecked.
- 2026-08-15 P1 browser-matrix verification: imported a temporary canonical AppState fixture into the previously empty browser profile, then verified Home and Journey Detail against an empty current month and a historical 31-day month. Home showed its latest 3 rows and Journey Detail its latest 7, each reported the exact hidden count and `Show 7 earlier days`, four successive expansions exposed all 31 rows, and the surface-specific latest-window collapse restored the compact view. The full historical ledger visibly included a 37.5-minute partial day and the dense day’s `+8 more` overflow while retaining chronological order and no `Today` label for July. At 1280px, document and section scroll widths matched and disclosure/month controls measured 44px high; browser warning/error logs were empty. The temporary Journey was deleted afterward and the browser profile returned to zero saved Journeys; the fixture file was removed from the worktree.
- 2026-08-15 P1 follow-up: the previously missing browser evidence is now complete. Status remains `In Progress` until the feature review lifecycle is rerun against this new evidence.
- 2026-08-16 final feature review: all 13 acceptance criteria and every verification item are checked. The focused/full test, type-check, build, static-check, diff-check, and completed P1 browser-matrix evidence were reviewed; no code-level findings, regressions, accessibility issues, scope expansion, or unapproved changes were found. The feature is ready to commit.

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

### 2026-08-13 — Fix Stale Timer Tab Title After Completion

- Branch: `codex/fix/fix-stale-timer-tab-title-after-completion`
- Summary: Restored the default browser title after focus completion and navigation, including delayed 50-minute sessions that cross the 10-pomodoro milestone, with root-level title ownership and regression coverage for persisted completion state.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (36 files, 407 tests), `pnpm build`, `git diff --check`, and Chromium production-preview checks for `00:33` background catch-up, 50-minute credit, milestone routing, default titles, and zero console errors or warnings passed.

### 2026-08-13 — Journey Target Editing and Presets

- Branch: `codex/feature/journey-target-editing-and-presets`
- Summary: Added Journey-scoped focus-target editing with shared onboarding presets, a distinct 1,000-Pomodoro default, and exact 10,000-hour support while preserving focused history.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (37 files, 421 tests), `pnpm build` (client, SSR, and 13 prerendered pages), `git diff --check`, and browser checks for persistence, validation, accessibility, 44px targets, long names, 320px, desktop, and 640×400 200%-equivalent layouts passed.

### 2026-08-13 — Monthly Pomodoro Activity Views

- Branch: `codex/feature/monthly-pomodoro-activity-views`
- Summary: Added an oldest-first monthly activity ledger to Journey Detail and Home with Journey-scoped/all-Journey totals, month navigation, earned-only tomato marks, focused-duration totals, one-decimal Pomodoro display, and per-Journey persisted view selection.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (40 files, 439 tests), `pnpm build` (client, SSR, and 13 prerendered pages), `git diff --check`, focused persistence/data/component tests, targeted Journey/manual-entry/streak regressions (8 files, 209 tests), and browser checks at 320px, desktop, and 640×400 zoom-equivalent sizes for current/historical/empty/partial/dense states, keyboard controls, no overflow, and no console errors passed.
