# Current Feature: Simple Minimal App Redesign

Redesign every currently implemented user-facing screen with simpler copy, quieter use of the existing three-color palette, tomato-shaped Pomodoro progress units, and one obvious next action while preserving behavior.

## Status

Ready to Commit

## Goal

A user can understand 1000 Pomodoros as “Track focused work, one pomodoro at a time,” see every Pomodoro represented by a consistent tomato, and move through every current flow without unnecessary words, competing emphasis, or decorative visual noise.

## Acceptance Criteria

- [x] The product is explainable with the single core phrase “Track focused work, one pomodoro at a time,” and the landing and first-use surfaces reinforce that promise without introducing competing product narratives.
- [x] The redesign covers every currently implemented route: `/`, `/onboarding/journey`, `/onboarding/motivation`, `/onboarding/target`, `/onboarding/next-step`, `/home`, `/focus`, `/focus/complete`, `/journeys/$journeyId`, and `/milestones/$milestoneId`.
- [x] The redesign also covers each user-visible state within those routes, including focus setup, running and paused timers, successful and unavailable completion or milestone states, dialogs, navigation, loading, empty, validation, persistence-error, and recovery states.
- [x] Every screen and dialog communicates one clear purpose and has no more than one visually dominant primary action; required Back, Skip, Cancel, retry, secondary, and destructive actions remain available with appropriately lower emphasis.
- [x] Visible and assistive copy—including page metadata, headings, instructions, controls, validation, empty and error messages, confirmations, and accessible names—uses short, concrete, plain language and the confirmed terms `Journey`, `Pomodoro`, `Focus session`, `Next step`, and `Milestone` consistently.
- [x] Redundant explanations, duplicate metrics, decorative eyebrow copy, and vague or promotional wording are removed without removing information needed to understand progress, make a decision, recover from an error, or understand a destructive consequence.
- [x] The visual system uses only Ink, Paper, and Pomodoro Red as base colors, plus accessible derived opacity values: Paper remains dominant, Ink provides structure and text, and no viewport or dialog shows more than one visible red primary action; red may also communicate earned progress, selection, and necessary error or destructive feedback.
- [x] Reachable UI has no hard offset shadows, heavy two-pixel frames, oversized decorative color fields, nonessential badges or icons, or nested card treatments; cards default to a subtle one-pixel border with no shadow, while the existing soft dialog elevation may remain.
- [x] Manrope, tabular timer and metric numerals, and the Pomodoro grid remain recognizable product anchors, while each view uses at most one display-scale element and labels use sentence case instead of decorative uppercase micro-copy.
- [x] Every square or rounded-square element that represents one Pomodoro progress unit is replaced project-wide by one shared tomato treatment, including landing and onboarding previews, focus setup, Journey grids and legends, Session complete, Milestone detail, and retained foundation or demo components; no square Pomodoro unit remains.
- [x] The tomato matches the supplied screenshot direction with a compact Pomodoro Red fruit, Ink outline, and small Ink stem or calyx; it is a code-native SVG or CSS-rendered shape rather than an emoji, external raster image, or new dependency, and it remains legible at dense-grid sizes.
- [x] The tomato drawing is decorative inside the existing semantic unit wrapper: it is hidden from the accessibility tree while the wrapper remains the sole image or button role with the Pomodoro number, state, fill percentage, and interaction attributes, so no duplicate announcements or role counts are introduced.
- [x] User-facing copy that describes a visual progress unit as a `block` is rewritten to `Pomodoro`; internal component, variable, test-description, and historical-spec identifiers may retain `block` where renaming would not improve the user experience.
- [x] Shared tokens, primitives, layouts, navigation, and feedback components express the minimal system consistently, and `context/DESIGN.md` is updated wherever the final implementation changes an existing documented design rule.
- [x] Existing routes, navigation outcomes, timer lifecycle, persistence and recovery behavior, progress calculations, Journey and Next-step mutations, milestone attribution, and completed-session history remain functionally unchanged.
- [x] Complete, partial, future, latest, milestone, newly-earned, and selectable tomato states remain distinguishable without color alone: complete tomatoes are filled, partial tomatoes fill proportionally from left to right inside a persistent outline, future tomatoes are outlined, and the existing latest, milestone, highlight, focus, and inspection cues remain distinct.
- [x] Replacing the shape does not change Pomodoro indexing, minute-to-progress conversion, 10-column and 100-unit grouping, progressive rendering through 2,400 units, selection and focus restoration, animation semantics, or accessible names that announce the Pomodoro number and state.
- [x] Every affected surface remains usable at 320px width, desktop widths, and a 200%-zoom equivalent with maximum supported copy, without clipped content, horizontal overflow, obscured primary actions, or overlapping fixed navigation.
- [x] Semantic headings, labels, status announcements, keyboard operation, visible focus, reduced-motion behavior, WCAG AA contrast, and minimum 44px interactive targets are preserved or improved.
- [x] Automated tests are updated for intentional copy or markup changes without weakening coverage of routing, persistence, timer, progress, mutation, error, and accessibility behavior.

## Plan

1. Audit every in-scope route and state, then create a page-by-page content hierarchy that identifies its one purpose, visual anchor, primary action, essential supporting information, and removable copy or decoration.
2. Inventory every Pomodoro progress-unit rendering in reachable and retained demo source, distinguish it from unrelated red UI, and map it to the shared tomato treatment and required states.
3. Establish the implementation rules for the core phrase, concise voice, palette usage, typography, spacing, borders, elevation, icons, action hierarchy, and tomato shape; reconcile changed rules with `context/DESIGN.md`.
4. Implement the shared tomato rendering through the existing Pomodoro block and grid foundation, migrate stray hand-built progress squares and legends, and preserve partial fill, latest, milestone, newly-earned, selectable, accessible, and large-grid behavior.
5. Simplify the remaining global theme and shared UI foundation, including color tokens, buttons, cards, dialogs, inputs, brand treatment, navigation, layouts, loading, empty, error, confirmation, progress, and focus components.
6. Apply the system and rewritten copy to the landing page and all four implemented onboarding screens while preserving the existing onboarding draft, validation, exit, back, skip, and forward flows.
7. Apply the system and rewritten copy to Home, Journey detail, focus setup, running and paused focus states, Session complete, Milestone detail, their dialogs, and all unavailable or recovery states while preserving behavior.
8. Update affected tests to assert the tomato states, revised accessible names, roles, hierarchy, progressive rendering, and unchanged user flows rather than obsolete square styling or decorative copy.
9. Run the complete automated and browser verification matrix, fix any regressions, and perform a final route-by-route simplicity, tomato-coverage, and consistency audit.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Every in-scope route and interactive state is verified in a real browser for its one-purpose hierarchy, one dominant action, final copy, and consistent palette
- [x] The complete landing-to-onboarding-to-focus flow and returning-user Home-to-focus-to-completion flow pass without behavioral regressions
- [x] Journey progress inspection through the full 2,400-block target, Next-step dialogs and mutations, completion reflection, milestone earned and unavailable states, zero/loading/empty/error states, and persistence recovery are verified
- [x] A project-wide source and browser audit confirms that every Pomodoro progress unit—including preview, legend, dense-grid, interactive, newly-earned, onboarding-aside, and retained demo uses—is tomato-shaped, visible copy no longer calls those units blocks, and unrelated red buttons, progress bars, status dots, and decorative accents remain normal UI
- [x] Complete, 20%/50%/96% partial, future, latest, milestone, newly-earned, keyboard-focused, and selected tomatoes are verified against the screenshot direction at 16–28px dense sizes and 44px interactive sizes
- [x] Session Complete and Milestone Detail are visually compared with `context/screenshots/session-complete-ui-v2.png` and `context/screenshots/milestone-ui-v2.png` for the tomato treatment without importing unrelated screenshot features
- [x] 320×568 mobile, 375×812 mobile, 1280×800 desktop, and a 640×400 200%-zoom equivalent are verified with maximum supported content and no clipping, overflow, or obscured actions; Home/Journeys bottom navigation, Journey Detail’s sticky action, safe-area spacing, and scroll boundaries work together
- [x] Keyboard navigation, visible focus, semantic structure, assistive names and announcements, 44px targets, reduced motion, non-color state cues, and WCAG AA contrast are verified
- [x] No relevant browser console errors or warnings occur

## Notes

- Branch: `codex/feature/simple-minimal-app-redesign`.
- The user changed partial tomato progress from bottom-to-top to left-to-right before implementation; the feature and product decision registry already reflect that direction and it is authoritative.
- Direction: simplicity is the product constraint, not an aesthetic add-on. The app should do one thing clearly: help people focus and see the work add up.
- Core phrase for this feature: “Track focused work, one pomodoro at a time.” It replaces more abstract explanations where a product-level description is needed; contextual screens still use the shortest copy required for their task.
- “Every page” means every route and state currently implemented in the repository. Product-spec screens that do not exist yet—such as authentication, Journey library, history, manual entry, statistics, settings, pricing, and sharing—are not added by this feature.
- Product-authored demonstration and reset-state copy is in scope; persisted Journey names, reasons, Next steps, and reflections written by the user are not rewritten.
- Unrouted foundation/demo exports are not treated as pages for the broader redesign, but their Pomodoro progress units are included in the project-wide tomato conversion so no retained square representation remains.
- Color assumption: redesign the hierarchy and application of the existing Ink, Paper, and Pomodoro Red palette rather than inventing a new brand palette. Exact base values remain unless current contrast evidence requires an adjustment.
- Existing dormant dark-theme tokens should remain coherent with shared palette changes, but adding a dark-mode control or a new theme is out of scope.
- The user’s 2026-08-05 direction resolves the pending visual-treatment decision: every Pomodoro unit is a tomato, with filled, proportional partial, and outline states. The separate pending decision about large-grid grouping remains unresolved and unchanged.
- The functional conic timer progress, tabular numerals, proportional tomato fill, latest outline, milestone cue, newly-earned treatment, progressive grid rendering, and focus restoration communicate state and must not be removed as decoration.
- “Tomato” is the visual representation, not a renamed data unit. Product and assistive copy continues to use the confirmed term `Pomodoro`, where one Pomodoro equals 25 focused minutes.
- The supplied Session Complete and Milestone screenshots are references for the compact tomato silhouette, outline/fill states, and emphasis ring only; their unrelated layout, wording, Share action, and other concepts are not imported by this requirement.
- “Every red square” means every square progress cell representing a Pomodoro. Rectangular primary buttons, progress bars, status dots, selection accents, error feedback, and decorative red geometry are not tomatoes.
- `context/DESIGN.md` currently specifies square Pomodoro blocks and discourages literal tomatoes; those rules must be replaced by the confirmed tomato treatment. Historical completed-feature specs may retain their original wording because `context/decisions.md` is authoritative for new work.
- `context/DESIGN.md` contains older five-step-onboarding and four-item-navigation guidance. This visual and copy redesign must preserve the implemented four-step onboarding and Home/Journeys navigation rather than adding missing screens or controls to match that stale guidance.
- Necessary safety, validation, error-recovery, accessibility, and destructive-consequence copy is not “clutter” and must remain clear even when it cannot be reduced to a few words.
- No new product capabilities, routes, data fields, dependencies, authentication, backend, pricing, dark-mode control, or unrelated generated illustrations are in scope.
- Keep the supplied reference files `context/screenshots/milestone-ui-v2.png` and `context/screenshots/session-complete-ui-v2.png` unchanged.
- Fresh local storage still receives the existing seeded Learn guitar state, so `/` redirects to Home by design; the landing and onboarding flow was verified with a valid empty-state fixture. Changing that established seed behavior is outside this visual-and-copy redesign.
- 2026-08-05 initial feature test passed `pnpm check` (107 files, no warnings), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 169 tests), `pnpm build` (client and SSR), and `git diff --check`.
- Test remediation was **localized behavioral**: the selected inspectable Pomodoro exposed `aria-expanded` but had no persistent visual cue. `PomodoroBlock` now adds a geometric red selection ring, a 10% selection field, and `data-selected`; the focused grid and Journey suites passed (2 files, 26 tests), followed by a fresh full 169-test run, TypeScript, client/SSR build, `pnpm check`, and `git diff --check`. No pre-remediation executable evidence is being relied on for the final result.
- Production-browser verification covered all ten routes; landing through all four onboarding steps into focus; Home through focus and completion; focus setup, running, paused, early completion, reflection persistence, validation, earned and unavailable milestone, zero and empty states, persistence error, and successful recovery. Vitest additionally covered transient loading, missing-data, and persistence-failure boundaries. Journey inspection opened and closed with focus restoration, Next steps were added and completed, and the full 24-section target rendered exactly 2,400 semantic Pomodoro units through index 2,399.
- Tomato evidence: the shared SVG remained decorative inside one semantic wrapper; complete, future, latest, milestone, newly-earned, keyboard-focused, and selected states were distinct. Partial fills measured 20% = 4, 50% = 10, and 96% = 19.2 SVG units from x=4 with `data-fill-direction="left-to-right"`; dense tomatoes measured 19.4–28px and selectable tomatoes measured 44px. Session Complete and Milestone Detail matched the supplied compact fruit, Ink outline/stem, proportional fill, and emphasis-ring direction without importing their unrelated concepts.
- Responsive evidence passed at 320×568, 375×812, 1280×800, and 640×400 with 80-character Journey names, 240-character reasons, 120-character Next steps, and 280-character reflections. Document and app scroll containers had no horizontal overflow; mobile bottom navigation retained about 51px clearance at the scroll boundary, and at 640×400 the sticky Focus action ended 18px above navigation while the final content remained inside the scroll viewport.
- Accessibility evidence: keyboard focus was visible on a 48px landing action, inspectable tomatoes were 44×44px, Escape restored focus to the selected Pomodoro, semantic snapshots exposed headings, labels, dialogs, progressbars, timers, alerts, and status announcements, and reduced motion produced `animation-name: none`. Contrast ratios were Ink/Paper 17.74:1, muted Ink/Paper 4.66:1, and Pomodoro Red/Paper 5.05:1. The final browser console contained 0 errors and 0 warnings.
- A 98-source-file audit found no remaining square Pomodoro progress unit or visible progress-unit `block` wording. The only remaining red non-tomato elements are intentional rectangular actions, timer/progress indicators, navigation emphasis, selection, and error feedback.
- 2026-08-05 feature review inspected the complete 57-file tracked diff and both untracked supplied screenshots, passed `pnpm check` (107 files, no warnings) and `git diff --check`, and validated the selected-Pomodoro remediation as **localized behavioral** with the focused, full-suite, TypeScript, build, and browser evidence recorded above.
- The initial feature review found that opening `Reset saved progress` from a persistence-recovery state left the red `Try again` action visibly behind the Ink/20 dialog overlay while the dialog also showed the red `Reset progress` action. This affected every consumer of `RecoverableErrorState` and left both action-hierarchy criteria and the route-state hierarchy verification unchecked until remediation.
- Review remediation was **localized behavioral**: `ConfirmDialog` now exposes its optional open-state callback, and `RecoverableErrorState` uses it to switch `Try again` from the red default treatment to the outline treatment only while reset confirmation is open. The change is limited to recovery-state action hierarchy and does not alter reset, retry, persistence, routing, or other dialog behavior.
- Remediation checks passed `pnpm check` (108 files, no warnings), `pnpm exec tsc --noEmit`, focused Vitest coverage for the recovery state and shared confirmation dialog (2 files, 4 tests), `pnpm build` (client and SSR), and `git diff --check`. Production-browser checks at 1280×800 and 375×812 confirmed that the background retry action computes to the outline variant with a Paper background while the reset action is red, Cancel restores the retry action to the red default variant, confirming reset restores the seeded Home state, targets remain at least 48px high, and the console contains 0 errors and 0 warnings.
- The earlier full 169-test run, all-route behavior, tomato-state, responsive, accessibility, contrast, and screenshot-comparison evidence are reused because this optional dialog callback and recovery-only visual state cannot affect those recorded results. The affected recovery and confirmation behavior was rerun directly.
- Post-remediation feature review inspected the localized three-file remediation separately from the complete 58-file tracked diff, included the new focused test and both untracked supplied screenshots, found no blocking regression or scope expansion, and confirmed every acceptance criterion and verification item is satisfied. The final documentation-only evidence update reran `pnpm check` and `git diff --check`; both passed.

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
