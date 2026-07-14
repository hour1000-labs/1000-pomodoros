# Current Feature: Add Motivation Onboarding

Add the optional motivation step to onboarding so users can record why their Journey matters or continue without a reason.

## Status

Ready to Commit

## Goal

Users can add, revisit, or skip a short reason for pursuing their current Journey while moving reliably between the Journey and target onboarding steps.

## Acceptance Criteria

- [x] `/onboarding/motivation` uses the distraction-free onboarding experience, shows “2 of 4,” displays the current Journey name, and uses the heading “Why does this matter to you?”.
- [x] The screen provides one labeled optional textarea with a 240-character limit; the character count appears only after 180 characters, and the seeded “Learn guitar” state shows “I want to play my favorite songs confidently.”.
- [x] Continue saves the entered reason to the onboarding draft and routes to `/onboarding/target`; “Skip for now” saves an empty reason and routes to the same destination.
- [x] Back returns to `/onboarding/journey` without discarding the current text, and a previously saved reason is restored when the user returns to the motivation screen.
- [x] Visiting the route without an onboarding Journey draft redirects to `/onboarding/journey`.
- [x] The screen follows the supplied onboarding visual reference and project design system, remains usable from 320px upward and at 200% zoom, and keeps the textarea and primary action visible without scrolling at common mobile heights.
- [x] The screen adds no motivational quotes, illustrations, testimonials, extra questions, or other out-of-scope controls.
- [x] Motivation persistence, navigation, redirect, skip, restoration, and character-count boundaries are covered by automated tests.

## Plan

1. Inspect the existing onboarding route, layout, draft repository, models, tests, and screenshot reference to identify the smallest reusable implementation path.
2. Add the motivation route UI using the shared onboarding patterns, Journey context, optional textarea, conditional character count, and responsive design constraints.
3. Connect draft hydration and guarding, then implement Continue, Skip for now, and Back persistence and navigation behavior.
4. Add focused automated coverage for rendering, draft absence, persistence and restoration, navigation actions, and the 180/240-character boundaries.
5. Run the required quality checks and verify the complete flow, accessibility, responsive layouts, visual reference, and browser console in a real browser.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Motivation Continue, Skip for now, Back, restoration, and missing-draft redirect verified in the browser
- [x] Character-count behavior at 180, 181, and 240 characters verified
- [x] Mobile, desktop, 200% zoom, and common mobile-height layouts verified against the supplied screenshot
- [x] Keyboard navigation, visible focus, textarea labeling, and 44px touch targets verified
- [x] No relevant console errors

## Notes

- Source specification: `context/features/onboarding-add-motivation-spec.md`.
- Visual reference: `context/screenshots/onboarding2-ui.png`; `context/DESIGN.md` remains the design-system source of truth.
- Reuse the existing onboarding draft and client repository boundaries; components must not access `localStorage` directly.
- The reason is optional, limited to 240 characters, and explicitly cleared when “Skip for now” is selected.
- The “Learn guitar” sample is shown as the empty textarea placeholder, matching the existing onboarding sample-value pattern without persisting motivation the user did not enter.
- The feature-specific four-step flow and “2 of 4” label override the older five-screen progress example in `context/DESIGN.md`.
- The pending milestone-sharing decision in `context/decisions.md` does not affect this feature.
- Excludes motivational quotes, illustrations, testimonials, additional questions, and unrelated onboarding steps.
- Test-driven adjustment: below 641px viewport height, supporting copy is hidden and the textarea is shortened so the full form and primary action fit without scrolling; 320×568 finished with scroll dimensions exactly 320×568.
- 2026-07-14 verification: `pnpm check` passed for 80 files; `pnpm test` passed 7 files and 40 tests; `pnpm build` passed client and SSR builds; and `git diff --check` passed.
- Headed Playwright verification passed at 1280×800, 320×568, 320×667, 320×800, and 640×400 CSS pixels at DPR 2 for 200%-equivalent reflow. Continue, Skip, Back, restoration, missing-draft redirect, 180/181/240 character boundaries, keyboard focus, visible focus styling, accessible labeling, 48px action heights, overflow, and browser console output were checked with zero errors or warnings.
- Review finding: at 375×812, entering 240 unbroken characters caused the textarea and form section to grow to 672px wide and the document to grow to 692px, shifting the interface off-screen. The computed textarea style remained `field-sizing: content`, so the earlier responsive evidence did not cover this maximum-content layout case. Responsive acceptance and verification remain open pending a fix and re-test.
- Review fix: constrained the grid section and textarea to their available width. With 240 unbroken characters, headed-browser re-testing measured a 291px textarea inside a 335px section at 375px with document width fixed at 375px; at 320×568, both document dimensions matched the viewport and Continue ended at 546.8px. The full 40-test suite, Biome check, client build, SSR build, and browser console checks also passed.
- 2026-07-14 re-review: no blocking findings remained after the maximum-content overflow fix. All acceptance criteria and verification items passed, every feature change mapped to the documented scope, and the feature advanced to `Ready to Commit`.

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
