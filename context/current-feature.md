# Current Feature: Add Next Step Onboarding

Add the final onboarding step so a user can define their first concrete action, create their Journey, and continue directly into focus setup.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

Users can finish onboarding by choosing one actionable Next step and arrive at `/focus` with their newly created Journey and Next step selected, ready to start their first pomodoro.

## Acceptance Criteria

- [x] `/onboarding/next-step` renders the fourth onboarding step with the progress label “4 of 4,” the heading “What is the next thing you can work on?”, one labeled Next step input, and the helper copy “Choose one action you can make progress on in your next session.”
- [x] The seeded “Learn guitar” onboarding draft shows “Practice the F chord transition” as the Next step sample value.
- [x] The Next step is validated after trimming as required and between 1 and 120 characters; invalid submissions remain on the screen and expose an accessible, useful error.
- [x] A Back action returns to `/onboarding/target` without losing the onboarding draft, and opening the route without an onboarding Journey draft redirects to `/onboarding/journey`.
- [x] Submitting through the single primary “Start first pomodoro” action atomically creates the Journey, its first current Next step, and the default first milestone of 10 pomodoros from the onboarding draft.
- [x] Submission is idempotent so repeated activation cannot create duplicate Journeys, Next steps, or first milestones, and the onboarding draft is cleared only after creation succeeds.
- [x] A successful submission routes directly to `/focus` with the newly created Journey and Next step selected; onboarding does not end on Home or an empty dashboard.
- [x] The screen follows the supplied onboarding visual reference and `context/DESIGN.md`, remains usable from 320px upward and at 200% zoom, and provides keyboard access, visible focus states, and minimum 44px touch targets.
- [x] The implementation adds no subtasks, priorities, due dates, categories, scheduling controls, or other onboarding questions.

## Plan

1. Replace the `/onboarding/next-step` placeholder with a feature-owned final-step screen that reads the persisted onboarding draft and handles missing-draft redirection.
2. Build the responsive form and visual treatment with Journey context, exact progress/heading/helper copy, the seeded sample value, trimmed 1–120 character validation, Back navigation, and a guarded primary submission action.
3. Extend the repository onboarding-completion operation as needed so Journey, first current Next step, 10-pomodoro milestone, active selection, and draft clearing are persisted atomically and idempotently, including recoverable failure behavior.
4. Route successful completion to `/focus` with the created Journey and Next step selected using the existing persistence and focus-selection contracts.
5. Add focused component and repository tests for rendering, restoration, validation boundaries, missing-draft redirect, Back, success/failure behavior, draft clearing order, selection handoff, and repeated submission.
6. Verify the complete flow and responsive/accessibility behavior in a real browser, including repeated activation, 320px/mobile, desktop, 200% zoom, maximum-length input, overflow, focus, and console output.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] Focused tests pass for Next step rendering/restoration, trimmed 1–120 character validation, redirect, Back, persistence failure, successful creation/selection, draft clearing, and repeated submission
- [x] Browser flow passes from target selection through Next step submission to `/focus` with the created Journey and Next step selected
- [x] Browser checks pass at 320px/mobile, desktop, and 200% zoom with no clipping or horizontal overflow, including a 120-character unbroken value
- [x] Keyboard navigation, visible focus, accessible labels/errors, and minimum 44px touch targets are verified
- [x] No relevant browser console errors or warnings

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- Source spec: `context/features/onboarding-add-next-step-spec.md`.
- Visual reference: `context/screenshots/onboarding4-ui.png`; `context/DESIGN.md` remains the design-system source of truth where the screenshot and established product patterns differ.
- The confirmed Next step model is an ordered list with the current item first and no version-one due dates. Pending scheduling and completed-step-display decisions do not affect this first current Next step and do not block the feature.
- The default first milestone is exactly 10 pomodoros, or 250 focused minutes, and starts unearned.
- Journey creation, first Next step creation, first milestone creation, active selection, and draft clearing must share one repository transaction so a failed save retains the draft and cannot leave partial onboarding data.
- Stable IDs and/or an in-flight submission guard should make retries and repeated clicks idempotent without adding a second Journey, Next step, or milestone.
- Implementation uses the onboarding draft's `startedAt` value to derive stable Journey, Next step, and milestone IDs, with an in-flight guard preventing repeated submission while the atomic write is pending.
- Successful completion is tracked separately from an initially missing draft so the repository's synchronous draft-clearing notification routes to `/focus` instead of racing the missing-draft redirect to `/onboarding/journey`.
- The Journey target continues to come from the existing onboarding draft; this feature does not change target selection or implement the timer’s running state.
- Out of scope: subtasks, priorities, due dates, categories, scheduling controls, extra onboarding questions, Home/dashboard completion, and timer setup behavior beyond handing the selected Journey and Next step to `/focus`.
- 2026-07-15 initial verification: `pnpm check` passed for 84 files; `pnpm test` passed 9 files and 52 tests; client and SSR `pnpm build` passed; and `git diff --check` passed.
- Production-browser verification passed the full Journey → motivation → target → Next step → focus flow, empty trimmed-input validation, Back navigation and restoration, missing-draft redirect, Learn guitar sample value, and repeated submission without duplicate records.
- Responsive browser evidence: 1280×800 matched the supplied composition; 320×568 with a 120-character unbroken value had `scrollWidth === innerWidth === 320`, no vertical overflow, a visible 48px primary action, and a visible 48px Back action; the 640×400 200%-equivalent viewport had no horizontal overflow and preserved vertical access to all controls.
- Accessibility and runtime evidence: the input exposed its label, helper, invalid state, and alert; keyboard Tab reached the primary action with a visible focus ring; measured controls exceeded the 44px target minimum; and the production browser and preview terminal reported no relevant errors or warnings.
- Post-verification change classification: documentation-only evidence recording and review-status updates in this file; they cannot affect runtime behavior, tests, bundling, or the browser results above, so that evidence remains valid. `pnpm check` and `git diff --check` were rerun and passed after the updates.

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
