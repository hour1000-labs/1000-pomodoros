# Complete Action

Complete and integrate a feature only after its documented gates pass. This
action performs consequential Git operations; obtain user confirmation before
commit, merge, push, branch deletion, or remote-branch deletion unless the user
explicitly requested those operations in the same task.

## Preconditions

- Read `context/ai-interaction.md` and `context/current-feature.md`.
- Status is `Ready to Commit`.
- Every acceptance criterion is checked.
- Every applicable verification item is checked.
- `review` has no blocking findings.
- The current branch is the documented feature branch, not `main`.
- `git status` has been inspected and unrelated user changes are excluded.

If any precondition fails, stop and report the exact unmet item. Do not bypass a
gate by editing a checkbox during this action.

## Steps

1. Summarize the files to be committed and request any required confirmation.
2. Stage only files belonging to the feature; never use broad staging when
   unrelated changes are present.
3. Commit with a descriptive message.
4. Integrate using the repository's requested workflow. Do not assume that local
   merge to `main` is preferred over a pull request.
5. After successful integration, append one entry to the end of `## History`:

   ```markdown
   ### YYYY-MM-DD — <feature name>

   - Branch: `codex/feature/<feature-name>`
   - Summary: <concise user-visible result>
   - Verification: <commands and manual checks that actually passed>
   ```

6. Reset the active portion of `current-feature.md` to the template:
   - H1 uses `<feature name>` placeholder.
   - One-sentence description returns to its instructional comment.
   - Status is `Not Started`.
   - Goal is empty except for its comment.
   - Acceptance Criteria and Plan use their placeholder items.
   - Verification restores the standard unchecked checklist.
   - Notes is empty except for its comment.
   - History retains all entries, including the new entry.
7. Commit the history/reset separately when the integration workflow requires it.
8. Push or delete branches only with explicit authorization, and report the exact
   branch and remote affected.

## Completion Gate

Report commit identifiers, integration result, push result, branch cleanup, and
the appended History entry. Distinguish actions completed from actions skipped or
awaiting approval.
