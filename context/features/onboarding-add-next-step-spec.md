# Add Next Step Onboarding Spec

## Overview

This is step 4 of 4 in onboarding. The screen turns the long-term Journey into one concrete action and finishes onboarding by starting real work.

## Requirements

- Create the screen at `/onboarding/next-step`.
- Redirect to `/onboarding/journey` when no onboarding Journey draft exists.
- Show the progress label “4 of 4.”
- Use the heading “What is the next thing you can work on?”
- Add one labeled Next step input.
- Show “Practice the F chord transition” as the sample value for the “Learn guitar” Journey.
- Add helper copy: “Choose one action you can make progress on in your next session.”
- Validate a trimmed length of 1–120 characters.
- Add one primary “Start first pomodoro” button.
- Add a Back action that returns to `/onboarding/target`.
- On submission, create the Journey and its first current Next step from the onboarding draft.
- Apply the default first milestone of 10 pomodoros.
- Clear the onboarding draft only after Journey creation succeeds.
- Route to `/focus` with the created Journey and Next step selected.
- Make submission idempotent so repeated clicks cannot create duplicate Journeys.
- Do not end onboarding on Home or an empty dashboard.
- Do not add subtasks, priorities, due dates, categories, or scheduling controls.

## References

- @context/screenshots/onboarding-add-next-step.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/onboarding-choose-target-spec.md
- @context/features/timer-setup-spec.md
- @src/lib/mock-data.ts

