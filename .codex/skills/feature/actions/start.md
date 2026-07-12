# Start Action

Use this action only after `load` has produced a complete `Not Started` feature.

## Preconditions

- Read `context/ai-interaction.md`, `context/product-spec.md`,
  `context/current-feature.md`, and relevant project files.
- Confirm `Goal`, `Acceptance Criteria`, `Plan`, and `Verification` are populated.
- Confirm the status is `Not Started`.
- Inspect `git status` and preserve unrelated user changes.
- Stop if requirements are unclear enough to materially change the result.

## Steps

1. Derive a lowercase kebab-case branch name from the feature name:
   - `codex/feature/<name>` for a feature.
   - `codex/fix/<name>` for a fix.
   - `codex/chore/<name>` for project housekeeping.
2. Create and switch to that branch before editing application files. Never
   implement directly on `main`.
3. Change only `## Status` to `In Progress`. Do not add a History entry yet.
4. Implement the numbered plan in order. Keep every change traceable to an
   acceptance criterion.
5. Record meaningful decisions, blockers, and approved scope changes under
   `## Notes` as they occur.
6. Keep unchecked any acceptance or verification item that has not been proven.

## Completion Gate

Report the branch, implemented plan steps, remaining criteria, and blockers. Do
not set `Ready to Commit`; that belongs to `review` after verification.
