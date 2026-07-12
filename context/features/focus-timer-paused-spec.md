# Paused Focus Timer Spec

## Overview

This is the paused state of `/focus`. It preserves the timer context while making Resume the obvious next action.

## Requirements

- Render this state on `/focus` when the active FocusSession status is `paused`.
- Keep the remaining time visually dominant.
- Show a clear “Paused” status.
- Display the Journey name and current Next step.
- Add one primary Resume button.
- Add a secondary “Finish early” button.
- Add a quiet “Cancel session” text action.
- On Resume, calculate a new target end timestamp from the persisted remaining seconds and set status to `running`.
- On Finish early, calculate actual focused time excluding paused time.
- If at least 5 minutes were focused, finalize the session and route to `/focus/complete`.
- If fewer than 5 minutes were focused, show a confirmation that the session will not add progress before finishing.
- On Cancel, show a confirmation dialog and explain that no progress will be added.
- Delete or mark the active session cancelled only after confirmation.
- Route a cancelled session back to the Timer Setup state with the prior Journey and Next step selected.
- Persist the paused state across reloads without allowing the countdown to continue.
- Use focus management correctly when opening and closing confirmation dialogs.
- Do not add editing, reflections, duration changes, or analytics to this state.

## References

- @context/screenshots/focus-timer-paused.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/focus-timer-running-spec.md
- @context/features/session-complete-spec.md
- @src/lib/mock-data.ts

