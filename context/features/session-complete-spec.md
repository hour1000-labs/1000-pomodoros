# Session Complete Spec

## Overview

This screen credits the completed work immediately and makes the new progress visible before asking the user to do anything else.

## Requirements

- Create the screen at `/focus/complete`.
- Require a completed session ID in route search parameters or recover the latest just-completed session.
- Redirect safely to `/home` when no completed session can be resolved.
- Finalize and award a session exactly once before rendering the credited totals.
- Store actual focused minutes and calculate pomodoro progress as `focusedMinutes / 25`.
- Preserve fractional progress for partial sessions.
- Show “1 pomodoro complete.” for a 25-minute session and pluralize correctly for other values.
- Show “You added 25 focused minutes to Learn guitar.” using real session data.
- Display the Journey, Next step, session duration, updated total, and current milestone progress.
- Render the relevant section of the PomodoroGrid with newly earned blocks visually identified.
- Use a short 200–400ms fill or scale animation unless reduced motion is enabled.
- Do not use confetti, coins, XP, fireworks, or looping animations.
- Place earned credit before any optional reflection input.
- Include an optional collapsed reflection field with a 280-character limit.
- Save the reflection to the completed session when submitted.
- Add one primary “View progress” button that routes to `/journeys/$journeyId`.
- Add “Start another pomodoro” as a secondary action that returns to `/focus` with the same Journey and Next step.
- If the session crossed a milestone, route the primary action to `/milestones/$milestoneId` and label it “View milestone.”
- Make refresh safe and never duplicate session totals or milestone awards.

## References

- @context/screenshots/session-complete.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/focus-timer-running-spec.md
- @context/features/journey-detail-spec.md
- @context/features/milestone-reached-spec.md
- @src/lib/mock-data.ts

