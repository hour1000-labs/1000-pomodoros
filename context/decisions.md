# Product Decisions

This file is the authoritative registry for product choices. It separates
confirmed requirements from questions that still need an explicit decision.

## Usage

- Treat confirmed decisions as requirements.
- Do not silently promote recommendations or assumptions to confirmed decisions.
- A pending decision blocks a feature only when it materially affects that
  feature's behavior, acceptance criteria, data model, or user interface.
- When a decision is resolved, move it from `Pending Decisions` to
  `Confirmed Decisions` and record the date.

## Confirmed Decisions

### Product identity

- The product uses `Journey` for a tracked skill, project, or goal, with skills
  as the primary use case.
- The 1,000-hour target is literal.
- One pomodoro represents exactly 25 focused minutes.
- The product is primarily a visual progress tracker supported by a timer.

### Focus sessions

- A session must last at least five minutes to count.
- Partial sessions count after the five-minute minimum.
- Overtime is off by default and must have a safety cap.
- Manual time entry is allowed and must be labeled.
- The timer remains visible during a focus session.
- Focus ratings are not part of version one.

### Progress

- Partial pomodoros are shown proportionally to actual focused minutes.
- Users can change a Journey's final target.
- The full visualization should make large totals feel substantial and visibly
  fill the available progress field.

### Next steps

- Each Journey has an ordered list with the current next step at the top.
- Version one does not include due dates.

### Motivation

- Streaks are included.
- A focus session of at least five minutes on any Journey maintains the streak.
- Weekly goals are included.
- Completion animation should be subtle.

### Business

- The initial version is free, with a possible freemium model later.
- The initial audience is anyone improving a skill or hobby.
- First-month success means the core experience works end to end with few or no
  significant bugs.

## Pending Decisions

Resolve these before implementing a feature they materially affect.

### Focus sessions

- Choose the overtime safety cap; the current range under consideration is two
  to four hours.
- Decide whether break timers belong in version one.

### Progress

- Finalize the visual treatment for complete and partial pomodoro blocks.
- Finalize how the full 2,400-pomodoro journey is grouped and navigated.
- Decide whether milestones can be outcome-based as well as time-based.

### Next steps

- Decide whether users can schedule next steps.
- Decide where and how prominently completed next steps appear.

### Motivation

- Decide whether milestone sharing belongs in version one or a later release.

### Business

- Choose the number of Journeys available on the free tier; the current range is
  one to three.
- Finalize paid-tier boundaries, including additional Journeys and custom timer
  lengths.
- Choose the initial launch channel.

## Decision Record Format

Use this format for future decisions:

```markdown
### YYYY-MM-DD — <decision title>

- Status: Confirmed
- Decision: <what was chosen>
- Reason: <why it was chosen>
- Affects: <features, screens, or data>
```
