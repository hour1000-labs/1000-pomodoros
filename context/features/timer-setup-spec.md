# Timer Setup Spec

## Overview

This is the ready state of the focus experience. It confirms the Journey, Next step, and duration while keeping the user one action away from focused work.

## Requirements

- Implement the ready state at `/focus`.
- Use the distraction-free focus layout without application navigation.
- Resolve the selected Journey and Next step from route search parameters or the most recently active Journey.
- If no Journey exists, redirect to `/onboarding/journey`.
- Display the selected Journey name and current Next step.
- Provide duration options for 25 minutes, 50 minutes, and Custom.
- Select 25 minutes by default.
- When Custom is selected, reveal one minutes input.
- Validate custom durations from 5 to 240 minutes.
- Add quiet Change actions for Journey and Next step using an accessible dialog or sheet.
- Do not turn the selection sheet into a Journey-management screen.
- Show a small preview that 25 focused minutes fills one pomodoro block.
- Add one primary “Start focus session” button.
- On Start, create and persist an active FocusSession with `running` status, `startedAt`, selected duration, Journey ID, and Next step ID.
- Prevent duplicate active sessions from repeated clicks.
- Switch the same `/focus` route into the running state after creation.
- Restore an existing running or paused session instead of showing setup when one is already active.
- Keep the full setup form within one mobile viewport at common device heights.

## References

- @context/screenshots/timer-setup.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/focus-timer-running-spec.md
- @context/features/focus-timer-paused-spec.md
- @src/lib/mock-data.ts

