# Review Action

Review the feature against its documented contract. This action is read-only
except for evidence-backed updates to `context/current-feature.md`.

## Steps

1. Read `context/ai-interaction.md` and every section of
   `context/current-feature.md`.
2. Determine the feature branch base, then inspect all feature changes with Git.
   Include untracked files; do not assume `git diff` alone is complete.
3. Run `pnpm check` before reviewing. If this review follows remediation:
   - Inspect the remediation diff separately from the complete feature diff.
   - Confirm `## Notes` records the remediation class, impact rationale, checks
     rerun, and any earlier evidence being reused.
   - Validate the classification and required checks against the
     post-verification revalidation policy in `context/ai-interaction.md`.
   - Escalate uncertain remediation to the next higher-risk class.
   - Do not require unrelated checks to repeat when the remediation cannot
     affect their recorded evidence, but invalidate any evidence whose result
     could have changed.
4. Evaluate each acceptance criterion separately:
   - Cite the implementing file or observed behavior.
   - Change `- [ ]` to `- [x]` only when the criterion is fully satisfied.
   - Leave it unchecked when evidence is missing or the implementation is partial.
   - On a remediation review, reuse an earlier criterion finding only when its
     implementation and supporting evidence are unaffected.
5. Check for concrete bugs, regressions, accessibility problems, missing error
   handling, unrelated refactors, dependency changes, and scope creep.
6. Confirm every code change maps to an acceptance criterion or is strictly
   required to support one.
7. Do not mark verification items based on code inspection alone. Use evidence
   recorded by `test`, evidence explicitly shown to remain applicable after
   remediation, or checks you actually run during this action.
8. Set status to `Ready to Commit` only when:
   - every acceptance criterion is checked;
   - every applicable verification item is checked;
   - no blocking finding remains;
   - the implementation contains no unapproved scope expansion.
   - any remediation is classified and has the required revalidation evidence.
   Otherwise, keep status `In Progress`.

## Output

List findings first, ordered by severity and including file/line evidence. Then
show a criterion-by-criterion result. For remediation reviews, also report the
classification and which evidence was rerun or reused. Finish with exactly one
verdict: `Ready to Commit` or `Needs Changes`.
