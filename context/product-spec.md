# **1000 Pomodoros — Product Specification**

**Status:** Product discovery \- nothing in this document is final until we agree on it.  
**Working title:** 1000 Pomodoros  
**Created by:** hour1000-labs  
**Version:** 0.1  
**Purpose of this document:** Define what the product should do before making technical or database decisions.

---

# **1\. Product Summary**

1000 Pomodoros is a deliberate-practice tracker that helps people build skills through focused work.

Every completed focus session becomes a visible pomodoro. Over time, users build a visual record of the effort they have invested into a skill, project, or long-term goal.

The product should make focused effort feel tangible.

Instead of only showing a number such as “42 hours completed,” the app should let users see the work stacking up one session at a time.

## **One-line description**

A visual focus tracker that turns deliberate practice into visible progress toward mastery.

## **Core promise**

1000 Pomodoros helps users answer four questions:

1. What am I trying to improve?  
2. What should I work on next?  
3. How much focused effort have I invested?  
4. Am I consistently moving forward?

## **Core idea**

One pomodoro represents one focused work session.

Users choose a skill or project, select their next step, complete a session, and add another pomodoro to their journey.

---

# **2\. Product Vision**

The long-term vision is to create a personal command center for deliberate practice.

Users should be able to track the work they put into:

* Learning a language  
* Practicing an instrument  
* Becoming a better developer  
* Building a business  
* Improving at a competitive game  
* Writing a book  
* Learning to draw  
* Preparing for an exam  
* Developing any complex skill

The product should feel motivating without becoming childish, manipulative, or overloaded with gamification.

It should feel like a beautiful record of effort.

---

# **3\. Problem**

Long-term improvement is difficult because progress often feels invisible.

Someone may practice guitar for weeks, study JavaScript for months, or work on a business every evening without feeling like they are getting anywhere.

Existing productivity tools commonly have several problems:

* They focus more on planning than doing.  
* They require too much setup and maintenance.  
* They show tasks completed, but not meaningful effort invested.  
* They are either too complicated or too simple.  
* They do not make long-term progress emotionally satisfying.  
* They encourage users to organize work without helping them start.  
* They make users manage multiple separate systems for tasks, notes, goals, and time tracking.

1000 Pomodoros should focus on follow-through.

The product should help users turn large goals into visible reps.

---

# **4\. Target Users**

## **Primary target user**

Someone actively trying to improve a skill or complete a meaningful long-term project.

## **Example users**

* A developer learning React or system design  
* A guitarist practicing consistently  
* A student preparing for an exam  
* A language learner  
* A content creator practicing storytelling  
* An artist learning illustration  
* A competitive gamer practicing mechanics or reviewing matches  
* An indie hacker building a product  
* A job seeker preparing for interviews

## **Common traits**

The target user:

* Has a skill or project they care about  
* Wants to stay consistent  
* Likes visual progress  
* Struggles with motivation or follow-through  
* Does not want a complicated productivity system  
* Wants to know where their time is going  
* Believes improvement comes through repeated focused effort

---

# **5\. Jobs to Be Done**

Users use 1000 Pomodoros to:

* Turn a large goal into manageable work sessions  
* Decide what to work on next  
* Start focused work quickly  
* Record focused effort  
* Stay consistent over weeks and months  
* See progress visually  
* Review what they have accomplished  
* Build confidence that their effort is accumulating  
* Avoid losing track of long-term goals

---

# **6\. Product Principles**

## **6.1 Doing over organizing**

The app should help users begin working.

Users should not need to create complicated systems before starting a session.

## **6.2 Progress must be visible**

Every completed session should produce immediate visual feedback.

## **6.3 One clear next action**

The interface should make the next useful action obvious.

## **6.4 Low friction**

Starting a session should take only a few seconds.

## **6.5 Simple before powerful**

The first version should not attempt to replace Todoist, Notion, Google Calendar, and every other productivity tool.

## **6.6 Meaningful motivation**

The app should motivate users through genuine progress rather than fake currencies or excessive rewards.

## **6.7 Honest tracking**

The product should allow flexibility without encouraging users to inflate their time.

## **6.8 Calm design**

The experience should feel focused, polished, and uncluttered.

---

# **7\. Core Product Loop**

The main loop is:

1. Choose a skill or project.  
2. Select the next thing to work on.  
3. Start a focus session.  
4. Complete focused work.  
5. Record what was accomplished.  
6. Add progress to the visual pomodoro tracker.  
7. Choose the next step.  
8. Return for another session.

This loop is the center of the product.

Every feature should strengthen at least one part of this loop.

---

# **8\. Product Terminology**

Consistent language should be used throughout the product.

## **Journey**

A long-term skill, project, or goal the user is working toward.

Examples:

* Learn Spanish  
* Become a stronger frontend developer  
* Practice guitar  
* Build 1000 Pomodoros  
* Improve storytelling

**Recommended term:** Journey

“Journey” is broad enough to support both skills and projects.

## **Pomodoro**

A completed 25-minute unit of focused work.

One pomodoro equals 25 focused minutes.

## **Focus session**

The active period during which the user works.

A session may contain:

* One pomodoro  
* Multiple pomodoros  
* A custom amount of time

## **Next step**

The specific task or action the user plans to work on next.

Examples:

* Practice the F chord transition  
* Complete the authentication screen  
* Review 20 Spanish vocabulary cards  
* Write the landing-page headline

## **Milestone**

A meaningful point in the journey.

Examples:

* First pomodoro  
* 10 pomodoros  
* 100 pomodoros  
* 10 hours  
* 25 hours  
* 100 hours  
* 500 hours (1000 pomodoros, if including the 5 minute breaks after the 25 mins)  
* 1,000 hours  
* 5,000 hours  
* 10,000 hours

---

# **9\. Pomodoro Rules**

## **Standard unit**

* One pomodoro equals 25 minutes.  
* Four pomodoros equal 100 minutes.  
* Forty pomodoros equal 1,000 minutes.  
* 2,400 pomodoros equal 1,000 hours.

## **Session lengths**

Recommended options:

* 25 minutes  
* 50 minutes  
* Custom duration

## **Progress conversion**

* A 25-minute session fills one pomodoro.  
* A 50-minute session fills two pomodoros.  
* Partial time contributes toward the next pomodoro.  
* Progress should be stored and displayed in minutes, even though the visual interface uses pomodoros.

## **Recommended behavior**

* Sessions of at least five minutes may count.  
* Users may finish early.  
* Users may continue beyond the timer.  
* Partial sessions still contribute actual focused minutes. (Should partial sessions fill tomato partially?)  
* Manually entered time is allowed.  
* Manual time should be labeled differently from timer-recorded time.

---

# **10\. Main Product Objects**

This section describes the concepts users interact with. It does not define technical implementation.

## **10.1 User**

The person using the product.

A user may have:

* Multiple journeys  
* Focus sessions  
* Next steps  
* Milestones  
* Preferences  
* Progress history

## **10.2 Journey**

A skill, project, or meaningful goal.

Each journey may include:

* Name  
* Description  
* Icon  
* Color  
* Category  
* Reason for pursuing it  
* Target number of hours or pomodoros  
* Start date  
* Current next step  
* Upcoming next steps  
* Completed next steps  
* Total focused time  
* Visual progress  
* Milestones  
* Session history  
* Status

Possible statuses:

* Active  
* Paused  
* Completed  
* Archived

## **10.3 Next step**

A lightweight task connected to a journey.

Each next step may include:

* Title  
* Optional description  
* Status  
* Position in the list  
* Date created  
* Date completed  
* Related focus sessions

Possible statuses:

* Upcoming  
* Current  
* Completed  
* Skipped

## **10.4 Focus session**

A period of focused work.

Each session may include:

* Journey  
* Selected next step  
* Planned duration  
* Actual duration  
* Start time  
* End time  
* Paused time  
* Completion state  
* Optional reflection  
* Optional focus rating  
* Optional difficulty rating  
* Whether it was timed or manually entered

## **10.5 Milestone**

A progress marker.

Milestones should be:

* Automatically generated

Examples:

* First pomodoro  
* 10 pomodoros  
* 100 pomodoros  
* 10 hours  
* 25 hours  
* 100 hours  
* 500 hours (1000 pomodoros, if including the 5 minute breaks after the 25 mins)  
* 1,000 hours  
* 5,000 hours  
* 10,000 hours

---

# **11\. Core Features**

# **11.1 Onboarding**

The onboarding experience should help the user reach their first focus session quickly.

## **User goals**

The user should be able to:

* Understand the product  
* Create their first journey  
* Define why it matters  
* Add a first next step  
* Start focusing

## **Suggested onboarding flow**

### **Step 1: Create a journey**

Question:

What do you want to make progress on?

Examples:

* Learn guitar  
* Build my portfolio  
* Learn Spanish  
* Improve at chess

### **Step 2: Add motivation**

Question:

Why does this matter to you?

This should be optional but encouraged.

### **Step 3: Choose a target**

Options:

* 10 hours  
* 25 hours  
* 100 hours  
* 250 hours  
* 500 hours  
* 1,000 hours  
* Custom

### **Step 4: Add the first next step**

Question:

What is the next thing you can work on?

### **Step 5: Start the first session**

Primary button:

Start first pomodoro

## **Onboarding principle**

The user should finish onboarding by doing work, not by landing on an empty dashboard.

---

# **11.2 Journey Creation**

The user should be able to create a journey.

## **Required fields**

* Journey name

## **Optional fields**

* Description  
* Reason  
* Icon  
* Color  
* Category  
* Target  
* Start date

## **Suggested categories**

* Coding  
* Music  
* Language  
* Fitness  
* Creative  
* Career  
* Education  
* Gaming  
* Business  
* Personal  
* Other

## **Recommended defaults**

* Target: 1,000 hours  
* First milestone: 10 pomodoros  
* Status: Active

The interface should make the 1,000-hour goal aspirational without making smaller goals feel meaningless.

---

# **11.3 Journey Page**

Every journey should have its own dedicated page.

## **Main content**

* Journey name  
* Icon and color  
* Reason for pursuing it  
* Total pomodoros  
* Total focused time  
* Percentage toward target  
* Current milestone  
* Next milestone  
* Visual pomodoro tracker  
* Current next step  
* Start-focus button  
* Upcoming next steps  
* Recent sessions  
* Personal milestones

## **Primary action**

Start focusing

The primary action should remain visible and easy to access.

---

# **11.4 Next Steps**

Each journey should include a lightweight action list.

## **User capabilities**

The user can:

* Add a next step  
* Edit a next step  
* Delete a next step  
* Reorder next steps  
* Select the current next step  
* Mark a next step complete  
* Skip a next step  
* View completed next steps  
* Continue an unfinished next step

## **Product constraint**

This should not become a full task manager.

## **Not included initially**

* Subtasks  
* Dependencies  
* Priority levels  
* Labels  
* Kanban boards  
* Complex recurring tasks  
* Team assignments  
* Detailed due-date workflows

## **Suggested interaction**

The user should always see one recommended current next step.

Example:

Up next: Build the journey-card component

Buttons:

* Start focus session  
* Change next step

---

# **11.5 Focus Timer**

The focus timer is one of the core product experiences.

## **User capabilities**

The user can:

* Choose a journey  
* Choose a next step  
* Choose a duration (default 25 mins)  
* Start  
* Pause  
* Resume  
* Finish early  
* Cancel  
* Run overtime (should be a toggleable setting, default should end the focus session)  
* Complete the session

## **Timer display**

The focus screen should show:

* Remaining time  
* Journey name  
* Current next step  
* Pause button  
* Finish button (only when paused)  
* Cancel option (maybe only show for like 10-15 seconds after starting, so the user can cancel the session if they accidentally started it)  
* Minimal supporting information

## **Focus mode principles**

* No unnecessary navigation  
* No analytics  
* No distracting animations  
* No large task list  
* No unrelated notifications

## **Session states**

* Ready  
* Running  
* Paused  
* Completed  
* Cancelled  
* Interrupted (not sure when this would be applicable)  
* Overtime (maybe redundant?)

## **Recommended timer options**

* 25 minutes  
* 50 minutes  
* Custom

## **Questions to confirm**

* Should users be able to hide the timer? Maybe not for version 1  
* Should ambient sounds be included? Maybe not for version 1  
* Should the app support full-screen mode? Sure  
* Should users receive browser notifications? Maybe not for version 1  
* Should break timers be part of version one? Maybe not for version 1

## **Recommended version-one decisions**

* Timer can be hidden.  
* Completion sound is optional.  
* Browser notifications are optional.  
* Full-screen mode is supported.  
* Break timers are not required for version one.  
* Ambient sound is not included initially.

---

# **11.6 Session Completion**

At the end of a session, the user should receive immediate progress feedback.

## **Completion screen**

Show:

* Session duration  
* Number of pomodoros earned  
* Journey  
* Next step  
* Updated total  
* Current milestone progress  
* Visual progress animation

## **Optional questions**

* What did you accomplish?  
* What should you work on next?  
* How focused were you?  
* How difficult was the work?  
* (Feel like these optional questions aren’t necessary to have after a session)

## **Recommended required fields**

None.

Users should not be forced to write a report before receiving credit.

## **Recommended optional inputs**

* Short reflection  
* Next step  
* Focus rating from one to five

## **Example confirmation**

Two pomodoros complete.

You added 50 focused minutes to JavaScript.

You are now 72% of the way to your 25-hour milestone.

---

# **11.7 Visual Pomodoro Tracker**

The visual tracker is the main product hook.

## **Purpose**

It should make long-term effort feel visible and satisfying.

## **Recommended representation**

A grid of pomodoros or progress blocks.

## **Rules**

* One full block equals 25 minutes.  
* A 50-minute session fills two blocks.  
* Partial progress fills part of the next block.  
* Completed milestones appear visually distinct.  
* The user can inspect when a pomodoro was completed. (can click on individual tomato and it will give details like date, and what the user worked on, maybe like a modal popup)  
* The latest session should be easy to identify.

## **Viewing levels**

### **Current section**

Shows the user’s most recent progress.

### **Milestone view**

Shows progress toward the next milestone.

### **Full journey view**

Shows the entire path toward the final target.

## **Example scale**

For 1,000 hours:

* 2,400 pomodoros  
* Grouped into manageable sections  
* Possible grouping:  
  * 10 pomodoros per row  
  * 100 pomodoros per page or section  
  * 24 major sections total

## **Important design requirement**

The full 1,000-hour target should feel large but not discouraging.

The user should focus on the next milestone while still being able to see the full journey.

---

# **11.8 Home Screen**

The home screen should answer:

1. What should I work on?  
2. What have I completed recently?  
3. Am I staying consistent?

## **Recommended sections**

### **Continue**

Show:

* Most recent journey  
* Current next step  
* Start-focus button

### **Today**

Show:

* Pomodoros completed  
* Focused minutes  
* Active journeys

### **Active journeys**

Each journey card may show:

* Name  
* Current milestone  
* Total pomodoros  
* Current next step  
* Recent activity  
* Start button

### **Weekly progress**

Show:

* Pomodoros completed this week  
* Active days  
* Progress toward weekly goal

### **Recent sessions**

Show the most recent completed sessions.

## **Constraint**

The home screen should not become a dense analytics dashboard.

---

# **11.9 Journey Library**

The user should be able to view all journeys.

## **Sections**

* Active  
* Paused  
* Completed  
* Archived

## **Journey card information**

* Journey name  
* Icon  
* Total hours  
* Total pomodoros  
* Current milestone  
* Current next step  
* Last session date

## **User actions**

* Open  
* Start session  
* Pause  
* Archive  
* Restore  
* Mark complete

---

# **11.10 Session History**

The user should be able to review past work.

## **Each session should show**

* Date  
* Time  
* Journey  
* Next step  
* Duration  
* Pomodoros earned  
* Reflection  
* Focus rating  
* Timed or manual label

## **User actions**

* View details  
* Edit reflection  
* Correct duration  
* Change journey  
* Change next step  
* Delete session

## **Recommended rules**

* Users can correct mistakes.  
* Manually added or edited sessions should receive a small label.  
* There should be no punishment for editing.  
* Deleted time should be removed from progress totals.

---

# **11.11 Manual Time Entry**

Users may sometimes practice away from the app.

Examples:

* Guitar lesson  
* Gym session  
* Offline study  
* Coding while the timer was not open  
* Language class

## **User capabilities**

The user can add:

* Journey  
* Date  
* Duration  
* Next step or activity  
* Optional reflection

## **Display**

Manual entries should count toward progress but be labeled:

Added manually

This distinction keeps the record transparent without blocking legitimate use.

---

# **11.12 Milestones**

Milestones break the 1,000-hour journey into manageable goals.

## **Automatic milestones**

Recommended examples:

* First pomodoro  
* 10 pomodoros  
* 25 pomodoros  
* 100 pomodoros  
* 10 hours  
* 25 hours  
* 50 hours  
* 100 hours  
* 250 hours  
* 500 hours  
* 1,000 hours

## **Personal milestones**

The user may create milestone goals such as:

* Learn first full song  
* Build first React app  
* Complete beginner Spanish course  
* Ship the product beta  
* Reach a specific chess rating

## **Milestone celebration**

When reached, show:

* Milestone name  
* Time invested  
* Date reached  
* Short celebration  
* Share option  
* Next milestone

Celebrations should feel meaningful rather than excessive.

---

# **11.13 Weekly Goal**

Users may set a weekly focus target.

## **Examples**

* Four pomodoros per week  
* Ten pomodoros per week  
* Five hours per week

## **Display**

Show:

* Completed amount  
* Remaining amount  
* Days left  
* Current pace

## **Recommended version-one behavior**

* Weekly goals are optional.  
* Goals may apply to all journeys or one specific journey.  
* Missing a goal should not produce guilt-heavy messaging.

---

# **11.14 Basic Statistics**

The first version should include only statistics that help users understand their effort.

## **Recommended statistics**

* Pomodoros completed today  
* Pomodoros completed this week  
* Total pomodoros  
* Total focused hours  
* Active days this week  
* Average session length  
* Most active journey  
* Current weekly goal  
* Longest active streak  
* Recent consistency  
* Maybe an active daily streak? that will increase by 1 as long as the does one session for any journey

## **Not required initially**

* Complex trend charts  
* Predictive estimates  
* Deep productivity scoring  
* Comparisons against other users  
* AI-generated analysis

---

# **11.15 Search and Filtering**

Users with multiple journeys and many sessions may need simple filtering.

## **Possible filters**

* Journey  
* Date range  
* Timed sessions  
* Manual sessions  
* Completed next step  
* Duration

## **Recommended version-one scope**

* Filter history by journey  
* Filter history by date  
* Search next steps

---

# **11.16 Settings**

## **Timer settings**

* Default duration  
* Completion sound  
* Browser notifications  
* Show or hide timer  
* Allow overtime

## **Appearance**

* Light mode  
* Dark mode  
* System default  
* Reduced motion

## **Account**

* Name  
* Email  
* Timezone  
* Export data  
* Delete account

## **Product preferences**

* Default home journey  
* Weekly goal  
* Start-of-week preference  
* Time display format

---

# **12\. Main Screens**

## **Public screens**

1. Landing page  
2. Sign-up  
3. Login  
4. Password recovery

## **Onboarding screens**

5. Create first journey  
6. Add reason  
7. Choose target  
8. Add next step  
9. Start first session

## **Main application screens**

10. Home  
11. Journey library  
12. Journey details  
13. Create journey  
14. Edit journey  
15. Focus timer  
16. Session completion  
17. Session history  
18. Session details  
19. Add manual session  
20. Milestones  
21. Statistics  
22. Settings

---

# **13\. Landing Page Specification**

## **Main goal**

Explain the product quickly and encourage the user to begin.

## **Hero**

### **Headline**

Turn focused work into visible progress.

### **Supporting text**

Complete pomodoros, build skills, and see every hour you invest on the path toward mastery.

### **Primary action**

Start your first journey

### **Secondary action**

See how it works

## **Product demonstration**

Show:

* A journey  
* A focus timer  
* A growing pomodoro grid  
* A milestone being reached

## **Key benefits**

* Know what to work on next  
* Stay consistent  
* See your effort accumulate  
* Build meaningful skills

## **Social proof**

Not required before real users exist.

Do not use fake testimonials or fake user counts.

---

# **14\. User Flows**

# **14.1 New User Flow**

1. User opens landing page.  
2. User understands the concept.  
3. User creates an account.  
4. User creates a journey.  
5. User enters why it matters.  
6. User chooses a target.  
7. User adds a next step.  
8. User starts a focus session.  
9. User completes the session.  
10. User receives their first pomodoro.  
11. User sees the visual progress tracker.  
12. User chooses the next step.

## **Success condition**

The user completes their first pomodoro.

---

# **14.2 Returning User Flow**

1. User opens the app.  
2. User sees their most recent journey.  
3. User sees the current next step.  
4. User presses Start.  
5. User completes the session.  
6. Progress updates.  
7. User adds or confirms the next step.  
8. User leaves.

## **Target experience**

A returning user should be able to begin focusing within ten seconds.

---

# **14.3 Multiple Journey Flow**

1. User opens the journey library.  
2. User chooses a journey.  
3. User reviews its current next step.  
4. User starts a session.  
5. Time is added to that journey only.  
6. Journey progress updates.

---

# **14.4 Manual Session Flow**

1. User selects Add past session.  
2. User chooses a journey.  
3. User enters the date.  
4. User enters the duration.  
5. User optionally adds the activity and reflection.  
6. Progress updates.  
7. Session is labeled as manual.

---

# **14.5 Interrupted Session Flow**

1. User starts a session.  
2. User pauses or leaves.  
3. User returns.  
4. The app shows the correct current state.  
5. User resumes, finishes, or cancels.  
6. Actual focused time is recorded.

---

# **14.6 Completed Journey Flow**

1. User reaches the final target.  
2. The app celebrates the achievement.  
3. The user sees total time and history.  
4. The user may:  
   * Continue beyond the target  
   * Increase the target  
   * Mark the journey complete  
   * Archive it  
   * Start a new journey

---

# **15\. Empty States**

Empty states should guide users toward action.

## **Empty home**

What do you want to make progress on?

Button:

Create your first journey

## **Empty next-step list**

Every strong session starts with a clear next step.

Button:

Add next step

## **Empty history**

Your completed sessions will appear here.

Button:

Start first pomodoro

## **No activity this week**

Your next pomodoro starts the streak.

Button:

Start focusing

---

# **16\. Notifications and Reminders (maybe only for mobile app?)**

Notifications should help users return to meaningful work. 

## **Possible reminders**

* Planned focus-session reminder  
* Weekly goal progress  
* Journey inactivity reminder  
* Unfinished next-step reminder  
* Weekly recap  
* Milestone reached

## **Example reminder**

Your next Guitar step is practicing the F chord transition.

## **Rules**

* Notifications are optional.  
* The user controls frequency.  
* Avoid guilt-heavy language.  
* Avoid fake urgency.  
* Avoid repeated reminders during the same day.

## **Not allowed**

* “Your streak is about to die.”  
* “You failed your goal.”  
* “Everyone else is progressing.”  
* Excessive push notifications

---

# **17\. Motivation and Gamification**

Gamification should reinforce meaningful practice.

## **Recommended elements**

* Visible pomodoro grid  
* Milestones  
* Weekly goals  
* Personal streaks  
* Personal records  
* Shareable milestone cards  
* Completion animations

## **Avoid initially**

* Virtual currency  
* Loot boxes  
* Global rankings  
* Artificial experience systems  
* Punishing streak loss  
* Random rewards  
* Competitive time accumulation

## **Guiding principle**

Track time, but celebrate meaningful effort and outcomes.

---

# **18\. Social Features**

Social features are not required for the first version but may be valuable later.

## **Possible future features**

* Public profiles  
* Friends  
* Follow activity  
* Accountability partners  
* Shared focus rooms  
* Group goals  
* Journey sharing  
* Milestone cards  
* Private leaderboards  
* Community challenges

## **Main risk**

Social features may distract from focused work.

## **Recommended approach**

Start with shareable progress images before building a social network.

---

# **19\. Future Features**

## **Planning**

* Daily plan  
* Weekly plan  
* Calendar view  
* Scheduled sessions  
* Recurring next steps  
* Google Calendar integration

## **Reflection**

* Session journal  
* Weekly review  
* Monthly review  
* Progress photos  
* File attachments  
* Lessons learned  
* Searchable notes

## **Guidance**

* AI next-step recommendations  
* Practice-plan generation  
* Skill breakdowns  
* Plateau detection  
* Recommended drills  
* Progress summaries

## **Integrations**

* Todoist  
* Notion  
* GitHub  
* Google Calendar  
* Apple Calendar  
* Apple Health  
* Browser extension

## **Native apps**

* iOS application  
* Android application (want to prioritize iOS only first though)  
* Apple Watch timer  
* Home-screen widgets  
* Live Activities  
* Push notifications  
* Offline sessions

## **Collaboration**

* Shared journeys  
* Team projects  
* Group goals  
* Comments  
* Shared milestones  
* Coaching relationships

---

# **20\. Explicit Non-Goals for Version One**

Version one should not include:

* Full note-taking system  
* Full project-management system  
* Kanban boards  
* Team workspaces  
* Messaging  
* Social feed  
* Public leaderboards  
* AI coach  
* Calendar replacement  
* Habit tracking unrelated to journeys  
* Complex scheduling  
* Marketplace  
* Supplement tracking  
* Expense tracking  
* Complex achievements  
* Fake currency  
* Native mobile application  
* Advanced integrations

The first version should do one thing well:

Help someone complete and visualize focused practice.

---

# **21\. Recommended Version-One Scope**

## **Include**

* Account creation  
* Onboarding  
* Journey creation  
* Journey editing  
* Journey archiving  
* Personal reason or motivation  
* Target selection  
* Lightweight next-step list  
* 25-minute sessions  
* 50-minute sessions  
* Custom sessions  
* Start, pause, resume, finish, and cancel  
* Optional overtime  
* Session completion screen  
* Optional reflection  
* Visual pomodoro grid  
* Automatic milestones  
* Session history  
* Manual session entry  
* Weekly focus goal  
* Basic statistics  
* Mobile-responsive design  
* Light and dark modes  
* Timer sounds  
* Browser notifications

## **Exclude**

* Social feed  
* Friends  
* Shared rooms  
* AI coach  
* Full task manager  
* Full notes system  
* Calendar integration  
* Native mobile application  
* Global leaderboards  
* Team collaboration  
* Complex gamification  
* Advanced analytics

---

# **22\. Success Metrics**

## **Activation**

* Percentage of users who create a journey  
* Percentage who add a next step  
* Percentage who start a first session  
* Percentage who complete a first pomodoro  
* Time from sign-up to first completed pomodoro

## **Engagement**

* Pomodoros completed per user per week  
* Active days per week  
* Journeys used per week  
* Percentage of started sessions completed  
* Weekly goal completion rate

## **Retention**

* Users who return after one day  
* Users who return after seven days  
* Users who return after thirty days  
* Users who complete sessions in consecutive weeks

## **Product validation**

* Users say the visual tracker motivates them  
* Users understand what to do without explanation  
* Users return specifically to record more progress  
* Users care about preserving their history  
* Users share their progress  
* Users ask for more advanced planning or social features

---

# **23\. Version-One Success Criteria**

The first version is complete when a user can:

* Create an account  
* Create a journey  
* Explain why the journey matters  
* Choose a target  
* Add a next step  
* Start a focus session  
* Pause and resume  
* Finish or cancel  
* Receive progress based on actual time  
* See completed pomodoros visually  
* Review total hours  
* Reach milestones  
* View session history  
* Add a manual session  
* Correct an accidental entry  
* Manage multiple journeys  
* Set a weekly goal  
* Use the app on mobile and desktop  
* Return and immediately continue where they left off

---

# **24\. Product Decision Registry**

Confirmed and pending product decisions are tracked in
[`context/decisions.md`](decisions.md), which is authoritative when this
specification contains older alternatives or recommendations.

Before loading a feature, check the decision registry. A pending decision blocks
work only when it materially affects that feature's behavior, acceptance
criteria, data model, or user interface.

---

# **25\. Recommended Default Decisions**

These are historical recommendations from the original specification. They are
not authoritative when they differ from `context/decisions.md`; confirm or move
them into that registry before relying on them for implementation.

* Use “Journey” for a tracked skill or project.  
* One pomodoro equals 25 minutes.  
* Users may complete 25-, 50-, or custom-minute sessions.  
* Actual focused minutes count, including partial sessions.  
* Sessions shorter than five minutes do not count by default.  
* Users may add manual sessions.  
* Manual sessions are labeled.  
* Every journey has one current next step and an ordered list of upcoming steps.  
* Weekly goals are optional.  
* Streaks are included but are not punished when broken.  
* The main visualization is a grid of pomodoro blocks.  
* Users focus on the next milestone while being able to zoom out to the full journey.  
* Reflections are optional.  
* The first version remains private.  
* Shareable milestone cards may be added before full social features.  
* No AI features are required for version one.  
* No database or architecture decision is made until the product scope is approved.

---

# **26\. Next Steps**

## **Step 1: Review**

We should review this specification separately.

Each person should:

* Highlight features they consider essential  
* Mark features they think should be removed  
* Add missing user scenarios  
* Comment on unclear decisions  
* Rank the most important product experiences

## **Step 2: Resolve open decisions**

Meet and complete the checklist in Section 24\.

## **Step 3: Lock version one**

Create three lists:

### **Must have**

Required for launch.

### **Should have**

Valuable but removable if the timeline becomes tight.

### **Later**

Not included in version one.

## **Step 4: Create user flows**

Map the exact steps for:

* First-time onboarding  
* Starting a session  
* Completing a session  
* Managing a journey  
* Reviewing progress  
* Adding manual time

## **Step 5: Create wireframes**

Design the major screens before discussing architecture.

## **Step 6: Build a clickable prototype**

Test the core loop with potential users:

Choose journey → select next step → focus → complete → see progress.

## **Step 7: Finalize technical requirements**

Only after the product behavior and version-one scope are agreed upon should the team define:

* Application architecture  
* Authentication  
* Data persistence  
* Database  
* Hosting  
* API boundaries  
* Testing strategy
