# Current Feature: Landing Page

Build the public landing page that demonstrates the product visually and guides new users into creating their first Journey.

## Status

<!-- Not Started | In Progress | Ready to Commit -->

Ready to Commit

## Goal

New visitors can understand how focused sessions become visible progress and start their first Journey from a polished, responsive landing page.

## Acceptance Criteria

<!-- The feature is done when every applicable item is checked. -->

- [x] `/` uses the shared public-page layout and a simple header containing the 1000 Pomodoros wordmark plus one “Start your first journey” action.
- [x] The hero uses the exact headline “Turn focused work into visible progress.”, the specified supporting sentence, one primary “Start your first journey” CTA to `/onboarding/journey`, and a descriptive “See how it works” link to the product demonstration.
- [x] The product demonstration appears before explanatory feature copy and accessibly presents the seeded “Learn guitar” Journey, its Next step, a 25-minute timer, a growing pomodoro grid, and milestone progress.
- [x] The explanatory section contains no more than the four specified benefits: know what to work on next, stay consistent, see effort accumulate, and build meaningful skills.
- [x] The page ends with “What will your next 1,000 pomodoros make possible?” and does not add testimonials, user counts, ratings, pricing, popularity claims, or other fabricated social proof.
- [x] The composition follows `context/screenshots/landing-page-ui.png` and `context/DESIGN.md`, using only Ink, Paper, and Pomodoro Red, with red reserved for the single primary action and earned progress.
- [x] The layout stacks cleanly from 320px upward, uses a two-column hero when space allows, keeps the primary CTA and product preview within the first mobile viewport, and remains usable at desktop widths and 200% zoom.
- [x] The page has semantic heading order, descriptive links, accessible labels for the product preview, visible keyboard focus, 44px touch targets, and reduced-motion behavior.

## Plan

1. Inspect the existing public layout, landing foundation screen, shared components, mock data, and screenshot composition; load applicable local frontend guidance before editing.
2. Rebuild the landing header and hero to match the specified copy, actions, hierarchy, and responsive screenshot composition using the established design tokens.
3. Implement the accessible product demonstration from shared mock data and reusable progress components, then connect the in-page “See how it works” anchor.
4. Add the four-benefit section and final emotional footer line without introducing out-of-scope marketing content.
5. Add focused tests for landing-page semantics, links, exact copy, and product-preview accessibility where practical.
6. Verify tests, production build, browser console, keyboard behavior, reduced motion, screenshot fidelity, 320px/mobile, desktop, 200% zoom, and first-mobile-viewport content ordering.

## Verification

- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] Affected UI verified in the browser, if applicable
- [x] Mobile and desktop verified, if responsive UI changed
- [x] No relevant console errors
- [x] Exact landing-page copy, CTA destinations, and “See how it works” anchor verified
- [x] Product demonstration content and accessible labels verified against shared mock data
- [x] 320px width, common mobile height, desktop width, and 200% zoom verified
- [x] Keyboard focus, 44px touch targets, semantic headings, and reduced motion verified
- [x] Visual composition compared with `context/screenshots/landing-page-ui.png`

## Notes

<!-- Record important decisions, blockers, scope changes, or follow-up work. -->

- Source: `context/features/landing-page-spec.md`.
- Visual reference: `context/screenshots/landing-page-ui.png`; use it for hierarchy, composition, spacing, contrast, product-preview treatment, benefits section, and closing statement.
- Written requirements and shared mock data take precedence where screenshot content differs: the product demonstration uses the seeded “Learn guitar” Journey, and the header includes the specified CTA.
- Reuse the MVP foundation’s public layout, design tokens, shared components, and `src/lib/mock-data.ts`; do not introduce a second design system or duplicate product data.
- Out of scope: testimonials, user counts, ratings, pricing, popularity claims, authentication, and implementation of onboarding behavior beyond linking to `/onboarding/journey`.
- No pending decision in `context/decisions.md` materially blocks this feature.
- Test evidence (2026-07-12): `pnpm test` passed 5 files and 29 tests; `pnpm build` completed client and SSR bundles using Node 24.14.0.
- Browser evidence (2026-07-12): the page had no horizontal overflow at 320×800, the primary CTA and preview began within the first viewport, all interactive targets were at least 44px tall, the desktop hero used two columns at 1440×900, and the page had no horizontal overflow at the 720×450 viewport used to represent 200% zoom.
- Accessibility and behavior evidence (2026-07-12): the DOM exposed H1 → H2 → H3 heading order, descriptive links and preview labels, the in-page link scrolled to `#product-demonstration`, keyboard focus rendered a 3px outline, the reduced-motion media rule was present, and the browser console contained no warnings or errors.
- Visual evidence (2026-07-12): compared the rendered landing page with `context/screenshots/landing-page-ui.png`; hierarchy, two-column product-first composition, bordered preview, dark four-benefit band, and closing statement matched the reference. Decorative red text found during testing was changed to Ink/Paper so Pomodoro Red remains limited to the primary action and earned progress.
- Follow-up (2026-07-12): made the dark benefits band explicitly viewport-wide so its Ink background reaches both screen edges even when rendered inside the shared public-page content wrapper.
- Follow-up (2026-07-12): added inset space around the reusable pomodoro grid so the latest-block ring is not clipped along the final row by its horizontal scroll container.
- Retest evidence (2026-07-12): after the follow-up fixes, `pnpm test` passed 5 files and 29 tests, `pnpm build` completed client and SSR bundles, and `git diff --check` passed using Node 24.14.0. Browser checks confirmed the Ink benefits band reached both viewport edges at 320px and 1440px, the latest grid ring stayed fully visible, no horizontal overflow occurred at 320px, 720px, or 1440px, all targets remained at least 44px tall, the mobile CTA and preview began within the first 800px viewport, heading order remained semantic, and the console contained no warnings or errors.
- Review evidence (2026-07-12): reviewed the complete diff from `c6c37fc`, including untracked landing-page files. No blocking, high-priority, accessibility, regression, scope-creep, or unrelated-change findings remained. Live design review at 1440×900, 768×900, and 375×812 confirmed responsive composition without overflow or overlap, full-width Ink treatment, an unclipped progress grid, 44px-or-larger targets, semantic headings and labels, reduced-motion support, approved Ink/Paper and Paper/Pomodoro Red contrast pairs, successful CTA navigation to `/onboarding/journey`, and no console warnings or errors.

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
