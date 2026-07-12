# Landing Page Spec

## Overview

This screen introduces 1000 Pomodoros, shows the product before explaining it, and sends a new user into Journey creation. Use the exported Stitch mockup referenced below for the visual composition.

## Requirements

- Create the landing page at `/`.
- Use the public-page layout from the MVP foundation.
- Add a simple header with the 1000 Pomodoros wordmark and one “Start your first journey” action.
- Use the headline “Turn focused work into visible progress.”
- Use the supporting text “Complete pomodoros, build skills, and see every hour you invest on the path toward mastery.”
- Place one primary “Start your first journey” CTA above the fold.
- Route the primary CTA to `/onboarding/journey`.
- Add “See how it works” as a secondary text link that scrolls to the product demonstration.
- Show a product demonstration above explanatory feature copy.
- The product demonstration must include the “Learn guitar” Journey, a 25-minute timer, a growing pomodoro grid, and progress toward a milestone.
- Use no more than four short benefit statements: know what to work on next, stay consistent, see effort accumulate, and build meaningful skills.
- Do not render testimonials, user counts, star ratings, pricing, or “most popular” claims in the MVP.
- End with the footer line “What will your next 1,000 pomodoros make possible?”
- Keep the primary CTA visible within the first mobile viewport without hiding the product preview.
- Stack content vertically on mobile and use a two-column hero on larger screens when space allows.
- Preserve the three-color palette and use Pomodoro Red for the single primary action and earned progress only.
- Add semantic heading order, descriptive link text, and accessible alt text or labels for the product preview.

## References

- @context/screenshots/landing-page.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/onboarding-create-journey-spec.md
- @src/lib/mock-data.ts

