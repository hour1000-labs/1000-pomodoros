# Current Feature: Risk-based feature revalidation policy

Define proportional post-remediation verification rules that preserve trustworthy evidence without automatically repeating unrelated checks.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- Describe what should change from the user's perspective. -->

Developers and AI agents can resolve review findings efficiently while rerunning every check whose evidence may have been invalidated.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] Initial feature verification remains unchanged and must satisfy the full documented feature contract before review.
- [x] Post-verification changes are classified as documentation-only, proven non-semantic, localized behavioral, or broad/high-risk remediation, with explicit revalidation requirements for each class.
- [x] Previously recorded evidence may be reused only when the remediation cannot affect that evidence, and the rationale is recorded in `## Notes`.
- [x] Uncertain remediation defaults to the higher-risk class, while dependencies, build configuration, routing, persistence, shared infrastructure, and broad logic changes require full relevant verification.
- [x] A failed test or review still requires repeating `feature test` and `feature review`, but both actions support proportional revalidation and incremental review instead of restarting unrelated checks.
- [x] `context/ai-interaction.md`, the feature test action, and the feature review action describe the same policy without conflicting gates.

## Plan

1. Add the risk-based post-remediation policy and evidence-reuse rules to `context/ai-interaction.md`.
2. Update the feature `test` and `review` actions to apply the same classifications, escalation rules, and incremental-review behavior.
3. Verify the workflow documents are internally consistent, retain strict initial verification, and pass repository quality checks.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] No relevant console errors
- [x] Revalidation classes and required checks are consistent across all three workflow documents
- [x] Initial verification and final readiness gates remain strict

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- This policy applies only after verification evidence already exists; it does not reduce the initial verification required for a feature.
- Repeating the `test` and `review` actions remains mandatory after a failure. The simplification changes the scope of rerun checks, not the lifecycle.
- Product behavior and application code are out of scope.
- Remediation is classified by potential impact rather than file extension, and uncertainty escalates to the next higher-risk class.
- Every remediation class requires `pnpm check` and `git diff --check`; tests, builds, and browser checks scale with the affected behavior and production boundaries.
- Initial verification passed: `pnpm check` checked 80 files, `pnpm test` passed 7 files and 40 tests, `pnpm build` passed client and SSR builds, and `git diff --check` passed.
- A contract audit confirmed all four class names, universal cheap gates, uncertainty escalation, evidence-reuse rules, and strict initial verification are present across the shared policy and both actions.
- Browser, responsive, and console verification are not applicable because this chore changes workflow Markdown only and does not alter application code or runtime behavior.
- Review found that the test action limits proportional revalidation to changes following a failed test or review, while the shared policy applies after any post-verification file change. The test action must cover voluntary refinements and other post-verification changes too.
- Blocking review finding remediated as documentation-only: the test-action trigger now covers every file change made after verification evidence is recorded, including but not limited to failed test or review remediation. This wording-only workflow change cannot affect application tests, builds, browser behavior, or the initial verification contract, so that evidence remains reusable. Revalidation passed with `pnpm check` (80 files), `git diff --check`, and a focused cross-document contract audit; the earlier `pnpm test` (7 files, 40 tests) and client/SSR build evidence remains applicable.
- Post-remediation `feature test` confirmed the shared policy and both actions use the same trigger, classifications, escalation rule, universal cheap gates, and evidence-reuse rule. No tests were added or changed because the feature and remediation affect workflow Markdown only.
- Remediation review confirmed the trigger fix, classification, escalation, and evidence reuse are sound, but found one remaining gate mismatch: the test action and these Notes require `git diff --check` for every remediation class, while the shared policy names that command only for documentation-only and proven non-semantic changes. Align the shared policy or remove the universal requirement before readiness.
- The remaining review finding was remediated as documentation-only by making `pnpm check` and `git diff --check` explicit universal gates in the shared policy, with each class now listing only its additional checks. This cannot affect runtime, test, build, or browser behavior, so the earlier application evidence remains reusable pending the required follow-up `feature test` and `feature review`.
- Follow-up `feature test` passed for the documentation-only remediation: `pnpm check` checked 80 files, `git diff --check` passed, and a focused cross-document audit confirmed the universal gates, class-specific checks, escalation rule, trigger, and evidence-reuse behavior are aligned. The initial `pnpm test` result (7 files, 40 tests), client/SSR build, and non-applicability of browser checks remain unaffected and reusable.
- Final remediation review found no blocking issues: the documentation-only fix aligns the shared policy with the test and review actions, all acceptance criteria and applicable verification items are satisfied, and the complete diff contains no unrelated changes.

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
