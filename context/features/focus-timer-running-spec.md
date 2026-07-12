# Running Focus Timer Spec

## Overview

This is the running state of `/focus`. The screen removes unrelated product chrome and makes the remaining time and Pause action the entire experience.

## Requirements

- Render this state on `/focus` when the active FocusSession status is `running`.
- Show the remaining time as the largest element using tabular numerals.
- Display the Journey name and current Next step as supporting context.
- Add one prominent Pause button.
- Add a quiet full-screen control when the Fullscreen API is available.
- Do not show application navigation, analytics, upcoming steps, streaks, or session history.
- Calculate remaining time from persisted timestamps rather than decrementing a counter as the source of truth.
- Use a lightweight interval only to refresh the displayed value.
- Prevent countdown drift when the tab is backgrounded or the device sleeps.
- Persist enough active-session state to restore the correct remaining time after reload.
- When Pause is selected, store the remaining seconds, set status to `paused`, and render the paused state.
- When time reaches zero, finalize the elapsed duration once and route to `/focus/complete`.
- Make completion idempotent so reloads cannot award duplicate progress.
- If the user attempts to leave with a running timer, show a confirmation explaining that the timer will continue.
- Keep the timer running when navigating away after confirmation.
- Announce Pause, Resume, 5 minutes remaining, 1 minute remaining, and completion to assistive technology. Do not announce every second.
- Use reduced motion and avoid pulsing, ticking animations, or visual noise.

## References

- @context/screenshots/focus-timer-running.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/timer-setup-spec.md
- @context/features/focus-timer-paused-spec.md
- @context/features/session-complete-spec.md
- @src/lib/mock-data.ts

