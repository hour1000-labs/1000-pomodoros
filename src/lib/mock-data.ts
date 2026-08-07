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

const HOUR = 60 * 60 * 1_000;
const DAY = 24 * HOUR;

export function buildSampleGuitarData(referenceDate: Date = new Date()) {
  const refTime = Math.floor(referenceDate.getTime() / (60 * 1_000)) * (60 * 1_000);

  const journeyCreatedAt = new Date(refTime - 30 * DAY).toISOString();

  const earlierDayOffsets = [
    28, 28, 27, 27, 25, 25, 24, 24, 23, 23, 21, 21, 20, 20, 19, 19, 17, 17, 16, 16, 15, 15, 13, 13,
    12, 12, 11, 11, 10, 10, 9, 9, 8, 8, 8, 8,
  ];

  const sessionEndTimes: string[] = [];
  for (let i = 0; i < 36; i++) {
    const dayOffset = earlierDayOffsets[i] ?? 0;
    const hourOffset = i % 2 === 0 ? 0.5 : 1.5;
    sessionEndTimes.push(new Date(refTime - (dayOffset * 24 + hourOffset) * HOUR).toISOString());
  }

  sessionEndTimes.push(new Date(refTime - (4 * 24 + 1.5) * HOUR).toISOString()); // session 37
  sessionEndTimes.push(new Date(refTime - (4 * 24 + 0.5) * HOUR).toISOString()); // session 38
  sessionEndTimes.push(new Date(refTime - (2 * 24 + 2.5) * HOUR).toISOString()); // session 39
  sessionEndTimes.push(new Date(refTime - (2 * 24 + 1.5) * HOUR).toISOString()); // session 40
  sessionEndTimes.push(new Date(refTime - (2 * 24 + 0.5) * HOUR).toISOString()); // session 41
  sessionEndTimes.push(new Date(refTime - 1.5 * HOUR).toISOString()); // session 42
  sessionEndTimes.push(new Date(refTime - 0.5 * HOUR).toISOString()); // session 43

  const lastActiveAt = sessionEndTimes.at(-1) ?? journeyCreatedAt;

  const journey: Journey = {
    id: LEARN_GUITAR_JOURNEY_ID,
    name: 'Learn guitar',
    reason: 'I want to play acoustic guitar at campfires and family gatherings.',
    targetMinutes: 1_000 * 60,
    status: 'active',
    createdAt: journeyCreatedAt,
    updatedAt: lastActiveAt,
    lastActiveAt,
  };

  const nextSteps: NextStep[] = [
    {
      id: 'next-step-posture-tuning',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Posture, tuning & open E minor chord',
      description: 'Learn holding posture, tuner app usage, and clean E minor finger placement.',
      status: 'completed',
      position: 0,
      createdAt: journeyCreatedAt,
      completedAt: sessionEndTimes[3] ?? journeyCreatedAt,
    },
    {
      id: 'next-step-open-am-c',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Learn open A minor & C major chords',
      description: 'Master clean finger placement for Am and C major chords.',
      status: 'completed',
      position: 1,
      createdAt: sessionEndTimes[4] ?? journeyCreatedAt,
      completedAt: sessionEndTimes[9] ?? journeyCreatedAt,
    },
    {
      id: 'next-step-c-g-transitions',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Master clean C to G chord transitions',
      description: 'Practice switching between C and G major smoothly at 60 BPM.',
      status: 'completed',
      position: 2,
      createdAt: sessionEndTimes[10] ?? journeyCreatedAt,
      completedAt: sessionEndTimes[15] ?? journeyCreatedAt,
    },
    {
      id: 'next-step-strumming-4-4',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Master 4/4 down-strumming rhythm',
      description: 'Practice steady down-strums with metronome at 70 BPM.',
      status: 'completed',
      position: 3,
      createdAt: sessionEndTimes[16] ?? journeyCreatedAt,
      completedAt: sessionEndTimes[19] ?? journeyCreatedAt,
    },
    {
      id: 'next-step-first-song',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Play first 2-chord song ("Horse With No Name")',
      description: 'Play through verse and chorus with steady rhythm.',
      status: 'completed',
      position: 4,
      createdAt: sessionEndTimes[20] ?? journeyCreatedAt,
      completedAt: sessionEndTimes[29] ?? journeyCreatedAt,
    },
    {
      id: LEARN_GUITAR_CURRENT_STEP_ID,
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Practice the F chord transition',
      description: 'Master mini-F chord shape and clean transitions from C and Am.',
      status: 'current',
      position: 5,
      createdAt: sessionEndTimes[30] ?? journeyCreatedAt,
      completedAt: null,
    },
    {
      id: 'next-step-strumming-pattern',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Practice the verse strumming pattern',
      description: 'Master down-up strumming accents at 80 BPM.',
      status: 'upcoming',
      position: 6,
      createdAt: sessionEndTimes[30] ?? journeyCreatedAt,
      completedAt: null,
    },
    {
      id: 'next-step-play-first-song',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      title: 'Play the first song from start to finish',
      description: 'Play "Knockin\' on Heaven\'s Door" with full rhythm.',
      status: 'upcoming',
      position: 7,
      createdAt: sessionEndTimes[30] ?? journeyCreatedAt,
      completedAt: null,
    },
  ];

  const sessionSpecs: Array<{ nextStepId: string; reflection: string }> = [
    {
      nextStepId: 'next-step-posture-tuning',
      reflection:
        'Tuned all 6 strings using a tuner app. Holding the pick feels awkward, but fingertips are getting used to steel strings.',
    },
    {
      nextStepId: 'next-step-posture-tuning',
      reflection:
        'Practiced holding open E minor (Em). Making sure fingers press right behind the frets.',
    },
    {
      nextStepId: 'next-step-posture-tuning',
      reflection:
        'Worked on eliminating thumb soreness and keeping wrist straight. E minor sounds clean now!',
    },
    {
      nextStepId: 'next-step-posture-tuning',
      reflection: 'Fingertips are a bit tender today, kept practice short and focused on posture.',
    },
    {
      nextStepId: 'next-step-open-am-c',
      reflection: 'Introduced A minor (Am). Finger placement is tricky on string 2.',
    },
    {
      nextStepId: 'next-step-open-am-c',
      reflection: 'Practiced switching between Em and Am. Calluses are starting to form!',
    },
    {
      nextStepId: 'next-step-open-am-c',
      reflection: "Started C major. Arching fingers so the high E string doesn't get muted.",
    },
    {
      nextStepId: 'next-step-open-am-c',
      reflection: 'Sluggish transitions, but clarity of each string is improving.',
    },
    {
      nextStepId: 'next-step-open-am-c',
      reflection: 'Slow anchor finger placement for C major. No buzz on B string!',
    },
    {
      nextStepId: 'next-step-open-am-c',
      reflection: 'Earned 10 pomodoros! Open Em, Am, and C chords all sound resonant.',
    },
    {
      nextStepId: 'next-step-c-g-transitions',
      reflection: 'Introduced G major chord with ring & pinky fingers. Big hand stretch!',
    },
    {
      nextStepId: 'next-step-c-g-transitions',
      reflection: 'Practicing C to G change. Keeping index finger low to transition faster.',
    },
    {
      nextStepId: 'next-step-c-g-transitions',
      reflection: '60 BPM metronome practice switching C and G every 4 beats.',
    },
    {
      nextStepId: 'next-step-c-g-transitions',
      reflection: 'Getting smoother! Only slight pause on beat 4.',
    },
    {
      nextStepId: 'next-step-c-g-transitions',
      reflection: 'No longer looking down at fingers on every C -> G transition.',
    },
    {
      nextStepId: 'next-step-c-g-transitions',
      reflection: 'Clean transitions 10 times in a row without buzzing!',
    },
    {
      nextStepId: 'next-step-strumming-4-4',
      reflection: '4/4 steady down-strumming: Down, Down, Down, Down. Keeping wrist relaxed.',
    },
    {
      nextStepId: 'next-step-strumming-4-4',
      reflection: 'Practicing steady volume across all strings on down-strums.',
    },
    {
      nextStepId: 'next-step-strumming-4-4',
      reflection: 'Combining down-strums with C -> G progression.',
    },
    {
      nextStepId: 'next-step-strumming-4-4',
      reflection: 'Rhythm is locked in at 70 BPM. Strumming feels smooth and effortless.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Learning the two chords for "Horse With No Name" (Em and D6add9/F#).',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Easy chord shift! Just moving two fingers down one string.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Strumming pattern: Down... Down Up... Up Down Up.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Counting aloud "1, 2 and, and 4 and" to stay on beat.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Played verse continuously for 5 minutes without breaking rhythm!',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Singing along quietly while playing. Coordinating hands and voice.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Focused on clean dynamics and smooth accent on beat 2.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Played full song start to finish with backing track.',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'Recorded myself playing — timing sounds solid!',
    },
    {
      nextStepId: 'next-step-first-song',
      reflection: 'First song completed! Ready for new challenges.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Started learning mini-F chord (first two strings barred). Huge step!',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Building index finger barre pressure on strings 1 & 2.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'B string buzzed a bit; adjusted index finger tilt slightly sideways.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Mini F chord cleanly voicing all 4 strings now!',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: "Practicing C to F transition. It's tough, but index finger shape is holding.",
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: '30 clean C -> F chord changes. Speed is picking up.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'G to F transition practice. Pinky finger placement getting accurate.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Four chord loop: C - Am - F - G at 50 BPM.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Hand fatigue set in after 20 mins; took short stretches between reps.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Metronome at 60 BPM. F chord lands on beat 1 consistently.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'C - Am - F - G progression feels much more natural now.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Index finger barre strength is noticeably better today.',
    },
    {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: 'Almost mastered F chord transitions! 43 pomodoros strong!',
    },
  ];

  const focusSessions: FocusSession[] = sessionEndTimes.map((endedAt, index) => {
    const endedAtTime = new Date(endedAt).getTime();
    const spec = sessionSpecs[index] ?? {
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      reflection: '',
    };

    return {
      id: `session-learn-guitar-${String(index + 1).padStart(2, '0')}`,
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: spec.nextStepId,
      plannedMinutes: 25,
      focusedMinutes: 25,
      status: 'completed',
      source: 'timer',
      startedAt: new Date(endedAtTime - 25 * 60 * 1_000).toISOString(),
      endedAt,
      reflection: spec.reflection,
    };
  });

  const milestones: Milestone[] = [
    {
      id: 'milestone-learn-guitar-10-pomodoros',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      name: '10 pomodoros',
      targetFocusedMinutes: 10 * 25,
      earnedAt: sessionEndTimes[9] ?? journeyCreatedAt,
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

  const weeklyGoal: WeeklyGoal = {
    id: 'weekly-goal-all-journeys',
    journeyId: null,
    targetPomodoros: 10,
    weekStartsOn: 1,
    createdAt: new Date(refTime - 7 * DAY).toISOString(),
  };

  return {
    journey,
    nextSteps,
    focusSessions,
    milestones,
    weeklyGoal,
  };
}

const defaultData = buildSampleGuitarData();

export const learnGuitarJourney: Journey = defaultData.journey;
export const learnGuitarNextSteps: NextStep[] = defaultData.nextSteps;
export const learnGuitarFocusSessions: FocusSession[] = defaultData.focusSessions;
export const learnGuitarMilestones: Milestone[] = defaultData.milestones;
export const learnGuitarWeeklyGoal: WeeklyGoal = defaultData.weeklyGoal;

export const learnGuitarMockData = {
  journey: learnGuitarJourney,
  nextSteps: learnGuitarNextSteps,
  focusSessions: learnGuitarFocusSessions,
  milestones: learnGuitarMilestones,
  weeklyGoal: learnGuitarWeeklyGoal,
};

export function createEmptyAppState(): AppState {
  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    journeys: [],
    nextSteps: [],
    focusSessions: [],
    milestones: [],
    weeklyGoal: null,
    onboardingDraft: null,
    activeTimer: null,
    lastActiveJourneyId: null,
    lastCompletedSessionId: null,
  };
}

export function createSampleAppState(referenceDate?: Date): AppState {
  const data = referenceDate ? buildSampleGuitarData(referenceDate) : buildSampleGuitarData();

  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    journeys: [{ ...data.journey }],
    nextSteps: data.nextSteps.map((nextStep) => ({ ...nextStep })),
    focusSessions: data.focusSessions.map((session) => ({ ...session })),
    milestones: data.milestones.map((milestone) => ({ ...milestone })),
    weeklyGoal: { ...data.weeklyGoal },
    onboardingDraft: null,
    activeTimer: null,
    lastActiveJourneyId: LEARN_GUITAR_JOURNEY_ID,
    lastCompletedSessionId: data.focusSessions.at(-1)?.id ?? null,
  };
}

/**
 * Retained as a fixture alias for existing tests that need the representative Journey state.
 */
export function createSeedAppState(referenceDate?: Date): AppState {
  return createSampleAppState(referenceDate);
}

export function createMilestoneReachedAppState(referenceDate?: Date): AppState {
  const base = createSampleAppState(referenceDate);
  const refTime = new Date(base.journeys[0]?.updatedAt ?? Date.now()).getTime();
  const milestoneSessionEndTimes = Array.from({ length: 60 }, (_, index) =>
    new Date(refTime - (60 - index) * DAY).toISOString()
  );
  const focusSessions: FocusSession[] = milestoneSessionEndTimes.map((endedAt, index) => {
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
  });
  const earnedAt = referenceDate
    ? (milestoneSessionEndTimes.at(-1) ?? '2026-07-12T18:25:00.000Z')
    : '2026-07-12T18:25:00.000Z';
  const m0 = base.milestones[0] ?? {
    id: 'milestone-learn-guitar-10-pomodoros',
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    name: '10 pomodoros',
    targetFocusedMinutes: 250,
    earnedAt: null,
  };
  const m1 = base.milestones[1] ?? {
    id: LEARN_GUITAR_25_HOUR_MILESTONE_ID,
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    name: '25 focused hours',
    targetFocusedMinutes: 1500,
    earnedAt: null,
  };
  const m2 = base.milestones[2] ?? {
    id: 'milestone-learn-guitar-50-hours',
    journeyId: LEARN_GUITAR_JOURNEY_ID,
    name: '50 focused hours',
    targetFocusedMinutes: 3000,
    earnedAt: null,
  };
  const reachedMilestone: Milestone = {
    ...m1,
    earnedAt,
  };

  return {
    ...base,
    focusSessions,
    milestones: [{ ...m0 }, reachedMilestone, { ...m2 }],
    lastCompletedSessionId: focusSessions.at(-1)?.id ?? null,
  };
}
