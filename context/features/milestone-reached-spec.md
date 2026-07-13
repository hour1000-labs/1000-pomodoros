# Milestone Reached Spec

## Overview

This screen recognizes a meaningful amount of completed work without turning progress into a loud reward system. It appears only for a milestone that was actually earned.

Use the screenshot referenced below as the visual reference for how this screen should look.

## Requirements

- Create the screen at `/milestones/$milestoneId`.
- Load the earned Milestone and its Journey from persisted state.
- Show a useful not-found state when the milestone does not exist or has not been earned.
- Use the seeded screenshot milestone: Learn guitar, 25 focused hours, 60 pomodoros, reached July 12, 2026.
- Make “25 hours” the largest visual element.
- Show the message “You showed up for 60 pomodoros.”
- Display the Journey name and date reached.
- Render the completed 10-column milestone section of the PomodoroGrid.
- Show the next milestone as 50 focused hours with its remaining amount.
- Add one primary “Continue Journey” button that routes to `/journeys/$journeyId`.
- Add “Share milestone” as a secondary action.
- Use the Web Share API when available and copy a plain-text milestone summary to the clipboard as the fallback.
- Share only real progress values from persisted state.
- Show a small nonblocking confirmation when the summary is copied.
- Use one short entrance transition unless reduced motion is enabled.
- Do not use confetti, coins, XP, badges, fireworks, streak pressure, or looping animation.
- Do not allow an unearned milestone URL to display celebratory content.
- Keep the full milestone content readable without horizontal scrolling at 320px.

## References

- @context/screenshots/milestone-ui.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/session-complete-spec.md
- @context/features/journey-detail-spec.md
- @src/lib/mock-data.ts
