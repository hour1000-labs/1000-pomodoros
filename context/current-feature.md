# Current Feature: Product Logo and Search Identity

<!-- One-sentence description of the feature or fix -->

Use the supplied `public/logo.png` as the product's canonical artwork across the shared wordmark, browser and install icons, and accurate search and social metadata while removing the scaffold placeholders.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

<!-- User-visible outcome of the feature -->

People consistently recognize 1000 Pomodoros in the app, browser and installed-app surfaces, and link or search previews, while crawlers receive an accurate, useful representation of the public landing page.

## Acceptance Criteria

<!-- Checklist of testable outcomes -->

- [x] `public/logo.png` remains the canonical supplied artwork, and any smaller icon, wordmark, or social-preview files are optimized derivatives of it rather than redrawn or unrelated branding.
- [x] Every existing `BrandMark` surface displays the tomato logo immediately to the left of `1000 Pomodoros`, with restrained sizing, alignment, and spacing that remain clear without crowding or overflow from 320px through desktop layouts.
- [x] The wordmark logo has explicit rendered dimensions and is decorative, so it does not cause layout shift or duplicate announcements and linked brand marks retain the accessible name `1000 Pomodoros`.
- [x] Branded favicon and Apple touch icon links are emitted from the TanStack root head, load successfully in local development and beneath the `/1000-pomodoros/` deployment base path, and use stable, square, recognizable logo-derived assets.
- [x] The web app manifest is linked from the document head and identifies `1000 Pomodoros` with accurate description, start URL, scope, display mode, theme/background colors, and install icons whose URLs and purposes work under the configured base path.
- [x] The React/TanStack starter images `public/favicon.ico`, `public/logo192.png`, and `public/logo512.png` are removed, and no tracked source, public manifest, or production artifact retains their references or the placeholder names `TanStack App` and `Create TanStack App Sample`.
- [x] The public landing page uses the exact title `1000 Pomodoros — Visual Progress Tracker` and description `Track focused work, one pomodoro at a time.`, plus application name, canonical URL, theme color, and complete Open Graph and Twitter summary metadata.
- [x] Search and social metadata use absolute canonical/share URLs for the current public Pages site, declare the social image's dimensions and descriptive alt text, and render deployment-base-aware favicon, manifest, and local asset links without host-root 404 requests.
- [x] A 1200 × 630 social preview uses the supplied logo and the existing Ink, Paper, and Pomodoro Red visual language to communicate the truthful `1,000 pomodoros` product goal at thumbnail size, without gradients, fabricated user progress, or more than 12 words beyond the numeric label.
- [x] The prerendered landing-page HTML contains its meaningful headline and product explanation rather than only a loading skeleton, while hydration remains stable and people with saved Journeys still redirect from `/` to `/home` as before.
- [x] `/` is the canonical indexable route and is the only URL listed in the sitemap; local-state, onboarding, focus, settings, sample, Journey, and milestone routes emit `noindex, follow` and do not compete with the public landing page in search results.
- [x] `robots.txt` continues to allow the public site to be crawled and advertises the absolute sitemap URL; the generated Pages-style output confirms that the sitemap and landing URL resolve under the configured deployment base path before publication.
- [x] Existing focus-timer document titles, saved-data names and compatibility identifiers, wordmark destinations, and intentional rules about where application branding is visible remain unchanged.

## Plan

<!-- Implementation steps -->

1. Establish shared, base-path-safe site and asset URL values for TanStack head metadata, using the live GitHub Pages project URL as the current canonical origin and path.
2. Preserve `public/logo.png`, create only the optimized logo-derived sizes and 1200 × 630 social preview required by the documented surfaces, remove the three React placeholder images, and replace the manifest's scaffold content.
3. Add the decorative logo to the shared `BrandMark` component with explicit dimensions and responsive spacing so every existing wordmark consumer receives the same identity without semantic or navigation changes.
4. Extend the root and index route head definitions with favicon, Apple touch icon, manifest, canonical, robots, Open Graph, Twitter, title, description, and theme metadata while keeping all asset URLs correct for both `/` and the GitHub Pages base path.
5. Add the sitemap and crawl directives, make the prerendered landing page expose meaningful marketing content, and retain the post-hydration redirect for existing saved users.
6. Add focused tests for wordmark semantics, metadata contents, indexability policy, prerendered landing behavior, manifest values, placeholder removal, and base-path-safe production output.
7. Run the full repository checks and inspect the built HTML, assets, accessibility tree, browser network requests, and representative mobile and desktop brand surfaces.

## Verification

- [x] `pnpm check` passes
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `VITE_BASE_PATH=/1000-pomodoros/ pnpm build` passes and built HTML/assets use the deployment base path
- [x] `git diff --check` passes
- [x] Focused tests cover `BrandMark` semantics, route-head metadata, and public install/crawl asset contracts; prerender/redirect behavior is covered by built HTML and browser evidence
- [x] Built output contains the expected title, description, canonical, robots, favicon, manifest, Open Graph, Twitter, and sitemap values
- [x] Built output and tracked sources contain no removed placeholder files, names, or references
- [x] Landing, sample, desktop app navigation, focus, completion, onboarding, and milestone wordmarks are spot-checked in a real browser where their existing state makes them applicable
- [x] The logo is verified at 320px and desktop widths for alignment, overflow, layout stability, and unchanged wordmark/link accessibility names
- [x] Favicon, touch icon, manifest icons, social preview, and sitemap return successful responses under the Pages-style base path with no unintended host-root asset requests
- [x] Prerendered `/` contains meaningful landing copy, local-state routes expose `noindex, follow`, and an existing saved user still redirects from `/` to `/home`
- [x] No relevant browser console errors or warnings occur

## Notes

<!-- Decisions, blockers, and scope changes -->

- The user supplied the untracked 1024 × 1024 RGBA `public/logo.png`; it remains the source artwork, now tightly cropped and resampled at 1024 × 1024 so the tomato fills the square canvas. Optimized derivatives use that same edge-to-edge artwork.
- The current canonical URL is `https://hour1000-labs.github.io/1000-pomodoros/`, which is documented in the repository and returned HTTP 200 during loading on 2026-08-09. If a custom production domain is chosen later, canonical, Open Graph, sitemap, and robots URLs must be updated together.
- The shared `BrandMark` already owns all sensible visible wordmark locations: landing, onboarding, desktop app navigation, sample navigation, focus, completion, and milestone screens. This feature does not add branding to intentionally hidden mobile navigation or unrelated body content.
- The logo beside `1000 Pomodoros` is decorative (`alt=""`) because the adjacent text already supplies the accessible name. Existing link destinations and the exact accessible name remain unchanged.
- Replace the manifest rather than deleting install metadata. `public/robots.txt` is generic but valid infrastructure, not a visual placeholder; update it only for the sitemap directive.
- The default social preview will use the truthful 1,000-pomodoro product target rather than simulated personal achievements. It must follow `context/DESIGN.md`'s 1200 × 630, three-color, no-gradient share-card contract while incorporating the supplied logo.
- `WebSite` site-name rich-result markup is excluded because Google does not support site names for a project deployed below a hostname subdirectory. `SoftwareApplication` rich-result markup is excluded because its rating/review requirements cannot be met without fabricating evidence. These exclusions do not prevent ordinary title, description, canonical, favicon, Open Graph, Twitter, or sitemap support.
- This feature does not rename `1000 Pomodoros`, change focus-timer title behavior, alter persistence/export identifiers, add analytics or Search Console integration, introduce dependencies, or redesign the surrounding layouts.
- No pending decision in `context/decisions.md` blocks the loaded scope. The current product name and live Pages URL are treated as the active public identity for this feature.
- Preserve unrelated untracked `.playwright-cli/` and `.playwright-mcp/` artifacts.
- Initial `pnpm check` found only formatter/import-order issues in the new head and test files; localized formatter-equivalent fixes were applied and `pnpm check` passed on rerun. No runtime behavior changed in that remediation.
- Verification evidence: `pnpm check`, `pnpm exec tsc --noEmit`, focused logo/site tests (2 files, 5 tests), `pnpm test` (30 files, 328 tests), default `pnpm build` (12 prerendered pages), Pages-base `VITE_BASE_PATH=/1000-pomodoros/ pnpm build` (17 prerendered paths), and `git diff --check` passed. Vitest emitted its existing jsdom `window.scrollTo()` not-implemented notices but no test failed.
- Browser evidence: landing at 1280×800 and 320×568, sample and onboarding/app-navigation states, exact `1000 Pomodoros` linked accessible name, decorative logo attributes, no horizontal overflow, correct title/head metadata, saved-user `/` → `/home` redirect, and zero browser console errors or warnings passed. A Pages-style static fixture returned HTTP 200 for every branded icon, logo, social image, manifest, robots, and sitemap asset under `/1000-pomodoros/`.
- Feature test rerun on 2026-08-09: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (30 files, 328 tests), default `pnpm build` (12 prerendered pages), `VITE_BASE_PATH=/1000-pomodoros/ pnpm build` (17 prerendered paths), and `git diff --check` passed. Direct browser spot-checks for focus setup, completion, onboarding, and milestone fallback confirmed the shared `/brand-mark.png` image, decorative semantics, explicit 32×32 dimensions, no horizontal overflow, and zero console errors or warnings.
- Review evidence correction: the focused tests now directly cover `BrandMark` semantics, route-head metadata, and install/crawl asset contracts; prerender/redirect behavior and base-path output remain verified through built HTML, asset audits, and browser checks.
- User-requested asset remediation on 2026-08-09: the supplied logo was tightly cropped to a square tomato mark, preserved at 1024 × 1024, and regenerated into the 96, 64, 180, 192, and 512 pixel square assets. An alpha-bound audit confirmed every square asset reaches all four canvas edges; the 1200 × 630 social card remains intentionally rectangular.
- Follow-up asset correction: the first edge-to-edge crop clipped the tomato outline horizontally, so the square source was regenerated from the complete tomato bounds with a non-clipping fit; all square assets now retain the full left and right outline while still touching the canvas edges.
- Remediation classification: localized visual asset change with shared BrandMark impact. Focused tests, `pnpm check`, the production build, base-path build, and browser logo/overflow checks were rerun after regeneration; prior unaffected persistence and full-suite evidence remains valid.
- The first post-remediation base-path build hit a temporary prerender fetch timeout against its local server; an immediate rerun completed successfully with 17 prerendered paths.
- The post-remediation Pages-style fixture audit returned HTTP 200 for the regenerated square assets, social image, manifest, robots, and sitemap beneath `/1000-pomodoros/`.
- The generated Pages-style output and static fixture provide the pre-publication robots/sitemap evidence required by criterion 12. The live GitHub Pages URL remains an explicit post-publication smoke check because the deployment workflow runs from `main`, which this completion action publishes.

## History

<!--
Append completed work from earliest to latest using this format:

### YYYY-MM-DD — <feature name>

- Branch: `codex/feature/<feature-name>`
- Summary: ...
- Verification: ...
-->

### 2026-07-12 — MVP UI Foundation

- Branch: `codex/feature/mvp-ui-foundation`
- Summary: Added the responsive MVP layouts and routes, shared design system and components, typed Journey data, session-derived progress, and recoverable SSR-safe local persistence.
- Verification: `pnpm exec tsc --noEmit`, `pnpm test` (4 files, 27 tests), `pnpm build` (client and SSR), `git diff --check`, and Playwright checks for routes, persistence recovery, mobile/desktop layouts, accessibility, and progress boundaries passed.

### 2026-07-12 — Landing Page

- Branch: `codex/feature/landing-page`
- Summary: Added the polished responsive public landing page with exact product copy, onboarding actions, an accessible seeded Journey demonstration, full-width benefits band, and closing statement.
- Verification: `pnpm test` (5 files, 29 tests), `pnpm build` (client and SSR), `git diff --check`, and browser checks for CTA navigation, console output, semantic structure, focus and touch targets, reduced motion, 320px/mobile, tablet, desktop, 200% zoom, full-width Ink treatment, and unclipped progress passed.

### 2026-07-13 — Create Journey Onboarding

- Branch: `codex/feature/create-journey-onboarding`
- Summary: Added the responsive first onboarding step with Journey-name validation, draft persistence and restoration, suggestion controls, loss-aware Exit behavior, and WCAG AA-compliant visual treatment.
- Verification: `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, and headed-browser checks for validation boundaries, persistence, routing, focus, confirmation, 320px/desktop/200% layouts, touch targets, WCAG contrast, and console output passed.

### 2026-07-14 — Feature-First Source Organization

- Branch: `codex/chore/feature-first-source-organization`
- Summary: Reorganized existing screens, tests, and composed components into cohesive landing, onboarding, journeys, focus, and milestones modules while preserving routes, behavior, persisted state, and visual results.
- Verification: `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, and Playwright checks across every route, persistence success/empty/recovery states, mobile and desktop layouts, and console output passed.

### 2026-07-14 — Adopt Biome Code Quality Tooling

- Branch: `codex/chore/adopt-biome`
- Summary: Installed pinned Biome tooling, standardized formatting and linting across the repository, added warning-strict quality scripts and editor integration, and documented the convention for future work.
- Verification: `pnpm check` (78 files), `pnpm exec tsc --noEmit`, `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, generated-route integrity, and headed Playwright checks at 1280x800 and 320x800 with no console errors or warnings passed.

### 2026-07-14 — Auto-sort Tailwind classes with Biome

- Branch: `codex/chore/auto-sort-tailwind-classes-with-biome`
- Summary: Enabled automatic Tailwind class sorting through the existing Biome fix-on-save workflow and normalized existing class strings without adding another formatter.
- Verification: `pnpm check` (78 files), `pnpm test` (6 files, 34 tests), `pnpm build` (client and SSR), `git diff --check`, a 108-string token-preservation audit, and headed Playwright checks at 1280x800 and 320x800 with no console errors or warnings passed.

### 2026-07-14 — Add Motivation Onboarding

- Branch: `codex/feature/add-motivation-onboarding`
- Summary: Added the optional motivation onboarding step with Journey context, reason persistence and restoration, Continue, Skip, and Back navigation, responsive mobile layouts, and accessible interaction states.
- Verification: `pnpm check` (80 files), `pnpm test` (7 files, 40 tests), `pnpm build` (client and SSR), `git diff --check`, and headed-browser checks for navigation, persistence, redirect, character boundaries, accessibility, mobile, desktop, 200% zoom, maximum-content overflow, and console output passed.

### 2026-07-14 — Risk-based feature revalidation policy

- Branch: `codex/chore/risk-based-feature-revalidation-policy`
- Summary: Added proportional post-verification revalidation rules with universal cheap gates, risk-based targeted checks, evidence reuse, and incremental remediation review guidance.
- Verification: Initial `pnpm check` (80 files), `pnpm test` (7 files, 40 tests), `pnpm build` (client and SSR), and `git diff --check` passed; documentation-only remediations passed repeated `pnpm check`, `git diff --check`, and focused cross-document contract audits.

### 2026-07-15 — Choose Target Onboarding

- Branch: `codex/feature/choose-target-onboarding`
- Summary: Added the responsive third onboarding step with accessible preset and custom focused-time targets, pomodoro conversions, validation, draft persistence, and forward/back navigation.
- Verification: `pnpm check` (82 files), `pnpm test` (8 files, 45 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for navigation, persistence, keyboard and screen-reader semantics, validation boundaries, responsive layouts from 320px through desktop, 200% zoom, maximum-content overflow, and console output passed.

### 2026-07-15 — Add Next Step Onboarding

- Branch: `codex/feature/add-next-step-onboarding`
- Summary: Added the final onboarding step with actionable Next step validation, atomic Journey and 10-pomodoro milestone creation, idempotent submission, draft-safe Back navigation, and a direct handoff into focus setup.
- Verification: `pnpm check` (84 files), `pnpm test` (9 files, 52 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for the full onboarding-to-focus flow, validation, persistence, repeated submission, keyboard and screen-reader semantics, responsive layouts from 320px through desktop, 200% zoom, maximum-content overflow, touch targets, and console output passed.

### 2026-07-15 — UI Polish and pnpm 11 Cleanup

- Branch: `codex/fix/remove-duplicate-next-step-guidance`
- Summary: Removed repeated Next step guidance, added pointer feedback to shared clickable buttons, and migrated the dependency build allowlist to pnpm 11 settings.
- Verification: `pnpm install --frozen-lockfile`, `pnpm check` (84 files), `pnpm test` (9 files, 52 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks at desktop and 320×568 mobile widths for single guidance rendering, pointer cursors, layout overflow, and console output passed.

### 2026-07-15 — Timer Setup

- Branch: `codex/feature/timer-setup`
- Summary: Added the responsive `/focus` setup flow with Journey and Next step selection, validated durations, persisted duplicate-safe session creation, and running or paused session restoration.
- Verification: `pnpm check` (85 files), `pnpm test` (10 files, 62 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks at 1280×800, 320×568 including Custom 240, and a 640×400 200%-zoom equivalent for selection, redirect, validation, accessibility, duplicate activation, persistence, restoration, responsive fit, and console output passed.

### 2026-07-15 — Running Focus Timer

- Branch: `codex/feature/running-focus-timer`
- Summary: Added a distraction-free, persisted running countdown with timestamp-based drift recovery, atomic Pause and natural completion, leave protection, fullscreen controls, and concise assistive announcements.
- Verification: `pnpm check` (87 files), `pnpm test` (11 files, 76 tests), `pnpm build` (client and SSR), focused remediation tests (18 tests), `git diff --check`, and headed production-browser checks for reload and background recovery, Pause persistence, leave and return, fullscreen, completion idempotence, reduced motion, accessibility, 320px mobile, desktop, 200% zoom, maximum-length content, and console output passed.

### 2026-07-15 — Paused Focus Timer

- Branch: `codex/feature/paused-focus-timer`
- Summary: Added a responsive persisted paused timer with Resume, eligible Finish early, confirmed cancellation, accessible feedback and focus handoff, failure recovery, and duplicate-safe progress handling.
- Verification: `pnpm check` (87 files), `pnpm test` (11 files, 89 tests), `pnpm build` (client and SSR), `git diff --check`, and headed production-browser checks for reload restoration, Resume, eligible and ineligible Finish early, dismissed and confirmed cancellation, persistence failures, accessibility, 320px mobile, desktop, 200% zoom, maximum-length content, and console output passed.

### 2026-07-16 — Session Complete

- Branch: `codex/feature/session-complete`
- Summary: Added a refresh-safe completion experience with exact session credit, milestone awards, visible newly earned progress, optional reflection, and contextual progress or restart actions.
- Verification: `pnpm check` (88 files), `pnpm test` (12 files, 99 tests), focused remediation tests (1 file, 9 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for completion paths, refresh safety, attribution boundaries, actions, reflection, responsive layouts, accessibility, reduced motion, and console output passed.

### 2026-07-18 — Journey Detail

- Branch: `codex/feature/journey-detail`
- Summary: Added the responsive Journey progress experience with inspectable Pomodoro sections, milestone context, scoped focus handoff, lightweight Next-step management, recent sessions, and resilient empty and persistence states.
- Verification: `pnpm check` (97 files), `pnpm exec tsc --noEmit`, `pnpm test` (14 files, 129 tests), `pnpm build` (client and SSR), `git diff --check`, and live-browser checks from 320px through desktop plus a 200%-zoom equivalent for progress inspection, progressive full-Journey rendering, Next-step flows, focus handoff, responsive layout, accessibility, contrast, reduced motion, persistence states, and console output passed.

### 2026-07-25 — Home Screen

- Branch: `codex/feature/home-screen`
- Summary: Added a returning-user Home screen with onboarding and landing redirects, next-action-first focus handoff, session-derived Today and weekly progress, Active Journeys, recent sessions, responsive accessibility, and local-midnight refresh.
- Verification: `pnpm check` (104 files), `pnpm exec tsc --noEmit`, `pnpm test` (17 files, 150 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks for onboarding and landing redirects, seeded, empty, and maximum-content states, focus and navigation behavior, 320px mobile, desktop, a 200%-zoom equivalent, midnight rollover, contrast, touch targets, overflow, and console output passed.

### 2026-08-01 — Milestone Reached

- Branch: `codex/feature/milestone-reached`
- Summary: Added an earned-only milestone record built from persisted progress, with a responsive completed PomodoroGrid section, next-milestone guidance, non-celebratory fallback states, and a direct return to the related Journey.
- Verification: `pnpm check` (107 files), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 162 tests), focused remediation tests (2 files, 12 tests), `pnpm build` (client and SSR), `git diff --check`, and live-browser checks from 320px through desktop plus a 200%-zoom equivalent for earned, missing, unearned, and recoverable-error states, persisted values, grid and navigation behavior, maximum-content overflow, accessibility, contrast, reduced motion, and console output passed.

### 2026-08-05 — Simple Minimal App Redesign

- Branch: `codex/feature/simple-minimal-app-redesign`
- Summary: Simplified every implemented user-facing screen around one clear action, concise product language, a quieter Ink/Paper/Pomodoro Red system, and shared tomato-shaped Pomodoro progress units with left-to-right partial fill.
- Verification: `pnpm check` (108 files), `pnpm exec tsc --noEmit`, `pnpm test` (19 files, 169 tests), focused recovery and confirmation tests (2 files, 4 tests), `pnpm build` (client and SSR), `git diff --check`, and production-browser checks across all ten routes at 320×568, 375×812, 1280×800, and a 640×400 200%-zoom equivalent for complete flows, tomato states, persistence recovery, accessibility, contrast, reduced motion, responsive behavior, and console output passed.

### 2026-08-05 — Optional Sample Journey

- Branch: `codex/feature/optional-sample-journey`
- Summary: Starts new users with empty persisted data and adds a non-persisted, read-only Learn guitar sample Journey with brand-only navigation and explicit landing-page access.
- Verification: `pnpm check`, `pnpm test` (21 files, 173 tests), `pnpm build` (client and SSR), `git diff --check`, and browser checks for empty landing, sample exploration/reload/non-persistence, sample return navigation, full real-Journey onboarding creation, normal Journey navigation, responsive layouts, and no console errors or warnings passed.

### 2026-08-05 — Remove onboarding tomato previews

- Branch: `codex/feature/remove-onboarding-tomato-previews`
- Summary: Removed the static tomato progress previews from all four onboarding screens and recentered the setup forms while preserving intentional progress visuals in the sample Journey and other product screens.
- Verification: `pnpm check`, `pnpm test` (21 files, 173 tests), `pnpm build`, `git diff --check`, and browser checks at 1280×800 and 320×568 for the complete onboarding flow, zero onboarding tomato previews, no horizontal overflow or console errors, and preserved sample Journey tomato units passed.

### 2026-08-06 — Add New Journey

- Branch: `codex/feature/add-new-journey`
- Summary: Added an Add Journey action to Home that starts a fresh, reusable onboarding flow for additional Journeys while preserving existing Journeys and records.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test` (21 files, 176 tests), `pnpm build` (client and SSR), `git diff --check`, and browser checks at 1280×800, 640×400, and 320×568 with no overflow or console errors/warnings passed.

### 2026-08-06 — GitHub Pages Preview Deployment

- Branch: `codex/feature/github-pages-preview-deployment`
- Summary: Added an automated GitHub Pages preview workflow with static TanStack Start prerendering, project-path-aware assets and routing, client-side fallback handling, and repository setup instructions.
- Verification: `pnpm check`, `pnpm test` (21 files, 176 tests), `pnpm build`, project-path artifact inspection, workflow YAML parsing, `git diff --check`, and Pages-path browser checks at 1280×800 and 320×568 with client navigation and no console errors passed.

### 2026-08-06 — Import and export saved progress

- Branch: `codex/feature/import-export-saved-progress`
- Summary: Added versioned Settings backups for exporting and restoring saved Journeys and progress, plus an immediate top-right import path for Journey-free landing pages without an export action or replacement warning.
- Verification: `pnpm check` (115 files), `pnpm test` (22 files, 184 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and real-browser checks at desktop and 320×568 for landing import, Settings confirmation, responsive fit, restored navigation, and console output passed.

### 2026-08-06 — Add missed pomodoro entries

- Branch: `codex/feature/add-missed-pomodoro-entries`
- Summary: Added accessible manual missed-session recording from tomato details with date, Next step, focused minutes, persisted manual labels, same-date contributors, and 25-minute tomato progress allocation.
- Verification: `pnpm check`, `pnpm test` (23 files, 189 tests), `pnpm build` (SSR and prerendering), `git diff --check`, and desktop/320×568 browser checks for validation, persistence, multi-tomato progress, focus return, responsive layering, and browser console output passed.

### 2026-08-06 — Keep Session Complete heading words intact

- Branch: `codex/fix/session-complete-heading-wrap`
- Summary: Prevented the Session Complete heading from splitting the final “s” of “pomodoros” onto a separate line at narrow widths.
- Verification: `pnpm check`, `pnpm test` (23 files, 189 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and browser checks at 320×568 and 1280×800 with no document overflow or console errors/warnings passed.

### 2026-08-07 — Redesign Landing Page

- Branch: `codex/feature/redesign-landing-page`
- Summary: Redesigned the public landing page into a visually stunning, high-contrast, product-first experience with dynamic product previews, 3-step explanation section, and clear onboarding CTAs.
- Verification: `pnpm check`, `pnpm test` (23 files, 189 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, keyboard accessibility, WCAG AA contrast, reduced motion, 320px–1200px+ responsive layouts, and 200% zoom checks passed.

### 2026-08-07 — Realistic Loading Skeletons

- Branch: `codex/feature/realistic-loading-skeletons`
- Summary: Replaced generic loading fallback blocks with realistic, layout-matched skeleton components across Home, Journey Detail, Milestone Detail, Focus Setup, Session Complete, Onboarding, Settings, and Landing Page.
- Verification: `pnpm check`, `pnpm test` (24 files, 200 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and visual skeleton layout alignment checks passed.

### 2026-08-07 — Delete Journey from Settings

- Branch: `codex/feature/delete-journey-from-settings`
- Summary: Added safe, permanent Journey deletion from Settings with confirmation dialogs, cascade cleanup of owned records, pointer and goal repair, accessible status feedback, and empty state support.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` (11 pages prerendered), `git diff --check`, 39 repository tests, and 9 Settings interaction tests passed.

### 2026-08-07 — Explicit Journey Deletion Guard in Settings

- Branch: `codex/feature/explicit-journey-deletion-guard`
- Summary: Moved the Manage Journeys section below Saved Data in Settings and added a DeleteJourneyDialog requiring the user to type the exact Journey name before enabling permanent deletion.
- Verification: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build` (11 pages prerendered), and `git diff --check` passed.

### 2026-08-08 — Diagnose and Fix Settings Test Hang

- Branch: `codex/fix/diagnose-and-fix-settings-test-hang`
- Summary: Fixed the Settings test harness document root so the suite completes reliably, and kept Journey deletion recoverable with accessible feedback when persistence fails.
- Verification: `pnpm check` (118 files), `pnpm test` (24 files, 215 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, focused Settings tests (11 tests), and live browser checks at 1280×800 and 320×568 passed with zero console errors or warnings.

### 2026-08-08 — Consistent Focused Duration Formatting

- Branch: `codex/feature/consistent-focused-duration-formatting`
- Summary: Standardized focused-time displays across the app with natural singular and plural units, floored seconds, omitted zero-valued segments, and compact hour-aware formatting.
- Verification: `pnpm check` (120 files), `pnpm test` (25 files, 231 tests), `pnpm build` (client, SSR, and 11 prerendered pages), `git diff --check`, and browser checks at 320×568 and 1280×800 for seconds-only, exact-hour, hour-plus-seconds, multi-hour, responsive overflow, and console output passed.

### 2026-08-08 — Browse All Journeys

- Branch: `codex/feature/browse-all-journeys`
- Summary: Kept Home focused on two recent active Journeys and added a dedicated collection for every saved Journey with status-safe actions, clear navigation, empty recovery, and accessible summaries.
- Verification: `pnpm check` (125 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 249 tests), focused remediation tests (2 files, 15 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and production-browser checks for complete collection states, keyboard access, responsive layouts, overflow, current navigation, safe inactive actions, accessible descriptions, and console output passed.

### 2026-08-09 — Manage and Reorder Next Steps

- Branch: `codex/feature/manage-and-reorder-next-steps`
- Summary: Added flexible Upcoming-step management with fluid mouse, touch, and keyboard reordering; explicit current-step promotion; completion and history-safe deletion; active-session blockers; deterministic focus and announcements; and a valid empty-queue state.
- Verification: `pnpm check` (128 files), `pnpm exec tsc --noEmit`, `pnpm test` (27 files, 316 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and production-browser checks at desktop, 320×800, and 640×400 for ordering, persistence, focus, announcements, dialogs, maximum-length content, responsive overflow, and console output passed.

### 2026-08-09 — Timer Tab Countdown and Completion Sound

- Branch: `codex/feature/timer-tab-countdown-and-completion-sound`
- Summary: Added timestamp-synced `/focus` tab countdown titles, accessible running and paused mute controls, and a brief guarded Web Audio completion chime for successful natural timer completion.
- Verification: `pnpm check`, `pnpm test` (28 files, 323 tests), `pnpm build` (client, SSR, and 12 prerendered pages), `git diff --check`, and browser checks for title lifecycle, responsive layouts, keyboard focus, 44-by-44 control sizing, muted and unmuted completion paths, and zero browser console errors/warnings passed. Real Chromium created one audio context for unmuted completion and none for same-visit muted completion; the user accepted this browser audio-graph evidence as sufficient.
