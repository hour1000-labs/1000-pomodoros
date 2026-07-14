import {
  APP_STATE_SCHEMA_VERSION,
  type AppState,
  type FocusSession,
  type Journey,
  type Milestone,
  type NextStep,
  type WeeklyGoal,
} from './models';

export const LEARN_GUITAR_JOURNEY_ID = 'journey-learn-guitar';
export const LEARN_GUITAR_CURRENT_STEP_ID = 'next-step-f-chord';
export const LEARN_GUITAR_25_HOUR_MILESTONE_ID = 'milestone-learn-guitar-25-hours';

export const learnGuitarJourney: Journey = {
  id: LEARN_GUITAR_JOURNEY_ID,
  name: 'Learn guitar',
  reason: 'I want to play my favorite songs confidently.',
  targetMinutes: 1_000 * 60,
  status: 'active',
  createdAt: '2026-05-20T18:00:00.000Z',
  updatedAt: '2026-07-12T18:25:00.000Z',
  lastActiveAt: '2026-07-12T18:25:00.000Z',
};

export const learnGuitarNextSteps: NextStep[] = [
  {
    id: LEARN_GUITAR_CURRENT_STEP_ID,
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    title: 'Practice the F chord transition',
    description: '',
    status: 'current',
    position: 0,
    createdAt: '2026-07-08T17:30:00.000Z',
    completedAt: null,
  },
  {
    id: 'next-step-strumming-pattern',
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    title: 'Practice the verse strumming pattern',
    description: '',
    status: 'upcoming',
    position: 1,
    createdAt: '2026-07-08T17:35:00.000Z',
    completedAt: null,
  },
  {
    id: 'next-step-play-first-song',
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    title: 'Play the first song from start to finish',
    description: '',
    status: 'upcoming',
    position: 2,
    createdAt: '2026-07-08T17:40:00.000Z',
    completedAt: null,
  },
];

function createCompletedSession(endedAt: string, index: number): FocusSession {
  const endedAtTime = new Date(endedAt).getTime();

  return {
    id: `session-learn-guitar-${String(index + 1).padStart(2, '0')}`,
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
    plannedMinutes: 25,
    focusedMinutes: 25,
    status: 'completed',
    source: 'timer',
    startedAt: new Date(endedAtTime - 25 * 60 * 1_000).toISOString(),
    endedAt,
    reflection: '',
  };
}

const earlierSessionEndTimes = Array.from({ length: 36 }, (_, index) =>
  new Date(Date.UTC(2026, 4, 20 + index, 18, 25)).toISOString()
);

const thisWeekSessionEndTimes = [
  '2026-07-08T17:25:00.000Z',
  '2026-07-08T18:25:00.000Z',
  '2026-07-10T16:25:00.000Z',
  '2026-07-10T17:25:00.000Z',
  '2026-07-10T18:25:00.000Z',
  '2026-07-12T17:25:00.000Z',
  '2026-07-12T18:25:00.000Z',
];

export const learnGuitarFocusSessions: FocusSession[] = [
  ...earlierSessionEndTimes,
  ...thisWeekSessionEndTimes,
].map(createCompletedSession);

export const learnGuitarMilestones: Milestone[] = [
  {
    id: 'milestone-learn-guitar-10-pomodoros',
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    name: '10 pomodoros',
    targetFocusedMinutes: 10 * 25,
    earnedAt: '2026-05-29T18:25:00.000Z',
  },
  {
    id: LEARN_GUITAR_25_HOUR_MILESTONE_ID,
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    name: '25 focused hours',
    targetFocusedMinutes: 25 * 60,
    earnedAt: null,
  },
  {
    id: 'milestone-learn-guitar-50-hours',
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    name: '50 focused hours',
    targetFocusedMinutes: 50 * 60,
    earnedAt: null,
  },
];

export const learnGuitarWeeklyGoal: WeeklyGoal = {
  id: 'weekly-goal-all-journeys',
  journeyId: null,
  targetPomodoros: 10,
  weekStartsOn: 1,
  createdAt: '2026-07-06T07:00:00.000Z',
};

export const learnGuitarMockData = {
  journey: learnGuitarJourney,
  nextSteps: learnGuitarNextSteps,
  focusSessions: learnGuitarFocusSessions,
  milestones: learnGuitarMilestones,
  weeklyGoal: learnGuitarWeeklyGoal,
};

export function createSeedAppState(): AppState {
  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    journeys: [{ ...learnGuitarJourney }],
    nextSteps: learnGuitarNextSteps.map((nextStep) => ({ ...nextStep })),
    focusSessions: learnGuitarFocusSessions.map((session) => ({ ...session })),
    milestones: learnGuitarMilestones.map((milestone) => ({ ...milestone })),
    weeklyGoal: { ...learnGuitarWeeklyGoal },
    onboardingDraft: null,
    activeTimer: null,
    lastActiveJourneyId: LEARN_GUITAR_JOURNEY_ID,
    lastCompletedSessionId: learnGuitarFocusSessions.at(-1)?.id ?? null,
  };
}

export function createMilestoneReachedAppState(): AppState {
  const milestoneSessionEndTimes = Array.from({ length: 60 }, (_, index) =>
    new Date(Date.UTC(2026, 4, 14 + index, 18, 25)).toISOString()
  );
  const focusSessions = milestoneSessionEndTimes.map(createCompletedSession);
  const reachedMilestone: Milestone = {
    ...learnGuitarMilestones[1],
    earnedAt: '2026-07-12T18:25:00.000Z',
  };

  return {
    ...createSeedAppState(),
    focusSessions,
    milestones: [
      { ...learnGuitarMilestones[0] },
      reachedMilestone,
      { ...learnGuitarMilestones[2] },
    ],
    lastCompletedSessionId: focusSessions.at(-1)?.id ?? null,
  };
}
