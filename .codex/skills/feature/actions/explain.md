# Explain Action

Explain the implementation in terms of the documented goal and acceptance
criteria. This action is read-only.

## Steps

1. Read `context/current-feature.md` and identify the feature branch base.
2. Inspect tracked and untracked feature files. Do not assume
   `git diff main --name-only` captures the full change set.
3. Exclude unrelated pre-existing changes and explicitly note any file whose
   ownership is uncertain.
4. For each feature file, state:
   - whether it is new, modified, or deleted;
   - what changed and why;
   - which acceptance criterion it supports;
   - any important data flow, component boundary, or framework pattern.
5. End with the overall control/data flow and note any incomplete criteria or
   verification gaps. Do not present intended behavior as verified behavior.

## Output Format

## Files Changed

**path/to/file.ts** (new) — Acceptance criterion: `<criterion>`

Brief explanation of what this file does and why it was added.

**path/to/other.ts** (modified) — Acceptance criterion: `<criterion>`

What changed and why.

## How It All Connects

Brief summary of the data/control flow between these files.

## Remaining Gaps

- Unchecked criteria, skipped verification, or `None`.
