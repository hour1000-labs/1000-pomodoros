---
version: alpha
name: 1000 Pomodoros
description: A calm, high-contrast design system that turns focused effort into visible progress toward mastery.
colors:
  primary: "#191816"
  secondary: "#FFFFFF"
  tertiary: "#C63F32"
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.04em
  display-sm:
    fontFamily: Manrope
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.2
  label-md:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.25
  timer-lg:
    fontFamily: Manrope
    fontSize: 96px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.04em
    fontFeature: "'tnum' 1"
  timer-sm:
    fontFamily: Manrope
    fontSize: 72px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.035em
    fontFeature: "'tnum' 1"
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  micro: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  section: 96px
  gutter-mobile: 20px
  gutter-desktop: 32px
  content-max: 1200px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  card-default:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 24px
  input-default:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 48px
  pomodoro-complete:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    size: 20px
  pomodoro-empty:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    size: 20px
  focus-timer:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.timer-lg}"
    rounded: "{rounded.none}"
    padding: 24px
---

# 1000 Pomodoros Design System

## Overview

1000 Pomodoros should feel like **calm momentum**: focused, exact, motivating, and mature. The experience is a beautiful record of effort, not a loud productivity game. Its job is to make invisible practice tangible and make the next focused session easy to begin.

The visual signature is a field of small pomodoro blocks accumulating over time. One block equals **25 focused minutes**. A growing grid should feel like laying bricks: each unit is modest, but the finished wall is undeniable.

### Brand personality

- Calm, direct, optimistic, disciplined, and human.
- Premium through restraint, spacing, and typography rather than decoration.
- Motivating through earned progress rather than points, coins, rankings, guilt, or fake urgency.
- Broad enough for coding, music, language learning, fitness, creative work, gaming, business, and career growth.

### Product hierarchy

Every experience must reinforce the core loop:

1. Choose a **Journey**.
2. See one clear **Next step**.
3. Start a **25-minute pomodoro**.
4. Finish the work.
5. Watch progress appear immediately.
6. Choose what comes next.

The product is primarily a **visual progress tracker** with a timer, not a timer with analytics attached.

### Marc Lou product constraints

- Use exactly **three brand colors**: near-black, white, and tomato red.
- Reveal **one idea per screen** and give each screen one dominant action.
- Show the product before explaining it. The grid, timer, and milestone should appear above feature copy.
- Use numbers instead of vague adjectives: “12 pomodoros,” “5 active days,” and “72% complete.”
- Write headlines a fifth grader can understand. Prefer “Turn focused work into visible progress” over abstract productivity language.
- Use one memorable, emotional promise and one primary CTA above the fold.
- Keep onboarding to one question and one or two controls per screen.
- Design mobile first. Remove friction before adding power.
- Do not fabricate testimonials, user counts, scarcity, or social proof.
- Make progress and pricing impossible to miss when those surfaces are present.
- Treat the OG image like a YouTube thumbnail: one emotional idea, one large number, and strong contrast.
- End the landing page with a line worth sharing: **“What will your next 1,000 pomodoros make possible?”**

### Monetization boundary

The current product specification allows a free initial version. Do not invent pricing inside the prototype. If monetization is activated later, follow the stricter growth model: no permanent free plan, no free trial, a clear hard paywall after the defined value moment, and visible **Good / Better / Best** pricing. The user must understand the price, renewal terms, and cancellation path before paying.

### Voice and copy

- Use short sentences and concrete verbs: Start, Pause, Finish, Continue, Add, Review.
- CTA labels describe the outcome: **Start first pomodoro**, **Continue JavaScript**, **Add 25 minutes**.
- Prefer “You added 50 focused minutes” to “Amazing productivity session!”
- Celebrate without exaggeration. Progress is the reward.
- Never shame a missed goal or broken streak. Use “Start again today,” not “You lost your streak.”
- Use **Journey**, **Pomodoro**, **Focus session**, **Next step**, and **Milestone** consistently.

## Colors

The palette contains three base colors and no decorative extras. Derived opacity values may be used for borders, muted text, hover surfaces, and disabled states, but they must remain visibly derived from these three colors.

- **Primary / Ink (#191816):** Headlines, body text, navigation, outlines, timer numerals, and high-emphasis structural elements.
- **Secondary / Paper (#FFFFFF):** Page backgrounds, cards, inputs, and text placed on ink or tomato surfaces.
- **Tertiary / Pomodoro Red (#C63F32):** Completed pomodoros, the single primary action, progress emphasis, active states, and milestone moments.

Use the palette in roughly an **80 / 15 / 5** ratio: mostly white, enough ink for structure, and a small amount of red for action and earned progress. Red should feel valuable because it is scarce.

### Color behavior

- Use one red primary action per screen. Secondary actions are ink text, outlined controls, or links.
- Use ink at 12% opacity for dividers and card borders, 60% for secondary text, and 40% for disabled text.
- Use red at 10% opacity only for selected backgrounds or progress emphasis; keep the foreground label in ink.
- Do not use red as the only error signal. Pair it with an icon, a clear message, and field-level guidance.
- Do not use color alone to distinguish complete, partial, manual, or milestone pomodoros. Add fill level, outline, pattern, icon, or text.
- Maintain WCAG AA contrast. White text on Pomodoro Red and white text on Ink are approved pairings.

### Dark mode

Dark mode inverts Ink and Paper roles while keeping Pomodoro Red as the only accent. Use white at 12% opacity for borders and 65% for secondary text. Recheck every red pairing for contrast instead of assuming the light-mode value transfers safely.

## Typography

Use **Manrope** throughout, with `system-ui, sans-serif` as the fallback stack. One family keeps the product fast and quiet; hierarchy comes from size, weight, and whitespace.

- **Display:** Large emotional promises, milestone numbers, and the landing-page headline. Use one display element per view.
- **Headlines:** Screen titles and major section labels. Keep them short enough to fit on two mobile lines.
- **Body:** Instructions, reflections, and supporting copy. Keep content columns near 65 characters wide.
- **Labels:** Buttons, controls, metadata, and compact statistics. Use sentence case, not all caps.
- **Timer:** Tabular numerals prevent the countdown from shifting. The timer is the dominant object on the focus screen.

### Numeric storytelling

- Make the most meaningful number the largest element: `25:00`, `437`, `72%`, or `10 hours`.
- Pair every number with a plain label. Never show an unexplained metric.
- Use numerals instead of spelling out quantities in UI copy.
- Use a maximum of two font weights on one screen: 400 and 700 by default.
- Do not use tiny gray copy to hide important terms, prices, progress rules, or destructive consequences.

## Layout

Design mobile first from **320px upward**, then enhance at **768px** and **1024px**. The main content width is 1200px with 20px mobile gutters and 32px desktop gutters. Long-form copy uses a narrower 680px measure.

### Composition

- Each screen has one visual anchor, one clear next action, and minimal supporting information.
- Place the primary CTA above the fold and keep **Start focusing** reachable as the journey page scrolls.
- Use generous negative space around the timer, primary number, and next step.
- Prefer a single-column flow on mobile. Introduce two columns only when the secondary column clearly supports the primary task.
- Keep dense history, settings, and advanced details behind progressive disclosure.
- Avoid a generic SaaS dashboard made of equal-weight cards. The **Continue** action and progress grid must dominate Home.

### Responsive navigation

- **Mobile:** Use a four-item bottom navigation for Home, Journeys, History, and Settings. The active item uses Ink plus a small red indicator. Starting focus happens from contextual red buttons, not a distracting permanent floating button.
- **Desktop:** Use a compact left rail or top navigation. Keep the content canvas visually dominant and preserve one red action per screen.
- **Focus mode:** Remove application navigation entirely while the timer is running.

### Pomodoro grid

- Use 10 columns for the current milestone view so rows map cleanly to 10 pomodoros.
- Let tile size flex between 16px and 28px with 4px gaps. Do not shrink tiles below reliable inspection size; paginate or virtualize large grids.
- Group 100 pomodoros into a clear section. The 1,000-hour default contains 2,400 pomodoros across 24 major sections.
- Default to the next milestone and recent progress. Let users zoom out to the full journey without making 2,400 empty blocks the first thing they see.
- Preserve a satisfying full-grid view for users who want the scale of the complete journey.

### Spacing rhythm

Use the 4px base scale in the front matter. Default component padding is 16px on compact mobile surfaces and 24px on cards. Major sections use 64px on mobile and 96px on desktop. Adjacent controls use 8px or 12px gaps; unrelated groups use 24px or more.

## Elevation & Depth

The product is mostly flat. Create hierarchy with whitespace, borders, typography, and controlled color rather than stacked shadows.

- Default cards use a 1px Ink border at 12% opacity and no shadow.
- Interactive cards may use a subtle 2px downward translation or an Ink border at 24% opacity on hover.
- Dialogs and timer setup sheets may use one soft shadow: `0 16px 48px rgba(25, 24, 22, 0.16)`.
- Do not use glassmorphism, blurred color clouds, glowing borders, or layered gradient backgrounds.
- The progress grid sits directly on Paper whenever possible. It should feel like the content, not a widget inside another widget.

## Shapes

The shape language is precise with measured softness.

- Buttons and inputs use 10px corners.
- Cards and dialogs use 16px corners.
- Feature or milestone containers may use 24px corners when they are the single hero object.
- Pomodoro blocks use 6px corners and remain recognizably square.
- Full pills are reserved for short statuses, filter chips, and avatars. Do not turn every label into a pill.
- Use simple 2px outline icons. Familiar symbols beat custom metaphors for navigation and controls.
- Avoid literal cartoon tomatoes in core UI. The red progress block is the mature abstraction of a pomodoro. A small tomato mark may appear in the logo or empty-state illustration only.

## Components

### Buttons

- The primary button is Pomodoro Red with white text, 48px tall, and at least a 44px tap target.
- Show only one primary button per screen or dialog. If two actions compete, decide which one advances the core loop.
- Secondary buttons are white with an Ink border at 20% opacity. Tertiary actions are text links.
- Hover changes the primary button to Ink. Pressed state scales to 98% for 100ms. Focus uses a 2px Ink ring with 2px offset.
- Loading preserves the button width and replaces the leading icon with a spinner. Do not change the label to vague copy like “Working.”
- Destructive actions use direct labels such as **Delete session** and require a confirmation that explains the progress impact.

### Cards

- Cards contain one concept. Avoid nesting cards inside cards.
- The Continue card shows the Journey, one Next step, and one **Start 25:00** action.
- Journey cards show name, current milestone, focused time, and current next step. Keep secondary metadata to one line.
- Make the card body open details; keep its Start action separately keyboard-focusable.

### Inputs and forms

- Labels remain visible above fields. Placeholders provide examples, never the only label.
- Onboarding asks one question per screen and uses no more than two inputs.
- Journey name is the only required creation field. Reason, target, category, icon, and color are optional or deferred.
- Inline validation states what happened and how to fix it.
- Autofocus only the single obvious text field, and never steal focus when returning to a populated screen.

### Pomodoro blocks and grid

- **Complete:** Solid Pomodoro Red.
- **Partial:** Pomodoro Red clipped from bottom to top in proportion to focused minutes. A 5-minute session fills 20% of a block.
- **Future:** Paper with a 1px Ink border at 12% opacity.
- **Latest:** Complete or partial styling plus a 2px Ink outline.
- **Milestone:** Standard state plus a persistent corner notch or stronger outline; never rely on a new color.
- **Manual:** Counts normally. Inspection details include an **Added manually** label; the overview grid does not visually punish legitimate manual work.
- Selecting or focusing a block opens a compact detail popover with date, duration, Journey, Next step, and entry type.
- Every block has an accessible name such as “Pomodoro 437, completed July 12, 2026, 25 minutes.”

### Focus timer

- Ready state shows Journey, Next step, duration choices of 25, 50, and Custom, then one **Start focus session** button.
- Running state fills the viewport. Show remaining time, Journey, Next step, and one prominent **Pause** control. Remove navigation, analytics, task lists, and unrelated notifications.
- Paused state reveals **Resume**, **Finish early**, and **Cancel session** in that priority order.
- Overtime is off by default. If enabled, label elapsed overtime clearly and enforce the product-defined cap.
- Support full-screen mode. Break timers, ambient sound, and complex focus scoring are outside the initial design.
- Do not announce every countdown second to assistive technology. Announce state changes and meaningful boundaries such as 5 minutes remaining and completion.

### Session completion

- Lead with the earned result: **“2 pomodoros complete.”**
- Show the added minutes, updated total, milestone progress, and newly filled blocks immediately.
- Use a 200–400ms fill or scale animation on the new blocks. No confetti, coins, fireworks, or endless celebration loops.
- Make reflection optional and collapsed. Credit appears before any writing prompt.
- Primary action is contextual: **Start another pomodoro** or **Choose next step**. **Done** is a quiet secondary action.

### Milestones and streaks

- Milestones use a large number, the date reached, the Journey, and a short statement of earned progress.
- Streaks are supporting context, never the product identity. A broken streak uses neutral copy and no loss animation.
- Weekly goals show completed amount, remaining amount, and days left. Missing one never triggers guilt-heavy color or language.
- Shareable milestone cards use the same three-color palette and are generated from real progress only.

### Home

Home answers three questions in order:

1. What should I work on now?
2. What did I complete recently?
3. Am I staying consistent?

The first viewport is dominated by **Continue**. Today’s pomodoros, focused minutes, active days, and weekly goal appear as compact supporting numbers. Active Journeys and recent sessions follow below. Do not create an equal-weight analytics card grid.

### Journey details

The first viewport shows Journey name, reason, total focused time, current milestone, the progress grid, one current Next step, and **Start focusing**. Upcoming steps and recent sessions sit below or behind tabs. The primary action remains sticky on small screens without covering grid content.

### Onboarding

Use five short screens: Journey name, optional reason, target, first Next step, and first session. Show a quiet `1 of 5` progress label. The last screen starts real work; onboarding must not end on an empty dashboard.

### Landing page

- Headline: **Turn focused work into visible progress.**
- Supporting text: **Complete pomodoros, build skills, and see every hour you invest on the path toward mastery.**
- Primary CTA: **Start your first journey.**
- Secondary action is a text link: **See how it works.**
- Put a working-looking product frame above the fold with a Journey, timer, growing grid, and milestone. Product before explanation.
- Use four numbered benefits at most. Real social proof comes last and only after it exists.
- Include a visible founder note such as **Built in public by Rob + Brandon** when founder identity is approved for launch.
- Footer line: **What will your next 1,000 pomodoros make possible?**

### Pricing and paywall

Only render this surface after the business decision is activated.

- Make pricing visible beside the purchase CTA and in navigation.
- Use three plans in Good / Better / Best order. Emphasize the recommended middle plan without hiding the others.
- State exact limits with numbers. Avoid “generous,” “unlimited-ish,” or feature fog.
- Use a hard paywall at the defined boundary, not a surprise interruption in an active timer.
- Do not use a free trial. Show renewal terms and a direct cancellation path.

### Share cards and OG image

- Export at 1200 × 630.
- Lead with one large number, such as **437 / 2,400 pomodoros** or **100 focused hours**.
- Show one Journey name and a cropped progress grid.
- Use Ink or Pomodoro Red as the dominant field with high-contrast text. No gradients.
- Keep copy under 12 words besides the numeric label.
- The image should communicate one emotional idea at thumbnail size: **the work is adding up**.

## Do's and Don'ts

### Do

- Do make the next useful action obvious within 3 seconds.
- Do keep starting a session to one or two taps for returning users.
- Do make every completed session change the visual tracker immediately.
- Do use numbers, concrete labels, and real user progress.
- Do keep one red action or emphasis per screen.
- Do show the next milestone before the distant 1,000-hour finish line.
- Do preserve honest labels for manual or edited time.
- Do use empty states to start action: **Create your first Journey** or **Add the next thing you can work on**.
- Do meet WCAG AA, support keyboard navigation, preserve visible focus, and provide 44px minimum touch targets.
- Do honor reduced motion and keep completion animation nonessential.
- Do test at 320px width, 200% zoom, dark mode, long Journey names, 2,400-block Journeys, and zero-progress states.

### Don't

- Don't add more brand colors, gradients, glass effects, or decorative data visualization.
- Don't turn Home into a dense analytics dashboard.
- Don't turn Next steps into a full task manager with priorities, dependencies, boards, or due-date workflows.
- Don't use XP, coins, leaderboards, guilt, streak-loss drama, or childish celebrations.
- Don't force a reflection before crediting completed work.
- Don't show the full 2,400 empty blocks as the default first view.
- Don't place multiple primary CTAs in the same visual field.
- Don't hide pricing, renewal terms, progress rules, or destructive consequences in muted fine print.
- Don't use fake testimonials, fake user counts, or unearned “most popular” claims.
- Don't add a feature unless it strengthens choosing, focusing, completing, recording, or returning.

### Source references

- Product source of truth: [1000 Pomodoros — Product Specification](https://docs.google.com/document/d/1jrYJToeQp9gweM38WnZjehf9TqyMlbwYIEy7MbKq5_w)
- Format reference: [Google Stitch DESIGN.md overview](https://stitch.withgoogle.com/docs/design-md/overview)

