# AI Interaction Guidelines

## Communication

- Be concise and direct.
- Briefly explain non-obvious decisions.
- Ask before large refactors or architectural changes.
- Ask when requirements are unclear and would materially affect the result.
- Do not add features that are not in the project specification.
- Never delete or rename files without permission.
- Do not claim that a command, test, or browser check was completed unless it was actually performed.

## Core Development Rules

- Make the smallest complete change that satisfies the request.
- Preserve existing codebase patterns.
- Do not refactor unrelated code.
- Do not add speculative abstractions or “nice to have” features.
- Do not add or replace dependencies without permission.
- Every code change should map to an acceptance criterion in `@context/current-feature.md`.

## Workflow

Use this workflow for every feature or fix.

### 1. Inspect

Before making changes:

- Read the relevant project specification and context files.
- Inspect the affected code and existing patterns.
- Identify the likely files and behavior involved.
- Do not edit files during this step.

For unclear requirements, large refactors, or architectural changes, explain the proposed approach and ask before continuing.

### 2. Branch

Create a branch before modifying project files.

Use:

- `codex/feature/<feature-name>`
- `codex/fix/<fix-name>`
- `codex/chore/<task-name>`

Use lowercase kebab-case.

Never work directly on `main`.

### 3. Document

Update `@context/current-feature.md` with:

- Feature name
- Goal
- Acceptance criteria
- Implementation plan
- Verification requirements

Set the status to `In Progress` before implementation begins.

Keep documentation proportional to the size of the task.

### 4. Implement

- Implement only the documented scope.
- Make focused, reviewable changes.
- Preserve existing architecture and conventions.
- Update tests when changing tested logic or behavior.
- Do not modify unrelated files unless required for the requested feature to work.
- Record meaningful scope changes or decisions in `@context/current-feature.md`.

### 5. Verify

Use the scripts that exist in `package.json`.

Current required commands:

```bash
pnpm check
pnpm test
pnpm build
```

`pnpm check` is read-only and must pass with no warnings. Use `pnpm check:fix`
only when formatting files, organizing imports, and applying safe lint fixes is
intended.

Also perform checks that apply to the change:

- Verify affected UI and user flows in a real browser.
- Check mobile and desktop layouts when responsive UI changed.
- Check relevant browser and terminal output for errors.
- Exercise important success, failure, and boundary cases.

Record the result of each check in `@context/current-feature.md`.

- Mark a verification item complete only after it passes.
- Leave failed or skipped items unchecked.
- Record failures, blockers, and skipped checks under `## Notes`.
- Never describe intended or inferred behavior as verified behavior.

#### Post-verification revalidation

Initial feature verification is unchanged: run every required command and
applicable manual check before the first review. If files change after that
evidence is recorded, repeat `feature test` and `feature review`, but revalidate
according to what the remediation could affect instead of automatically
discarding unrelated evidence.

Before rerunning checks:

1. Inspect the remediation diff separately from the complete feature diff.
2. Classify the remediation by potential impact, not only by file extension.
3. Record the class, rationale, checks rerun, and evidence reused under
   `## Notes` in `@context/current-feature.md`.
4. If the impact is uncertain, use the next higher-risk class.

For every class, run `pnpm check` and `git diff --check`. Then add the checks
required by the remediation class:

Use these classes:

- **Documentation-only** — prose or comments that cannot affect executable
  behavior, generated inputs, configuration, or published artifacts. Run any
  relevant documentation validation.
- **Proven non-semantic** — formatting, mechanical ordering, or a narrowly
  demonstrated restoration that does not change runtime tokens, types, data,
  generated output, or behavior. Run a focused proof of semantic equivalence.
  Reuse unaffected test, build, and browser evidence.
- **Localized behavioral** — a bounded logic or UI change with a known impact
  surface. Run the relevant targeted tests and applicable targeted browser or
  runtime checks. Rerun `pnpm build` when compilation, bundling, routing, SSR,
  or another production boundary could be affected.
- **Broad or high-risk** — dependency, build configuration, routing,
  persistence, shared infrastructure, security boundary, generated-code
  contract, cross-cutting logic, or any change with uncertain reach. Rerun
  `pnpm test`, `pnpm build`, and every applicable browser or runtime check.

Previously recorded evidence remains valid only when the remediation cannot
affect what that evidence proves. Do not uncheck unaffected verification items
merely because the worktree changed; invalidate and rerun every item whose
result could have changed.

### 6. Review

Review the complete feature diff against every acceptance criterion.

- Include tracked and untracked files in the review.
- Confirm every code change maps to an acceptance criterion or is strictly required to support one.
- Check for concrete bugs, regressions, accessibility issues, missing error handling, unrelated changes, and scope creep.
- Mark an acceptance criterion complete only when there is implementation and verification evidence.
- Keep the status `In Progress` while any applicable criterion, verification item, or blocking issue remains.
- Set the status to `Ready to Commit` only when the feature is complete and verified.
- After remediation, review the remediation diff in detail and confirm the
  complete feature diff still matches the contract. Reuse earlier
  criterion-by-criterion findings only when their implementation and evidence
  were not affected.

### 7. Complete

Do not complete work unless `@context/current-feature.md` has status `Ready to Commit`.

Before committing, merging, pushing, or deleting a branch:

- Inspect `git status` and separate unrelated user changes.
- Stage only files that belong to the current feature.
- Obtain confirmation before consequential Git operations unless the user already requested them explicitly.
- Follow the repository's requested integration workflow; do not assume a direct merge to `main` is preferred over a pull request.

After successful integration:

- Append a dated summary to the end of `## History` in `@context/current-feature.md`.
- Include the branch, user-visible result, and verification that actually passed.
- Preserve all existing History entries.
- Reset the active feature sections to their placeholders for the next feature.

## Status Rules

Use only these statuses in `@context/current-feature.md`:

- `Not Started` — scope is documented, but implementation has not begun.
- `In Progress` — implementation, testing, or remediation is underway.
- `Ready to Commit` — all acceptance criteria and applicable verification checks pass, with no blocking review findings.

Completed work is represented by an append-only `## History` entry, not by an
active status. After successful integration, reset the active sections to the
`Not Started` template.

Do not advance status based on intent, partial implementation, or unverified claims.
