# Monthly Activity UI Inspiration

Research completed August 14, 2026.

## Executive verdict

The planned Compact Monthly Activity refinement is the right implementation for this product:

- Put the month result before the daily record.
- Make a clearly labeled Month total (Pomodoros plus its unit) the visual anchor, with focused time as a smaller supporting line; reserve active-day counts for disclosure context rather than a persistent metric.
- Order the ledger chronologically from oldest at the top to newest at the bottom, matching a traditional paper journal.
- Keep the latest 3 active days visible on Home and the latest 7 on Journey Detail while preserving chronological row order.
- Reveal earlier active days from a top-of-ledger caret in batches of 7 and always offer a way back to the latest compact window.
- Keep the earned tomato marks as the distinctive visual record.
- Do not add a calendar, heatmap, chart dashboard, nested scroller, or new route in this refinement.

Successful products consistently separate an at-a-glance result from exact history. Calendars and heatmaps are useful scan or navigation layers, but none of the strongest references suggests that a dense month grid should replace a readable record of exact activity. The current proposal is a deliberately lightweight hybrid: summary first, exact recent detail second, complete history on demand.

The research justifies one small refinement to the implementation brief: the month result should form one flat two-value summary rather than a dashboard of equal-weight cards. Pomodoros lead; focused time supports beneath. Active-day counts remain useful for disclosure context but do not need a persistent metric. The user then chose chronological journal order over the newest-first ordering used by several reference feeds.

## Evidence standard

Google Play install bands are Android-only lower bounds, not total downloads or active users. Private companies rarely publish audited revenue, so this report uses official store bands, official user or usage claims, and company-reported revenue only when available. It does not use speculative app-revenue estimates.

Visual observations come from current official product pages, help documentation, store listings, and first-party product updates. Design recommendations are labeled as synthesis rather than claimed as experimental proof.

## Case studies

### Forest — make effort visible in the product's own visual language

**Proof of success.** Forest's official site reports 60M+ downloads and more than 2M real trees funded. Google Play independently shows 10M+ Android downloads and Editors' Choice. [Forest official site](https://www.forestapp.cc/) · [Forest on Google Play](https://play.google.com/store/apps/details?hl=en&id=cc.forestapp)

**Observed pattern.** Every completed focus session becomes a tree, so accumulated work forms a recognizable forest rather than a generic dashboard. Forest keeps chronological detail in a timeline and offers totals and patterns across day, week, and month ranges.

**Useful inspiration.** The tomato should do the same job for 1000 Pomodoros. Keep earned tomatoes in every visible day, but let a concise summary communicate the result before the user enters the record. Do not borrow coins, collectible rewards, seasonal missions, or extra analytics.

### Focus To-Do — direct Pomodoro proof, plus a useful anti-pattern

**Proof of success.** Google Play shows 10M+ downloads. The developer reports that users have logged more than 200M focused hours. [Focus To-Do on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.superelement.pomodoro)

**Observed pattern.** Focus To-Do provides daily, weekly, and monthly reports, a tracked-time calendar, total focus time, task distribution, trend charts, and detailed time blocks. Its report experience places several chart types and cards together.

**Useful inspiration.** The product validates month totals and time-range navigation as core Pomodoro needs. It also shows why 1000 Pomodoros should stay more restrained: multiple charts and equal-weight analytics cards make the user interpret the interface before they can appreciate the work.

### TickTick — separate overview, daily rhythm, and exact records

**Proof of success.** Google Play shows 10M+ downloads and a 4.6 rating. [TickTick on Google Play](https://play.google.com/store/apps/details?id=com.ticktick.task)

**Observed pattern.** TickTick's Focus Statistics separates a trend view, a daily focus timeline, a monthly most-focused-time view, a year grid, and a separately manageable focus-record list. It supports week, month, year, and custom ranges rather than forcing every record into one surface. [TickTick Focus Statistics](https://help.ticktick.com/articles/7055781966800486400)

**Useful inspiration.** This is the strongest information-architecture reference: overview first, recent daily detail next, full record management deeper. For this smaller product, the month summary plus compact ledger achieves the same hierarchy without adding tabs, filters, charts, or record-management controls.

### Daylio — let overview and exact entries coexist

**Proof of success.** Daylio reports 20M+ users on its official site; Google Play shows 10M+ downloads and a 4.7 rating. [Daylio official site](https://daylio.net/) · [Daylio on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=net.daylio)

**Observed pattern.** Entries can be browsed in list or calendar form, and the current App Store screenshots show the entry list in reverse chronological order: Today, Yesterday, then older dates. Monthly and yearly statistics summarize the data, while Year in Pixels turns one year into one compact mark per day. Deeper statistics change with the selected period rather than extending the daily list indefinitely. [Daylio on the App Store](https://apps.apple.com/us/app/daylio-journal-mood-tracker/id1194023242) · [Daylio activity statistics](https://daylio.net/faq/docs/daylio-faq/about/activity-and-mood-statistics/)

**Useful inspiration.** A compact visual overview can coexist with readable detail, but the two serve different jobs. Daylio supports keeping 1000 Pomodoros' exact ledger while bounding its default length. A new calendar would be an additional navigation surface, not a cleaner replacement for the tomato record.

### Strava — summary first, then drill into the activities that created it

**Proof of success.** Strava currently reports 200M users and 51M weekly uploads. In August 2025 it said it was approaching $500M in annual recurring revenue. [Strava audience](https://business.strava.com/why-strava/audience) · [Strava company release](https://press.strava.com/articles/strava-finalizes-leadership-team-for-next-stage-of-growth)

**Observed pattern.** Strava places key totals in a progress summary, offers fixed time ranges, and lets users drill into a week to see the contributing activities. Its mobile Training Log starts with a bounded recent preview before the full log. Its history combines overview charts or calendars with a mini-feed, while personal activity feeds are chronological and can use latest-activity ordering. [Strava progress summary](https://support.strava.com/en-us/articles/15401618-progress-summary-chart) · [Strava Training Log](https://support.strava.com/en-us/articles/15402077-training-log) · [Strava activity history](https://support.strava.com/en-us/articles/15402014-viewing-your-activity-history-on-strava) · [Strava feed ordering](https://support.strava.com/en-us/articles/15402105-feed-ordering)

**Useful inspiration.** The user should understand the month before traversing its records. The product's chosen paper-journal metaphor then determines the reading direction: earliest work first, later work below. This still directly supports moving the total above the table and keeping the exact ledger calm.

### Duolingo — separate consistency from volume

**Proof of success.** Google Play shows 500M+ downloads. Duolingo's FY2025 filing reports 133.1M monthly active users, 52.7M daily active users, 12.2M paid subscribers, and $1.0376B in revenue. [Duolingo on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.duolingo) · [Duolingo FY2025 filing](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012513/q4fy25duolingo12-31x25shar.htm)

**Observed pattern.** Duolingo gives the streak one prominent number and uses a compact seven-day strip for recent consistency. Daily-goal progress is separate from the streak, and milestone moments receive selective emphasis instead of making every history state celebratory. [Duolingo teaching method](https://blog.duolingo.com/duolingo-teaching-method/) · [Duolingo streak redesign](https://blog.duolingo.com/improving-the-streak/)

**Useful inspiration.** Pomodoro volume, focused time, and active-day consistency are related but different measures; they should not be collapsed into one number. The seven-day rhythm supports a deeper 7-row Journey default, while Home still needs the more compact 3-row preview demanded by its Continue-first hierarchy.

### Opal — one useful summary and one branded emotional moment

**Proof of success.** In an April 2026 RevenueCat interview, Opal's founder reported more than 1M daily active users and $10M in annual recurring revenue. Its App Store listing carries Editors' Choice. This is a founder-reported private-company figure, not an audited filing. [RevenueCat founder interview](https://www.revenuecat.com/blog/growth/kenneth-schlenker-sub-club-podcast-2026) · [Opal on the App Store](https://apps.apple.com/us/app/opal-screen-time-control/id1497465230)

**Observed pattern.** Home uses a compact daily screen-time result and drills into app-level detail. Profile combines a streak calendar, cumulative focus hours, and branded milestone objects rather than presenting a wall of analytics. [Opal product update](https://opalapp.com/blog/keynote-2---the-big-update)

**Useful inspiration.** One branded visual language is more memorable than several generic charts. 1000 Pomodoros already has that language in its tomatoes, so it should strengthen their hierarchy rather than add another visualization system.

## Corroborating patterns

- GitHub's contribution profile pairs a dense overview grid with a detailed contribution timeline and a `Show more activity` control. This supports progressive disclosure, but also shows that a heatmap and a timeline are separate layers. [GitHub contribution history](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/viewing-contributions-on-your-profile)
- Hevy separates an activity calendar from a newest-to-oldest workout history. Again, the calendar finds a date; the history explains the work. [Hevy progress features](https://www.hevyapp.com/features/gym-progress/)
- Finch keeps quick daily check-ins in the main loop and moves combined analytics into Insights. Its warm, non-punitive tone is compatible with this product, but its pet and reward system is not. [Finch on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.finch.finch)

## Recurring UI patterns worth borrowing

1. **Lead with the result.** Forest, TickTick, Strava, and Opal make the accumulated result understandable before exposing raw history.
2. **Use the native progress object.** Trees make Forest memorable; tomatoes should remain the memorable record here.
3. **Separate consistency from volume.** Active days, focused time, and Pomodoros answer different questions.
4. **Make the record's reading direction explicit.** Many successful feeds put recent detail first, but this product's chosen metaphor is a paper journal: earliest active day at the top, later days below, and the newest work at the bottom. A latest-day window keeps that bottom edge visible without reversing the record.
5. **Reveal depth intentionally.** Successful products use ranges, drill-downs, modes, filters, or `show more`; they do not make a complete history the default Home experience.
6. **Keep calendars in their lane.** A calendar is excellent for spotting gaps and jumping to dates. It is weaker at showing multiple tomatoes, partial Pomodoros, exact minutes, and accessible row summaries in a 320px layout.
7. **Keep Home lighter than a deliberate detail view.** Primary loops stay compact; deeper review belongs behind an explicit choice.
8. **Make expansion reversible.** Once history expands, a quiet route back to the recent view preserves orientation and keeps the surface reusable.

## Approach comparison for 1000 Pomodoros

| Approach | Strength | Cost in this product | Verdict |
| --- | --- | --- | --- |
| Calendar first | Entire month is visually bounded and patterns are easy to scan. | Exact minutes and multiple or partial tomatoes require selection; 7 interactive columns cannot maintain useful 44px targets within the 280px content width at 320px; it overlaps the existing Streaks calendar's job. | Do not use for this refinement. |
| Full ledger with nested scroll | Preserves every exact row while bounding card height. | Creates two scroll contexts, hides the end of the record, and makes keyboard and zoom use less predictable. | Reject. |
| Chronological ledger with progressive disclosure | Preserves exact tomato semantics, reads like a paper journal, works in normal page flow, and adds very little interaction complexity. | Today may require expansion when a month has more than the compact default number of active days. | Best fit for this product's chosen metaphor. |
| Summary + calendar + ledger | Combines overview and detail. | Duplicates information, lengthens Home, adds interaction and accessibility complexity, and introduces a second monthly visual language beside Streaks. | Consider only on a future dedicated activity surface if user demand supports it. |

## Recommended implementation contract

### Summary

- Place one flat summary band directly below the month controls and before the table.
- Label the dominant number `Month total` and keep `Pomodoros` attached to it as the unit.
- Present exact focused time as a smaller supporting value; use active-day counts only when disclosure context needs them.
- Keep explicit zeros and correct singular/plural labels.
- Do not turn the summary into an equal-weight analytics card grid.

### Daily record

- Sort active dates chronologically; Today is last when it contains countable activity and the full month is visible.
- Preserve the semantic table, exact accessible row summary, local date, partial tomato fill, earned-only marks, and dense-day overflow count.
- Give the current-day context a small Pomodoro-red marker and stronger text weight while keeping the actual `Today` text visible and semantic.
- Do not render placeholder rows for inactive days.

### Surface-specific disclosure

- Home shows the latest 3 chronological active days by default.
- Journey Detail shows the latest 7 chronological active days by default.
- Status says `Showing 3 of 18 active days` or the exact equivalent.
- A top-of-ledger caret reveal action states the exact earlier batch, for example `Show 7 earlier days` or `Show 4 earlier days` (with a compact visible treatment such as `7 earlier`).
- Reveal no more than 7 at a time, without gaps, duplicates, or reordering.
- After expansion, keep a quiet `Show latest 3 days` or `Show latest 7 days` action, including when every day is visible.
- Reset disclosure when the selected month changes; do not persist it.

### Responsive and accessibility boundary

- Keep one normal document scroll.
- Keep interactive targets at least 44px.
- Verify 320px, desktop, and 640×400 as a 200%-zoom equivalent.
- Keep focus predictable after reveal and collapse.
- Do not rely on tomato color alone for exact meaning.

## What changes now and what waits

**Change now:** add an explicit visual-hierarchy requirement to the active feature: a flat two-value summary led by a labeled Month total with Pomodoros attached as its unit, with focused time as a smaller supporting line and active-day counts reserved for disclosure context. Use chronological paper-journal order with a latest 3/7 visible window, a top caret for earlier-day disclosure, and a latest-window collapse; this is the approved product preference even though several references use reverse chronology.

**Wait:** if future usage shows that people frequently search for arbitrary old dates, consider a dedicated all-activity view that combines a compact month overview with date navigation. That should be a separate feature decision, not more content packed into Home.
