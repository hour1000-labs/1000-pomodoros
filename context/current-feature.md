# Current Feature: <feature name>

<!-- One-sentence description of the feature or fix -->

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Not Started

## Goal

<!-- Describe what should change from the user's perspective. -->

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [ ] ...
- [ ] ...
- [ ] ...

## Plan

1. ...
2. ...
3. ...

## Verification

- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Affected UI verified in the browser, if applicable
- [ ] Mobile and desktop verified, if responsive UI changed
- [ ] No relevant console errors

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->


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
