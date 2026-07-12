# Load Action

Use this action to translate a source specification or inline request into
`context/current-feature.md`. Do not implement application code during this
action.

## Steps

1. Read `context/ai-interaction.md`, `context/decisions.md`, and
   `context/current-feature.md`.
2. Resolve the text after `load`:
   - If empty, stop and report: `feature load requires a spec path, spec name, or inline description.`
   - If it is an existing path, read that file.
   - Otherwise, check `context/features/<name>.md` and `context/fixes/<name>.md`.
   - If no file matches, treat the full text as an inline description.
3. Determine whether another feature is active:
   - The exact H1 `# Current Feature: <feature name>` is the empty-state sentinel
     and may be replaced.
   - Any H1 containing a real feature name is active, regardless of status. Do
     not overwrite it unless the user explicitly asks to replace it.
4. Rewrite the active-feature portion using the exact template structure:
   - H1: concise feature name.
   - Description: one sentence defining the change.
   - Status: `Not Started`.
   - Goal: one user-visible outcome, not an implementation task.
   - Acceptance Criteria: independent, testable `- [ ]` items.
   - Plan: ordered implementation steps; each step must support at least one criterion.
   - Verification: retain the standard checks and add feature-specific checks when needed.
   - Notes: constraints, dependencies, assumptions, exclusions, and unresolved questions.
   - History: preserve byte-for-byte; never add an entry during `load`.
5. Check `context/decisions.md`. Do not invent requirements. If a pending decision
   materially changes this feature's behavior or acceptance criteria, stop and
   ask the user to resolve it before finalizing the working file. Unrelated
   pending decisions do not block the feature.
6. Report the feature name, goal, acceptance criteria, and any unresolved blocker.

## Completion Gate

The action is complete only when the file has every required section, contains
no placeholder acceptance criteria or plan items, and the status is `Not Started`.
