# Create Journey Onboarding Spec

## Overview

This is step 1 of 4 in onboarding. The screen captures the one thing the user wants to improve and keeps setup intentionally minimal.

## Requirements

- Create the screen at `/onboarding/journey`.
- Use the distraction-free onboarding layout without application navigation.
- Show the progress label “1 of 4.”
- Use the heading “What do you want to make progress on?”
- Add one labeled Journey name input.
- Show “Learn guitar” as the sample value in seeded or screenshot states.
- Show quiet examples such as Learn Spanish, Build my portfolio, and Improve at chess.
- Journey name is the only required field on this screen.
- Trim leading and trailing whitespace before saving.
- Validate a length of 1–80 characters.
- Show validation only after blur or attempted submission.
- Disable Continue while the field is empty or while the draft is being saved.
- Save the Journey name to the onboarding draft through the client repository.
- Route Continue to `/onboarding/motivation`.
- Add a small Exit action that returns to `/` after confirmation when draft data would be lost.
- Restore the saved draft when the user returns to this route.
- Autofocus the Journey name input on first entry, but do not steal focus when restoring a populated draft.
- Use one primary action and no extra fields, categories, icons, colors, or target controls.

## References

- @context/screenshots/onboarding-create-journey.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/onboarding-add-motivation-spec.md
- @src/lib/mock-data.ts

