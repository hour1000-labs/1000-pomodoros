# Choose Target Onboarding Spec

## Overview

This is step 3 of 4 in onboarding. The screen makes the long-term goal concrete with numbers while keeping attention on the next reachable milestone.

Use the screenshot referenced below as the visual reference for how this screen should look.

## Requirements

- Create the screen at `/onboarding/target`.
- Redirect to `/onboarding/journey` when no onboarding Journey draft exists.
- Show the progress label “3 of 4.”
- Use the heading “How much focused time are you aiming for?”
- Provide target options for 10, 25, 100, and 1,000 hours, plus Custom.
- Select 1,000 hours by default for a new draft.
- Show the conversion “2,400 pomodoros” under the selected 1,000-hour option.
- Calculate pomodoros as `targetHours * 60 / 25`.
- When Custom is selected, reveal one numeric hours input without leaving the screen.
- Validate custom targets from 1 to 10,000 hours.
- Use accessible radio-group behavior for the target options.
- Save the selected target to the onboarding draft.
- Route Continue to `/onboarding/next-step`.
- Add a Back action that returns to `/onboarding/motivation`.
- Include reassuring copy that the experience will focus on the next milestone rather than showing the full target by default.
- Do not add difficulty labels such as Easy, Serious, or Hardcore. Use numbers only.

## References

- @context/screenshots/onboarding3-ui.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/onboarding-add-motivation-spec.md
- @context/features/onboarding-add-next-step-spec.md
- @src/lib/mock-data.ts
