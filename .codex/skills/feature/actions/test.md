# Test Action

Verify the feature using the requirements in `## Acceptance Criteria` and
`## Verification`. Never claim a check passed unless it was run or directly
observed in the current workflow.

## Steps

1. Read `context/ai-interaction.md`, `context/current-feature.md`, and the scripts
   in `package.json`.
2. Inspect changed logic and existing test conventions before writing tests.
3. Add or update focused Vitest tests when changed behavior is meaningfully
   testable. Cover important success, failure, and boundary cases. Do not add
   low-value tests merely to increase test count, and do not restrict testing to
   server actions or utilities when other behavior warrants coverage.
4. For initial feature verification, run the repository's actual baseline
   scripts:

   ```bash
   pnpm check
   pnpm test
   pnpm build
   ```

5. If files changed after verification evidence was recorded, including after a
   failed test or review, inspect the remediation diff and use the
   post-verification revalidation policy in `context/ai-interaction.md`:
   - Classify the remediation as documentation-only, proven non-semantic,
     localized behavioral, or broad/high-risk based on potential impact.
   - Run `pnpm check` and `git diff --check` for every class.
   - Run the additional targeted or full checks required by that class.
   - When uncertain, use the next higher-risk class.
   - Record the class, rationale, checks rerun, and reused evidence under
     `## Notes`.
   - Do not automatically invalidate evidence that the remediation cannot
     affect. Uncheck and rerun every item whose result could have changed.
6. Perform applicable feature-specific verification:
   - For UI changes, verify the affected flow in a real browser.
   - For responsive UI, check mobile and desktop viewports.
   - Inspect relevant browser and terminal output for errors.
   - For non-UI behavior, exercise the affected success and failure paths when feasible.
7. Update `## Verification` checkboxes only for checks that passed or for
   previously recorded evidence shown to remain applicable. Add a concise
   failure or skipped-check explanation under `## Notes`; do not delete or soften
   a failed requirement.
8. Update acceptance-criteria checkboxes only when the verification directly
   proves them. Leave final readiness to `review`.

## Output

Report commands and manual checks performed, their exact outcomes, tests added or
changed, the remediation class and evidence-reuse rationale when applicable,
failed or skipped checks, and the remaining unchecked items. Do not claim
percentage coverage unless a coverage tool was actually run.
