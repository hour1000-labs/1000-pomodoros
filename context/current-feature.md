# Current Feature: Daily Streaks and Streak Freezes

<!-- One-sentence description of the feature or fix -->

Add a global daily focus streak, automatically earned and used streak freezes, and an accessible monthly consistency calendar.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- User-visible outcome of the feature -->

Help people return to meaningful focus each day by making consistency visible while forgiving occasional missed days without shame.

## Acceptance Criteria

<!-- Checklist of testable outcomes -->

- [x] A local calendar date becomes a qualifying streak day when it contains at least one completed timer or manual Focus session of at least 5 focused minutes on any persisted Journey; exactly 5 minutes counts, while shorter, running, paused, cancelled, invalid, and read-only sample sessions do not.
- [x] Multiple qualifying sessions on the same local date count as one streak day, and timed sessions use their completion date while manual sessions use the date selected by the user.
- [x] The current streak starts at 1 on the first qualifying day and advances once per later qualifying day in the same protected sequence; an unfinished current day neither breaks the streak nor consumes a freeze before local midnight.
- [x] A freeze-protected date preserves the current streak and reward progress but does not increment either one; current and longest streak totals therefore represent days with qualifying focus, not missed days.
- [x] The user earns exactly 1 streak freeze on every 7th qualifying day of an unbroken or freeze-protected streak, including days 7, 14, and 21, and a protected date cannot itself earn a freeze.
- [x] After a missed local date closes, an available freeze is used automatically on the earliest missed date and deducted from inventory; consecutive missed dates use one freeze each until inventory is exhausted, the first unprotected miss resets the streak, and later blank dates consume nothing until focus starts a new streak.
- [x] Streak replay never awards a freeze twice, never produces a negative inventory, and deterministically recalculates the current streak, longest streak, rewards, freeze uses, and inventory when historical sessions are added, removed through existing Journey deletion, imported, or restored.
- [x] Existing eligible session history is included when the feature first loads, while the non-persisted `/sample` Journey never changes personal streak data or freeze inventory.
- [x] Home keeps Continue as the dominant action and preserves the existing Today/This week two-card row; below the Today stats, one compact icon-led streak area shows the current count, available freezes, and today's or latest protection state, and the entire area is a single semantic link to `/streaks` with a clear accessible name, visible focus, and at least a 44px target.
- [x] When a timer completion is the first qualifying session of a local date, Session Complete adds one quiet status line between the focused-time summary and Next step, clearly stating the updated streak and any newly earned freeze or personal best without adding another card, action, or competing celebration; later sessions that day do not increment or replay it, and reduced-motion preferences are honored.
- [x] After a manual missed session saves, the existing `Manual session saved` confirmation includes a concise, accessible streak-impact row that says whether the date newly counted, restored or changed streak history or inventory, or was already covered; it does not add a toast, redirect, or Session Complete detour.
- [x] A dedicated `/streaks` monthly view is reached from the Home streak area rather than added to primary navigation, provides a clear return to Home, opens on the current month, and lets the user move through historical months without navigating into a future month.
- [x] The streak page opens with one expressive but restrained hero: a large current streak number paired with a compact original code-native flame mark, plus quiet text for the personal best, freezes available, and qualifying 5-minute rule; it includes neither an oversized reward illustration, social tabs, sharing, currencies, nor another primary action.
- [x] Progress toward the next freeze appears as concise supporting feedback such as `2 focus days to next freeze`; it never implies that a protected date advances reward progress.
- [x] Each selected month shows its month and year, previous and next controls, and exactly two month-scoped totals in one divided summary row rather than separate dashboard cards: unique `Days practiced` and `Freezes used`; the totals update with month navigation and use plain labels rather than unexplained icons.
- [x] Within each calendar week, adjacent qualifying and freeze-protected dates form a continuous flat Pomodoro Red streak band with rounded visible ends, so a protected sequence reads as connected effort rather than unrelated dots; unprotected missed dates break the band.
- [x] A practiced date and a freeze-protected date remain visibly different inside the connected band: practiced dates use the completed treatment, while a freeze segment uses an Ink/Paper snowflake or pattern treatment and an explicit label without introducing blue, yellow, gradients, or another brand color.
- [x] A qualifying manual session uses the same practiced-day band treatment as a timer session, while its accessible detail remains honest about the contributed focused time; backfilling it recomputes the affected band and monthly totals without a visual penalty.
- [x] Today has a distinct non-color cue, incomplete today is not shown as missed, inactive and future dates remain quiet, and band ends at week or month boundaries do not falsely communicate a broken streak.
- [x] Every calendar date exposes an unambiguous text or assistive label for its date and state; qualifying dates also expose focused time, freeze dates state that 1 freeze was used, and inactive, today, and future dates remain distinguishable without guilt-heavy language.
- [x] The calendar and streak marks use only the existing Ink, Paper, Pomodoro Red, and their approved opacity variants; they reuse the references' hierarchy and connected-calendar idea without copying Duolingo artwork, gradients, typography, dark-only styling, or branded flame and freeze assets.
- [x] Empty, new-streak, protected, broken, long-history, month-boundary, year-boundary, leap-day, daylight-saving, and malformed-timestamp cases render safely with neutral copy and no false awards or freeze deductions.
- [x] Streak summary and calendar controls have clear headings and names, visible keyboard focus, logical navigation, and at least 44px touch targets; the calendar fills the available mobile width but stays near a readable 640–720px measure on larger screens, with no clipping or horizontal overflow at 320px, desktop widths, or a 200%-zoom-equivalent viewport.
- [x] Reloading and versioned export/import preserve the source sessions and reproduce the same streak history for the same local date and timezone without changing unrelated Journeys, sessions, milestones, weekly goals, timers, or onboarding data.

## Plan

<!-- Implementation steps -->

1. Add a canonical local-date helper and a pure, current-date-injected streak derivation module that replays qualifying session dates into daily states, current and longest streaks, reward progress, freeze awards, uses, and inventory.
2. Add focused unit tests for eligibility, same-day deduplication, local-midnight behavior, reward boundaries, protected and broken sequences, historical recalculation, date boundaries, invalid records, and empty or long histories.
3. Extend Home data and the existing Today card with one fully tappable, icon-led streak link while preserving Continue, the two-card Today/This week composition, primary navigation, and local-midnight refresh behavior.
4. Add restrained inline Session Complete feedback and a streak-impact row to the existing manual-session success confirmation, without introducing new actions, cards, notifications, or routes in either flow.
5. Add the secondary streak route with its large-number hero, next-freeze feedback, clear Home return, month navigation, month-scoped practiced/freeze totals, responsive connected streak bands, concise legend, per-date accessible labels, and non-color state cues.
6. Verify existing-data backfill, manual-entry reconciliation and messaging, Journey-deletion recalculation, sample isolation, reload, and versioned import/export behavior without introducing an independent streak ledger unless implementation evidence requires one.
7. Run the complete quality, test, build, browser, responsive, accessibility, and console checks, then review every change against this contract.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused streak tests cover exact 5-minute eligibility, sub-threshold exclusion, same-day sessions, local midnight, 7-day reward boundaries, freeze exhaustion, breaks, historical edits, manual sessions, invalid timestamps, month/year/leap-day boundaries, and DST transitions
- [x] Existing saved history, reload, Journey deletion, and export/import produce deterministic streak and inventory results without changing unrelated state
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] Home preserves its Continue-first hierarchy, existing Today/This week row, and three-item primary navigation; the entire icon-led streak area opens `/streaks` by pointer and keyboard with correct accessible context and no nested or competing link
- [x] Streak hero hierarchy, monthly Days practiced and Freezes used totals, historical month navigation, connected practiced/freeze bands, band breaks, week/month boundaries, today/future states, legend, focus visibility, touch targets, reduced motion, and accessible date labels are verified in a real browser
- [x] Session Complete inline feedback and manual-session streak-impact confirmation are verified for changed and unchanged same-day results without duplicate celebrations, redirects, or competing actions
- [x] Current month, empty history, protected streak, broken streak, full practice month, long history, five- and six-row months, long month names, 320px, desktop, and 200%-zoom-equivalent layouts are verified without overflow or unreadable calendar cells
- [x] No relevant console errors

## Notes

<!-- Decisions, blockers, and scope changes -->

- The streak is global across all real persisted Journeys because the request says a qualifying session on any Journey maintains it.
- A protected date holds the displayed streak count steady rather than increasing it. Freeze rewards stay earned by real focus: every 7 qualifying days in the protected sequence, not every 7 elapsed calendar dates.
- Inventory begins at 0, has no cap in this version, is automatic rather than user-selectable, and cannot be bought, manually granted, or disabled. Each missed date costs exactly 1 freeze.
- The preferred implementation derives streak events from completed sessions and the injected current local date. This keeps manual backfills, Journey deletion, reload, and import/export deterministic and avoids a second mutable history that could drift.
- Version one follows the app's existing local-date behavior: a timed session belongs to the local date of `endedAt`, a manual session belongs to its selected date, and a day closes at local midnight. A fixed account timezone and travel-specific date locking are follow-up decisions, not blockers for the current local-only app.
- Historical recalculation may refund or move a previously derived freeze use when a legitimate manual session is added for that date, matching the product's honest, correctable tracking principle.
- The motivating additions included in scope are a personal best, progress toward the next freeze, and restrained Session Complete feedback. They reward real practice without adding XP, coins, badges, rankings, random rewards, or streak-loss drama.
- Live desktop and mobile inspection confirmed the UI ownership: Home uses the unused lower space in the existing Today card; personal best and next-freeze progress stay on the dedicated streak page; Session Complete uses one inline status line; and manual backfills extend the existing saved-session confirmation. No standalone Home streak card, fourth navigation item, global toast, modal, or separate inventory page is added.
- The supplied Duolingo references refine, but do not replace, that ownership. Adopt the icon-led tappable entry, large streak number, short rule explanation, month navigation, monthly Days practiced and Freezes used totals, and connected week-row streak treatment.
- The Home streak area is one link rather than an icon button plus a separate text link. It uses an original code-native flame and snowflake language consistent with the app, with text carrying the meaning for accessibility.
- On the streak page, the current streak is the hero and the monthly calendar is the main record. Personal best, inventory, qualifying rule, and next-freeze progress stay visually subordinate; Home remains the parent destination.
- Do not carry over the references' Personal/Friends tabs, share control, XP or gem counters, multicolor rewards, yellow/orange/blue palette, gradients, cartoon imagery, dark-only page treatment, or proprietary icon artwork. The result should feel recognizably 1000 Pomodoros, not like a Duolingo clone.
- Calendar date cells are informational rather than unnecessary buttons. Their visible and assistive labels communicate the date, focused time or freeze use, and streak state; only genuine actions such as month navigation and returning Home receive interactive focus and touch-target treatment.
- Optional reminders, weekly or monthly recaps, shareable streak records, social challenges, scheduled rest days, and configurable freeze rules are follow-up ideas, not part of this feature.
- “Like Duolingo” is treated as the monthly streak-history interaction model only; the screen will use the existing 1000 Pomodoros visual system and original UI.
- No application code is changed during `feature load`. There are no unresolved blockers; these explicit version-one rules can be revised before `feature start` if a different freeze or timezone policy is desired.
- `feature start` created `codex/feature/daily-streaks-and-streak-freezes` and implemented the feature without changing the AppState schema. Canonical local-noon date math and pure session replay now own streak eligibility, rewards, protection, breaks, month totals, and historical recalculation. Replay also rejects noncanonical or future timer timestamps, orphan Journey references, invalid runtime sources, blank IDs, and duplicated session IDs so malformed imports cannot create false awards.
- Home reuses the lower portion of the existing Today card for one semantic `/streaks` link; Session Complete adds one first-session-only line; and manual recovery extends its existing saved-session status with the calculated impact.
- The dedicated streak page uses a semantic calendar table with informational, non-tabbable date cells, connected Pomodoro Red week bands, an Ink/Paper freeze pattern, a visible legend, historical-only month navigation, and a readable 44rem maximum width.
- Start-phase baseline checks pass: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (34 files, 390 tests), `pnpm build` (13 prerendered pages), and `git diff --check`. Formal feature-test browser evidence and feature review remain separate unchecked lifecycle gates.
- Feature testing added direct persistence coverage for reload, versioned export/import, Journey-deletion replay, unrelated-state preservation, and a nonzero personal streak remaining unchanged across `/sample`. This was verification-only remediation; no production behavior changed after the start-phase build.
- Test-phase automated gates pass: `pnpm check` (146 files), `pnpm exec tsc --noEmit`, `pnpm test` (35 files, 394 tests), the existing production `pnpm build` evidence (13 prerendered pages), and `git diff --check`.
- Real-browser checks used a 40-day fixture with 4 available freezes, a manual 5-minute day, and one protected date, plus separate empty and broken histories. Home, `/streaks`, reload, historical navigation, full five-row and current six-row months, long month names, Session Complete first/same-day feedback, and manual current/already-covered feedback were exercised at 1280×800, 375×812, 320×800, and a 640×400 200%-zoom equivalent with no horizontal overflow or console warnings/errors.
- Browser evidence confirms a native semantic Home streak link, pointer navigation, its accessible context, a visible focus ring, a 67–89px target, and the unchanged three-link primary navigation. The in-app browser's keyboard injector did not advance focus or activate native controls for Tab/Enter, so end-to-end keyboard activation of the Home link remains the one unchecked test item for review rather than being inferred.
- Feature review compared every tracked and untracked change with branch base `208e25333020e528f7757bdb9ddc18fb216d6fa4`. `pnpm check` (146 files), `pnpm exec tsc --noEmit`, `pnpm test` (35 files, 394 tests), and `git diff --check` pass; the previously recorded production build remains applicable because the later remediation added tests only.
- Review keeps the feature In Progress for blocking correctness issues: eligibility validates `endedAt` but not canonical, chronologically valid `startedAt`, so malformed imports can create false awards; replay also walks every date from the first session and took about 1.1 seconds for a valid year-0000 sparse-history probe.
- Review found Session Complete can replay a same-day streak line when a manual session stored at local noon precedes a morning timer in real use, and a revisited historical completion still says `Today counts` because the feedback copy is date-insensitive.
- Review found small 45% and 55% Ink labels on Paper render at approximately 2.92:1 and 3.95:1, below WCAG AA's 4.5:1 threshold. Live checks otherwise remained sound at 1280px, 768px, 375px, and 320px with no overflow or product-console errors.
- Verification remains incomplete for direct Home Tab/Enter activation, reduced-motion and streak-page focus observations, a separately recorded full-practice-month/readability case, malformed `startedAt`, the explicit day-21 award marker, and nonzero reward progress across a protected date.
- Review remediation is classified broad/high-risk because it changes the shared streak replay algorithm, imported-session eligibility, Session Complete history selection, and rendered calendar treatments. The full test/build and affected browser evidence must therefore be rerun; only unrelated persistence fixtures may be reused if the full suite confirms them.
- Remediation now rejects noncanonical or chronologically impossible `startedAt` values, jumps inactive date gaps after spending only the available freezes and recording the first unprotected miss, uses earlier-persisted same-date manual sessions to suppress duplicate timer feedback, replaces date-sensitive `Today counts` copy with `Focus day counted`, and raises small calendar text to contrast-safe Ink opacity while preserving quiet future and adjacent-month states through weight and treatment.
- Focused remediation coverage now includes malformed starts, start-after-end, a bounded year-0000 sparse replay, the day-21 freeze award, nonzero reward progress through protection, manual-before-morning-timer feedback across Journeys, historical completion copy, and contrast-safe classes. The combined focused run passes 6 files and 55 tests; broad automated and browser revalidation remain pending.
- Final remediation also treats every same-date manual row as available to Session Complete streak feedback because timer rows are persisted when focus starts and the schema has no separate creation timestamp; this closes both `[manual, timer]` and `[timer, manual]` persistence orders without changing Pomodoro or milestone chronology. A five-digit streak hero can now wrap its unit while keeping the count intact, with a real 10,000-day regression.
- Broad/high-risk revalidation is complete: `pnpm check` passes 146 files, `pnpm exec tsc --noEmit` passes, `pnpm test` passes 35 files and 401 tests, `pnpm build` prerenders all 13 pages, and `git diff --check` passes. The full suite reconfirms the earlier persistence, import/export, Journey deletion, and `/sample` isolation evidence; no affected automated result was reused without rerunning it.
- Fresh real-browser remediation checks confirmed native Home Tab order and Enter activation into `/streaks`, pointer activation, 44px controls, visible focus, informational non-tabbable date cells, effectively-zero reduced-motion transitions, and accessible practiced, freeze, missed-sequence, today, inactive, and future labels. A 31-practice-day July, the protected and broken August sequence, empty history, long month names, five- and six-row calendars, and a 10,000-day hero stayed readable without horizontal overflow at 1280×800, 320×800, and 640×400.
- Live contrast measurements are 4.66:1 for small Ink/60 labels on Paper, 5.21:1 for adjacent-month practiced dates, and 5.05:1 for selected practiced dates. Session Complete and manual-save checks covered first-day, both same-date persistence orders, historical date-neutral feedback, already-covered manual entries, and restored history without duplicate celebration, redirect, or competing action. The final browser console contained no warnings or errors.
- Remediation re-review found no remaining domain, integration, UI, accessibility, performance, or scope blocker. Every acceptance criterion and applicable verification item is now satisfied, so the feature is Ready to Commit.


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
