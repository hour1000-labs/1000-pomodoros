# Current Feature: Auto-sort Tailwind classes with Biome

Configure Biome to consistently sort Tailwind classes during editor save actions and repository checks.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- Describe what should change from the user's perspective. -->

Developers can save or check project files and receive consistent Tailwind class ordering without adding a second formatter.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] Biome reports unsorted Tailwind classes as errors and provides an automatic fix.
- [x] Automatic sorting covers JSX `className` values and class strings passed to `cn`, `clsx`, and `cva`.
- [x] The existing Biome fix-on-save workflow applies class sorting without introducing Prettier or another dependency.
- [x] Existing Tailwind class strings are normalized without adding, removing, or otherwise changing their class tokens.
- [x] Application behavior, tests, and production builds remain unchanged after class normalization.

## Plan

1. Configure Biome's Tailwind class-sorting rule for the class patterns used by the project.
2. Apply the sorter to existing source files while preserving every class token.
3. Verify repository quality checks, tests, builds, and the mechanical scope of the generated diff.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] No relevant console errors
- [x] Every changed class string preserves the same class-token multiset

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- Use the existing Biome formatter and VS Code fix-on-save integration; adding Prettier is out of scope.
- Biome's `useSortedClasses` rule is experimental, so this feature explicitly opts its fix into safe on-save application.
- The implementation was made on `main` before this feature was loaded. The feature must still pass `test` and `review`; branch remediation can be handled by `feature start` if required.
- Test evidence: `pnpm check` passed for 78 files; `pnpm test` passed 6 files and 34 tests; and `pnpm build` passed client and SSR builds.
- A disposable fixture proved Biome reports and safely fixes unsorted `className`, `cn`, `clsx`, and `cva` strings. The fixture was removed after verification.
- A TypeScript AST audit verified that all 108 changed string literals across 24 TSX files preserve the same token multiset.
- Playwright smoke checks passed for landing, onboarding, home, Journey, and milestone surfaces at 1280x800 and 320x800 with no console warnings or errors.
- Browser testing exposed an unrelated existing milestone headline (`4.166666666666667 hours`). This feature only reorders that screen's unchanged class tokens; fixing the headline is outside the current scope.
- Review found a literal `$` inserted before the milestone `title` prop after testing. `pnpm check` now fails, and runtime verification must be repeated after that unrelated character is removed.
- The stray `$` was removed during review remediation, and a fresh `pnpm check` passed for 78 files.
- Remediation review reran `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), and a targeted headed Playwright milestone check at 1280x800 with no console warnings or errors. The earlier 320x800 browser evidence remains applicable because the remediation restored the exact previously tested source.

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
