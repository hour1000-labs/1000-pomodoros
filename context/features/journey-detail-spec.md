# Journey Detail Spec

## Overview

This is the primary progress screen for one Journey. It should make accumulated effort satisfying while keeping the current Next step and Start action immediately available.

Use the screenshot referenced below as the visual reference for how this screen should look.

## Requirements

- Create the screen at `/journeys/$journeyId`.
- Use the application-page layout and responsive application navigation.
- Load the Journey by route parameter and show a useful not-found state when it does not exist.
- Show Journey name, optional reason, total focused time, total pomodoros, current milestone, next milestone, and percentage toward the next milestone.
- Use the seeded “Learn guitar” state for screenshots: 43 pomodoros, 17 hours 55 minutes, and 72% toward 25 hours.
- Make the PomodoroGrid the dominant product element.
- Use 10 columns for the current milestone view.
- Support complete, partial, future, latest, and milestone block states.
- Allow a block to be focused or selected to reveal date, duration, Next step, and session source in a Tooltip or Dialog.
- Default to the current milestone section rather than all 2,400 target blocks.
- Add a “View full Journey” control that expands or switches to grouped sections without creating another route.
- Virtualize, paginate, or progressively render large full-Journey grids to avoid rendering 2,400 interactive elements at once on initial load.
- Display the current Next step prominently above one “Start 25:00” CTA.
- Route Start to `/focus` with the current Journey and Next step selected.
- Show a lightweight list of upcoming Next steps below the main progress content.
- Allow adding one Next step inline or through a small dialog.
- Allow marking the current Next step complete and promoting the next incomplete item.
- Do not add subtasks, priorities, labels, due dates, dependencies, or Kanban behavior.
- Show two or three recent sessions as supporting context only.
- Keep the Start action reachable on mobile with a sticky bottom action that does not cover grid content.
- Provide empty states for no Next step, no sessions, and zero progress.

## References

- @context/screenshots/journey-detail-ui.png
- @context/DESIGN.md
- @context/features/mvp-ui-foundation-spec.md
- @context/features/timer-setup-spec.md
- @context/features/home-spec.md
- @src/lib/mock-data.ts
