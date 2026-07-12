---
name: feature
description: Manage current feature workflow - start, review, test, explain, or complete
argument-hint: load|start|review|test|explain|complete
---

# Feature Workflow

Manage one feature or fix from definition through completion. Follow
`@context/ai-interaction.md` throughout the workflow: keep scope small, map every
code change to an acceptance criterion, preserve existing patterns, and report
only verification that was actually performed.

## Working File

@context/current-feature.md

### Required Structure

Keep every section in this order:

1. `# Current Feature: <feature name>`
2. One-sentence description
3. `## Status` — `Not Started`, `In Progress`, or `Ready to Commit`
4. `## Goal` — user-visible outcome
5. `## Acceptance Criteria` — testable checklist defining scope
6. `## Plan` — ordered implementation steps
7. `## Verification` — evidence checklist
8. `## Notes` — decisions, blockers, scope changes, and follow-up work
9. `## History` — append-only completed-feature entries, earliest to latest

Do not rename, reorder, or remove these sections. Preserve instructional HTML
comments when resetting the file. Never mark a checkbox complete without current
evidence. The literal H1 `# Current Feature: <feature name>` is the empty-state
sentinel and does not represent an active feature.

## Task

Execute the requested action: $ARGUMENTS

| Action     | Description                                               |
| ---------- | --------------------------------------------------------- |
| `load`     | Convert a spec or description into the working-file format |
| `start`    | Validate scope, create a branch, and begin implementation   |
| `review`   | Compare the implementation with every acceptance criterion |
| `test`     | Run relevant verification and record evidence               |
| `explain`  | Explain changed files and how they satisfy the feature       |
| `complete` | Commit and integrate only after all completion gates pass    |

See [actions/](actions/) for detailed instructions.

Before running an action, read its file in `actions/`. If no action is provided,
list the available actions and the state in which each one should be used.
