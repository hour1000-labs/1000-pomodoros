# Add Motivation Onboarding Spec

## Overview

This is step 2 of 4 in onboarding. The screen lets the user record why the Journey matters without blocking progress if they prefer to skip it.

Use the screenshot referenced below as the visual reference for how this screen should look.

## Requirements

- Create the screen at `/onboarding/motivation`.
- Redirect to `/onboarding/journey` when no onboarding Journey draft exists.
- Show the progress label “2 of 4.”
- Display the current Journey name as supporting context.
- Use the heading “Why does this matter to you?”
- Add one labeled optional textarea.
- Show “I want to play my favorite songs confidently.” as the sample value for the “Learn guitar” Journey.
- Limit the reason to 240 characters and show a character count after 180 characters.
- Save the reason to the onboarding draft when Continue is selected.
- Route Continue to `/onboarding/target`.
- Add “Skip for now” as a quiet text action that saves an empty reason and routes forward.
- Add a Back action that returns to `/onboarding/journey` without discarding the current text.
- Restore the saved reason when returning to the screen.
- Do not add motivational quotes, illustrations, testimonials, or additional questions.
- Keep the textarea and primary action visible without requiring scrolling at common mobile heights.

## References

- @context/screenshots/onboarding2-ui.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/onboarding-create-journey-spec.md
- @context/features/onboarding-choose-target-spec.md
- @src/lib/mock-data.ts
