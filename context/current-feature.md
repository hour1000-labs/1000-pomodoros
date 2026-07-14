# Current Feature: Adopt Biome Code Quality Tooling

Install and configure Biome as the project's single formatter, linter, and import organizer, then make its conventions mandatory for future changes.

## Status

Ready to Commit

## Goal

Contributors and AI agents can use one fast, deterministic tool to format and lint the project, with the same conventions enforced locally and during feature verification.

## Acceptance Criteria

- [x] `@biomejs/biome` is installed as an exact-version development dependency and the pnpm lockfile records the installation.
- [x] A root `biome.json` enables Git ignore integration, excludes `src/routeTree.gen.ts`, ignores unsupported file types, and declares the project's formatting, linting, import-organization, and Tailwind CSS parsing conventions.
- [x] Package scripts provide one read-only `check` quality gate and one explicit `check:fix` write command, with the read-only gate failing on warnings.
- [x] The official Biome VS Code extension is recommended and workspace settings use Biome for format-on-save, safe fixes, and import organization without changing the existing generated-route protections.
- [x] The existing supported source and configuration files are migrated to the Biome format, and all current recommended-rule diagnostics are fixed or narrowly suppressed with an inline reason when a rule cannot apply.
- [x] `context/ai-interaction.md` and `AGENTS.md` require future implementation work to run the Biome quality gate before tests and build verification.
- [x] Biome, TypeScript, tests, and the production build all pass after the migration without changing application behavior.

## Plan

1. Create `codex/chore/adopt-biome` and install the current stable Biome release with `pnpm add --save-dev --save-exact @biomejs/biome`.
2. Run `npx @biomejs/biome init` from the repository root to generate the initial `biome.json`.
3. Customize the generated, version-matched `biome.json` with the stable recommended linter preset; explicit 2-space, 100-column formatting; single quotes in JavaScript and TypeScript; double quotes in JSX; semicolons and arrow parentheses always; ES5 trailing commas; import organization; Tailwind v4 CSS parsing; Git ignore integration; and a regular exclusion for the generated route tree.
4. Add only `check` and `check:fix` package scripts, making `check` read-only and warning-strict while keeping all write behavior explicit in `check:fix`.
5. Add the official extension recommendation and merge Biome format-on-save, safe-fix, and import-organization settings into `.vscode/` without removing the route-tree watcher, search, or read-only settings.
6. Run `pnpm check:fix` across the entire repository to format all supported files, organize imports, and apply safe lint fixes; then review the diff and manually resolve remaining lint and accessibility findings without unrelated refactors.
7. Update the repository instructions so future agents run `pnpm check` as a required verification command and use `pnpm check:fix` only when they intend to modify files.
8. Run the complete verification suite, inspect the final diff for behavior changes and generated-file churn, and record the evidence before review.

## Verification

- [x] `pnpm check` passes with no errors or warnings
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `git diff --check` passes
- [x] `src/routeTree.gen.ts` is unchanged by Biome migration and verification
- [x] Existing tests and focused browser checks demonstrate no application behavior or responsive-layout regression

## Notes

- Planning baseline on 2026-07-14: the repository has no ESLint or Prettier packages or configuration, so this is a direct adoption rather than a config migration.
- The current stable package version observed during planning is `@biomejs/biome@2.5.3`; installation must pin the exact stable version available when implementation starts and use its matching schema URL.
- Generate the initial configuration with the user-requested `npx @biomejs/biome init` command after installing the pinned dependency, then edit that generated file rather than creating `biome.json` manually.
- Adopt the user-confirmed style explicitly: spaces with width 2, line width 100, single quotes in JavaScript/TypeScript, double quotes in JSX, semicolons always, arrow parentheses always, and ES5 trailing commas.
- Enable `linter.rules.preset: "recommended"` and `assist.actions.source.organizeImports: "on"`. Do not enable the `all` preset, nursery rules, or experimental features during initial adoption.
- Enable `css.parser.tailwindDirectives` and CSS formatting/linting for the Tailwind v4 stylesheet. Do not add Tailwind class sorting during initial adoption because the relevant rule is outside the stable recommended baseline.
- Enable Git VCS integration with `useIgnoreFile: true` and `defaultBranch: "main"`; set `files.ignoreUnknown: true`; exclude `src/routeTree.gen.ts` with a regular negated `files.includes` pattern so Biome can still use generated type information without linting or formatting the file.
- Planned scripts: `check` runs formatting, linting, and assists read-only and fails on warnings; `check:fix` formats files, organizes imports, and applies safe lint fixes. Dedicated `format` and `lint` scripts are intentionally omitted as redundant, and no implicit write command is part of verification.
- A read-only Biome 2.5.3 baseline found 8 errors and 15 warnings across 68 non-generated source files, plus formatting differences across numerous supported non-generated files. Migration must resolve this known baseline and apply the subsequently confirmed formatting convention rather than weakening rules globally.
- The repository-wide migration resolved the recommended-rule findings with targeted code changes: corrected ARIA semantics, semantic navigation list markup, an aliased `MapIcon`, stable decorative preview keys, and optional chaining. The four reduced-motion `!important` declarations remain with narrow inline suppressions because they must override the normal animation cascade.
- The first full test run exposed a progress-grid accessibility-query regression caused by moving its label into caption text. The summary was restored as the figure's accessible label while the truncation message remains a separate visible caption; the focused tests and subsequent full suite passed.
- Fresh `feature test` evidence on 2026-07-14: `pnpm check` checked 78 files with no errors or warnings; `pnpm exec tsc --noEmit` passed; `pnpm test` passed 6 files and 34 tests; `pnpm build` completed both client and SSR bundles; `git diff --check` passed; and `src/routeTree.gen.ts` retained SHA-1 `dc3c49e79444fd6e66a278c09e53a0f2a1ddcb45` with no diff.
- Headed Playwright verification passed at 1280x800 and 320x800: the landing demonstration exposed `43 complete pomodoros out of 50`, application navigation remained a semantic two-item list with working Home and Journeys links, and the browser reported zero errors or warnings.
- `feature review` compared all tracked and untracked changes with the seven acceptance criteria. No blocking findings, unrelated refactors, generated-route changes, unapproved dependencies, or scope expansion remained; the repository-wide mechanical formatting and targeted lint remediations are fully accounted for by the documented migration.
- A new CI workflow, pre-commit hook, and unrelated pnpm warning cleanup are out of scope. The package script and documented feature gate establish the convention now and can be wired into CI when CI infrastructure is added.

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
