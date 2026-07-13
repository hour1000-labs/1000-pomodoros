# Current Feature: Create Journey Onboarding

Create the first onboarding screen where a user names and saves the Journey they want to make progress on.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- Describe what should change from the user's perspective. -->

A new user can enter one meaningful Journey name, safely preserve it as an onboarding draft, and continue to the motivation step with minimal friction.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] `/onboarding/journey` uses the distraction-free onboarding layout without application navigation and follows the referenced onboarding screenshot and design system across supported responsive sizes.
- [x] The screen shows the progress label “1 of 4,” the heading “What do you want to make progress on?”, one labeled Journey name input, and no additional Journey fields or controls.
- [x] Seeded or screenshot states show “Learn guitar,” and the quiet examples include “Learn Spanish,” “Build my portfolio,” and “Improve at chess.”
- [x] Journey names are trimmed before saving and must contain 1–80 characters; validation appears only after the input is blurred or submission is attempted.
- [x] Continue is the screen's single primary action and is disabled while the Journey name is empty or the onboarding draft is being saved.
- [x] Continue saves the Journey name to the onboarding draft through the client repository and then routes to `/onboarding/motivation`.
- [x] A saved Journey draft is restored on return; the input autofocuses only on first entry and does not steal focus when a populated draft is restored.
- [x] Exit returns to `/`, requesting confirmation only when leaving would discard draft data.
- [x] The screen is keyboard accessible, preserves visible focus, and provides at least 44px touch targets for interactive controls.

## Plan

1. Inspect the existing onboarding route, onboarding layout, client repository, draft model, confirmation dialog, and related test patterns.
2. Build the responsive create-Journey screen from the supplied visual reference using the existing design tokens and shared components.
3. Implement controlled Journey-name input behavior, examples, trim and length validation, submission state, and conditional autofocus.
4. Restore and save the onboarding draft through the client repository, then add Continue and loss-aware Exit navigation behavior.
5. Add focused tests for rendering, validation timing and boundaries, draft persistence and restoration, focus behavior, and navigation paths.
6. Run the required automated and browser verification, record current evidence, and review every acceptance criterion.

## Verification

- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Journey-name validation, trim behavior, disabled and saving states, draft restoration, and navigation paths pass focused tests
- [x] Affected onboarding flow verified in the browser, including new, restored, Continue, and Exit-confirmation paths
- [x] Mobile from 320px, desktop, and 200% zoom layouts match the intended hierarchy without clipped or scrolling-critical controls
- [x] Keyboard navigation, visible focus, autofocus behavior, labels, validation messaging, and touch targets verified
- [x] No relevant console errors

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- Source spec: `context/features/onboarding-create-journey-spec.md`.
- Journey name is the only required field; categories, icons, colors, reason, and target controls are outside this feature.
- The source and adjacent onboarding specs explicitly define this as “1 of 4,” while `context/DESIGN.md` describes a broader five-screen onboarding flow. Use the feature spec's explicit progress label for this feature.
- The screenshot includes a Back action, but this feature's behavioral requirement is an Exit action that returns to `/` and confirms only when draft data would be lost.
- No pending decision in `context/decisions.md` materially blocks this feature.
- New drafts initialize the remaining model-required onboarding fields without exposing extra controls: reason and next step are empty, while the target starts at the confirmed 1,000-hour product default for the later target step to replace.
- Feature verification passed on Node.js 22: the focused suite passed 5 tests, `pnpm test` passed 6 files and 34 tests, `pnpm exec tsc --noEmit` passed, `pnpm build` passed client and SSR builds, and `git diff --check` passed.
- Headed-browser verification passed for empty validation, 1–80-character boundaries, trimmed repository persistence, Continue routing, restored-draft focus behavior, confirmed and direct Exit paths, 320px and 1440px layouts, 200% reflow without horizontal scrolling, visible keyboard focus, 44px minimum targets, and zero console errors or warnings.
- Vitest emits test-environment notices for jsdom `scrollTo`, the memory router's root href, and rendering the Start document shell inside the test container; these did not fail tests and were absent in the real browser.
- Feature review identified four small Ink-on-Paper labels using 45% and 55% opacity that measured 2.92:1 and 3.95:1 contrast, below the 4.5:1 WCAG AA requirement.
- WCAG remediation: all four labels now use the design system's 60% Ink treatment. The browser rendered each at 60% over Paper (`#ffffff`); the resulting contrast is 4.64:1. Responsive checks at 320px and 1440px showed no horizontal overflow, and the browser console remained free of errors and warnings.
- Follow-up feature review found no remaining blocking defects, regressions, accessibility issues, dependency changes, unrelated refactors, or scope expansion. All acceptance criteria and applicable verification items are satisfied.

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
