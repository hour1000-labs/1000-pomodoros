# Current Feature: Choose Target Onboarding

Add the third onboarding step so users can choose and save a concrete focused-time target before defining their first Next step.

## Status

Ready to Commit

## Goal

Users can choose a preset or custom focused-time target, understand its pomodoro equivalent, and continue onboarding with confidence that the experience will emphasize the next reachable milestone.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] `/onboarding/target` replaces the foundation placeholder with the step 3 target-selection screen, shows “3 of 4,” and uses the heading “How much focused time are you aiming for?” with the referenced design hierarchy.
- [x] When no valid onboarding Journey draft exists, visiting `/onboarding/target` redirects to `/onboarding/journey` instead of presenting the target form.
- [x] The screen presents accessible radio-group options for 10, 25, 100, and 1,000 hours plus Custom, using numbers without difficulty labels.
- [x] A new draft defaults to 1,000 hours, and the selected 1,000-hour option shows “2,400 pomodoros.”
- [x] Pomodoro equivalents are calculated from the selected target using `targetHours * 60 / 25`.
- [x] Selecting Custom reveals one numeric hours input on the same screen and accepts only targets from 1 through 10,000 hours with clear validation feedback.
- [x] Continue saves the valid selected target to the onboarding draft and routes to `/onboarding/next-step`.
- [x] Back returns to `/onboarding/motivation`.
- [x] The screen reassures users that the experience will focus on the next milestone rather than showing the full target by default.
- [x] The target-selection flow remains usable with keyboard and screen-reader interaction and at supported mobile and desktop layouts.

## Plan

1. Inspect the existing onboarding draft model, persistence repository, target route placeholder, shared onboarding layout, and adjacent onboarding-step patterns.
2. Add target conversion and validation behavior for preset and custom hours while preserving the draft's existing Journey name and motivation.
3. Build the responsive target-selection screen from the reference using an accessible radio group, conditional custom input, validation feedback, milestone reassurance, and existing shared UI patterns.
4. Wire missing-draft redirection, draft saving, Continue navigation to `/onboarding/next-step`, and Back navigation to `/onboarding/motivation`.
5. Add focused automated coverage for defaults, conversions, accessibility semantics, custom boundaries, persistence, redirects, and forward/back navigation.
6. Run the required quality gates and verify the complete interaction in a real browser across mobile and desktop, including keyboard use, validation boundaries, overflow, zoom, and console output.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] No relevant console errors
- [x] Target presets, default selection, and pomodoro conversions verified
- [x] Custom target values below 1, at 1, at 10,000, and above 10,000 verified
- [x] Accessible radio-group and keyboard behavior verified
- [x] Draft persistence, missing-draft redirect, Continue, and Back flows verified
- [x] Supported 320px layout, common mobile heights, long Journey context, and 200% zoom verified without overflow or hidden primary actions

## Notes

- Source: `context/features/onboarding-choose-target-spec.md`.
- Visual reference: `context/screenshots/onboarding3-ui.png`; follow `context/DESIGN.md` and reuse the established onboarding layout and repository-backed draft patterns.
- One pomodoro is exactly 25 focused minutes. The confirmed product model stores Journey targets in minutes and allows users to change a Journey's final target later.
- No pending decision in `context/decisions.md` materially blocks this feature; full-grid grouping and navigation remain outside this target-selection screen's scope.
- Implementation keeps the existing persistence contract: targets are stored as minutes, preset selections derive from those minutes, and a saved non-preset value restores as Custom.
- Custom targets allow numeric hour values, including decimals, within the specified inclusive 1–10,000 range; displayed pomodoros are derived with the required formula.
- Excluded: difficulty labels, milestone/full-grid redesign, final Journey creation, first Next-step entry, timer behavior, and any extra onboarding questions or controls.
- Initial verification passed `pnpm check` (82 files), `pnpm test` (8 files, 45 tests), `pnpm build` (client and SSR), and `git diff --check`.
- Browser verification covered the 1,000-hour default, preset conversions, native radio arrow-key selection, Custom values below 1, at 1, at 10,000, and above 10,000 hours, persistence and forward routing, Back navigation, and missing-draft redirection.
- Browser testing found that the initial short-height layout hid Continue at 320×568 and 1280×800. The localized behavioral remediation compacts target cards and supporting content at heights up to 900px while preserving the full reference treatment on taller screens.
- Post-remediation revalidation reran `pnpm check`, the focused target suite (5 tests), `pnpm build`, `git diff --check`, and the affected production-browser matrix. The unaffected initial full-suite result was reused because the remediation changed only responsive presentation classes.
- Final production-preview checks passed at 1280×800, 640×800 as the 1280-at-200%-zoom equivalent, and 320×568 with an 80-character unbroken Journey name, in both preset and Custom states: no horizontal or vertical overflow, Continue visible, and zero console errors or warnings.
- Recording final evidence is documentation-only; `pnpm check` and `git diff --check` are rerun while the unaffected test, build, and browser evidence remains valid.
- Review found that the `max-height: 900px` compact treatment also activates at common 1440×900 and 375×812 viewports. Despite ample unused space, it removes the Journey context and supporting copy, reduces the heading, hides unselected pomodoro conversions, and leaves selected and unselected target rows at unequal heights. This blocks the referenced-design-hierarchy criterion and keeps the feature In Progress.
- Review also found that Custom validation leaves `aria-describedby` referencing `custom-target-helper` while that helper element is not rendered in the error state. The visible error remains announced through `custom-target-error`, but the stale reference should be removed or the helper should remain mounted.
- The review remediation is localized behavioral work: outer spacing now compacts at heights up to 900px, card typography and spacing compact at heights up to 800px, and supporting context is hidden only at genuinely short heights up to 650px. Every preset keeps its pomodoro conversion, compact conversion text remains on one line, and the four cards retain equal heights without changing the 2×2 mobile grid.
- Custom validation now points `aria-describedby` exclusively to the mounted error or helper element. The focused test asserts both states, and production-browser inspection confirmed every referenced ID exists.
- Post-remediation revalidation passed `pnpm check` (82 files), `pnpm test` (8 files, 45 tests), `pnpm build` (client and SSR), and `git diff --check`. Production-browser checks passed at 1440×900, 375×812, 1280×800, and 320×568: the intended hierarchy remains visible on common viewports, all cards are equal-height with visible conversions, preset and Custom-error states fit without overflow or hidden actions, and the console has zero errors or warnings.
- Remediation review found no remaining blocking issues. The review reran `pnpm check` and `git diff --check`, inspected the complete and remediation diffs, and independently verified 1440×900, 768×1024, 375×812, 320×568, the 640×800 200%-zoom equivalent, keyboard radio navigation and focus visibility, Custom error semantics, an 80-character unbroken Journey name, overflow boundaries, and console output. The recorded full test and production-build results remain applicable.

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
