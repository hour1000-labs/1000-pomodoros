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
4. Run the repository's actual scripts. The current baseline is:

   ```bash
   pnpm test
   pnpm build
   ```

5. Perform applicable feature-specific verification:
   - For UI changes, verify the affected flow in a real browser.
   - For responsive UI, check mobile and desktop viewports.
   - Inspect relevant browser and terminal output for errors.
   - For non-UI behavior, exercise the affected success and failure paths when feasible.
6. Update `## Verification` checkboxes only for checks that passed. Add a concise
   failure or skipped-check explanation under `## Notes`; do not delete or soften
   a failed requirement.
7. Update acceptance-criteria checkboxes only when the verification directly
   proves them. Leave final readiness to `review`.

## Output

Report commands and manual checks performed, their exact outcomes, tests added or
changed, failed or skipped checks, and the remaining unchecked items. Do not
claim percentage coverage unless a coverage tool was actually run.
