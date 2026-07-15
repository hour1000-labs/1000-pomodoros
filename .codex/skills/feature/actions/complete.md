# Complete Action

Complete and integrate a feature only after its documented gates pass. An
explicit `feature complete` request authorizes the standard local integration
sequence below: commit, merge to `main`, record/reset the feature, delete the
local feature branch, and push `main`. Obtain separate confirmation for a pull
request, force operation, remote-branch deletion, or other workflow variation.

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

1. Summarize the files to be committed. Preserve and exclude unrelated user
   changes throughout branch switches and commits.
2. Stage only files belonging to the feature; never use broad staging when
   unrelated changes are present.
3. Commit with a lowercase Conventional Commit message in `type: description`
   format. Choose the most specific applicable type:
   - `feat:` for new user-visible behavior.
   - `fix:` for a bug fix.
   - `refactor:` for behavior-preserving code restructuring.
   - `chore:` for tooling or project housekeeping.
   - `docs:`, `test:`, `perf:`, `build:`, or `ci:` when that is the primary
     scope.
   Never use an unprefixed subject such as `Add ...` or `Record ...`.
4. Switch to local `main` and merge the documented feature branch. Prefer a
   fast-forward merge and stop rather than forcing or rewriting history if it
   cannot fast-forward.
5. After the successful merge, append one entry to the end of `## History`:

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
7. Commit the history/reset separately on `main` with
   `docs: record <feature name> completion`.
8. Delete the merged local feature branch with the safe branch-delete operation.
9. Push `main` to its configured remote.
10. Delete a remote feature branch only when the user explicitly requests it;
    remote deletion is not part of the standard sequence.

The required standard order is:

```text
commit feature -> merge to main -> commit history/reset -> delete local branch -> push main
```

Do not delete the local feature branch until both feature commits are reachable
from local `main`. If the push fails, keep local `main` intact and report the
failure; the merged work remains recoverable from `main`.

## Completion Gate

Report commit identifiers, integration result, push result, branch cleanup, and
the appended History entry. Distinguish actions completed from actions skipped or
awaiting approval.
