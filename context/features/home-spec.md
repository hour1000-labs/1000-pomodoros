# Home Screen Spec

## Overview

This is the returning-user Home screen. It answers what the user should work on now before showing recent progress or supporting statistics.

## Requirements

- Create the screen at `/home`.
- Use the application-page layout and responsive application navigation.
- Redirect to `/onboarding/journey` when no Journey exists.
- Make the Continue section the dominant element in the first viewport.
- Show the most recently active Journey and its current Next step.
- Add one primary “Start 25:00” button that routes to `/focus` with that Journey and Next step selected.
- If the current Journey has no Next step, replace Start with one “Add a Next step” action.
- Show compact Today statistics for completed pomodoros and focused minutes.
- Show weekly progress as completed amount, goal amount, remaining amount, and active days.
- Use the seeded screenshot values: 2 pomodoros today, 50 focused minutes, 7 of 10 weekly pomodoros, and 3 active days.
- Show one or two Active Journey cards below Continue.
- Each Journey card shows name, focused time, current milestone, and current Next step.
- Make the card body route to `/journeys/$journeyId` and keep its Start action separately focusable.
- Show two or three recent completed sessions below Active Journeys.
- Derive all statistics from persisted completed sessions.
- Do not add trend charts, productivity scores, comparison metrics, streak-loss warnings, or equal-weight analytics cards.
- Provide a calm zero-activity state that says “Your next pomodoro starts here” without guilt-heavy language.
- On mobile, preserve Continue and its CTA before all supporting statistics.

## References

- @context/screenshots/home.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/journey-detail-spec.md
- @context/features/timer-setup-spec.md
- @src/lib/mock-data.ts

