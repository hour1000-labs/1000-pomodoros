import { describe, expect, it } from 'vitest';

import {
  createEmptyAppState,
  createSeedAppState,
  LEARN_GUITAR_25_HOUR_MILESTONE_ID,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { FocusSession, Journey, NextStep } from '@/lib/models';

import { deriveHomeData } from './home-data';

const LOCAL_SEED_NOW = new Date(2026, 6, 12, 12);

function createJourney({
  id,
  lastActiveAt,
  name = id,
  status = 'active',
}: {
  id: string;
  lastActiveAt: string;
  name?: string;
  status?: Journey['status'];
}): Journey {
  return {
    id,
    name,
    reason: '',
    targetMinutes: 1_000,
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: lastActiveAt,
    lastActiveAt,
  };
}

function createNextStep({
  id,
  journeyId,
  status = 'current',
}: {
  id: string;
  journeyId: string;
  status?: NextStep['status'];
}): NextStep {
  return {
    id,
    journeyId,
    title: `Step ${id}`,
    description: '',
    status,
    position: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
    completedAt: null,
  };
}

function createSession({
  endedAt,
  focusedMinutes = 25,
  id,
  journeyId = LEARN_GUITAR_JOURNEY_ID,
  nextStepId = LEARN_GUITAR_CURRENT_STEP_ID,
  startedAt = '2026-07-12T16:00:00.000Z',
  status = 'completed',
}: {
  endedAt: string | null;
  focusedMinutes?: number;
  id: string;
  journeyId?: string;
  nextStepId?: string | null;
  startedAt?: string;
  status?: FocusSession['status'];
}): FocusSession {
  return {
    id,
    journeyId,
    nextStepId,
    plannedMinutes: focusedMinutes,
    focusedMinutes,
    status,
    source: 'timer',
    startedAt,
    endedAt,
    reflection: '',
  };
}

describe('deriveHomeData', () => {
  it('derives the seeded Home values at local noon on July 12, 2026', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const data = deriveHomeData(state, LOCAL_SEED_NOW);

    expect(data.continueJourney?.journey.id).toBe(LEARN_GUITAR_JOURNEY_ID);
    expect(data.continueJourney?.currentStep?.id).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
    expect(data.continueJourney?.progress).toMatchObject({
      focusedMinutes: 1_075,
      fullPomodoros: 43,
      partialMinutes: 0,
    });
    expect(data.continueJourney?.currentMilestone?.id).toBe(LEARN_GUITAR_25_HOUR_MILESTONE_ID);
    expect(data.continueJourney?.currentMilestonePercentage).toBe(72);
    expect(data.activeJourneys).toHaveLength(1);
    expect(data.hasJourneyOutsidePreview).toBe(false);
    expect(data.today).toEqual({
      completedPomodoros: 2,
      focusedMinutes: 50,
    });
    expect(data.weekly).toEqual({
      completedPomodoros: 7,
      focusedMinutes: 175,
      targetPomodoros: 10,
      remainingPomodoros: 3,
      activeDays: 3,
    });
    expect(data.recentSessions.map(({ session }) => session.id)).toEqual([
      'session-learn-guitar-43',
      'session-learn-guitar-42',
      'session-learn-guitar-41',
    ]);
    expect(data.recentSessions[0]).toMatchObject({
      journeyName: 'Learn guitar',
      nextStepTitle: 'Practice the F chord transition',
    });
    expect(data.hasCompletedActivity).toBe(true);
  });

  it('puts the valid last-active pointer first, then caps recent active Journeys at two', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    state.journeys = [
      {
        ...state.journeys[0],
        lastActiveAt: '2026-07-01T00:00:00.000Z',
      },
      createJourney({
        id: 'journey-most-recent',
        lastActiveAt: '2026-07-11T00:00:00.000Z',
      }),
      createJourney({
        id: 'journey-next-most-recent',
        lastActiveAt: '2026-07-10T00:00:00.000Z',
      }),
      createJourney({
        id: 'journey-paused',
        lastActiveAt: '2026-07-12T00:00:00.000Z',
        status: 'paused',
      }),
    ];

    const pointerFirst = deriveHomeData(state, LOCAL_SEED_NOW);
    expect(pointerFirst.activeJourneys.map(({ journey }) => journey.id)).toEqual([
      LEARN_GUITAR_JOURNEY_ID,
      'journey-most-recent',
    ]);
    expect(pointerFirst.hasJourneyOutsidePreview).toBe(true);

    state.lastActiveJourneyId = 'journey-paused';
    const inactivePointerIgnored = deriveHomeData(state, LOCAL_SEED_NOW);
    expect(inactivePointerIgnored.activeJourneys.map(({ journey }) => journey.id)).toEqual([
      'journey-most-recent',
      'journey-next-most-recent',
    ]);
    expect(inactivePointerIgnored.hasJourneyOutsidePreview).toBe(true);
  });

  it('uses only a deterministic current Next step and never falls back to upcoming work', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    state.nextSteps = [
      {
        ...createNextStep({
          id: 'current-later',
          journeyId: LEARN_GUITAR_JOURNEY_ID,
        }),
        position: 1,
        createdAt: '2026-07-02T00:00:00.000Z',
      },
      {
        ...createNextStep({
          id: 'current-first',
          journeyId: LEARN_GUITAR_JOURNEY_ID,
        }),
        position: 1,
        createdAt: '2026-07-01T00:00:00.000Z',
      },
      {
        ...createNextStep({
          id: 'upcoming-position-zero',
          journeyId: LEARN_GUITAR_JOURNEY_ID,
          status: 'upcoming',
        }),
        position: 0,
      },
    ];

    expect(deriveHomeData(state, LOCAL_SEED_NOW).continueJourney?.currentStep?.id).toBe(
      'current-first'
    );

    state.nextSteps = state.nextSteps.map((nextStep) => ({
      ...nextStep,
      status: 'upcoming',
    }));
    expect(deriveHomeData(state, LOCAL_SEED_NOW).continueJourney?.currentStep).toBeNull();
  });

  it('isolates progress, current milestones, and current steps for each Journey summary', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const primaryJourney = {
      ...state.journeys[0],
      lastActiveAt: '2026-07-12T17:00:00.000Z',
    };
    const otherJourney = createJourney({
      id: 'journey-portfolio',
      lastActiveAt: '2026-07-12T18:00:00.000Z',
      name: 'Build my portfolio',
    });
    const primaryStep = {
      ...createNextStep({
        id: 'step-primary-current',
        journeyId: primaryJourney.id,
      }),
      title: 'Practice chord changes',
    };
    const otherStep = {
      ...createNextStep({
        id: 'step-portfolio-current',
        journeyId: otherJourney.id,
      }),
      title: 'Write the case study',
    };
    state.journeys = [primaryJourney, otherJourney];
    state.nextSteps = [primaryStep, otherStep];
    state.milestones = [
      {
        id: 'milestone-primary-50',
        journeyId: primaryJourney.id,
        name: 'Primary 50 minutes',
        targetFocusedMinutes: 50,
        earnedAt: null,
      },
      {
        id: 'milestone-portfolio-100',
        journeyId: otherJourney.id,
        name: 'Portfolio 100 minutes',
        targetFocusedMinutes: 100,
        earnedAt: null,
      },
    ];
    state.focusSessions = [
      createSession({
        id: 'session-primary',
        journeyId: primaryJourney.id,
        nextStepId: primaryStep.id,
        endedAt: '2026-07-12T17:00:00.000Z',
        focusedMinutes: 25,
      }),
      createSession({
        id: 'session-portfolio',
        journeyId: otherJourney.id,
        nextStepId: otherStep.id,
        endedAt: '2026-07-12T18:00:00.000Z',
        focusedMinutes: 75,
      }),
    ];

    const summaries = new Map(
      deriveHomeData(state, LOCAL_SEED_NOW).activeJourneys.map((summary) => [
        summary.journey.id,
        summary,
      ])
    );

    expect(summaries.get(primaryJourney.id)).toMatchObject({
      currentStep: { id: primaryStep.id },
      progress: { focusedMinutes: 25 },
      currentMilestone: {
        id: 'milestone-primary-50',
        journeyId: primaryJourney.id,
      },
      currentMilestonePercentage: 50,
    });
    expect(summaries.get(otherJourney.id)).toMatchObject({
      currentStep: { id: otherStep.id },
      progress: { focusedMinutes: 75 },
      currentMilestone: {
        id: 'milestone-portfolio-100',
        journeyId: otherJourney.id,
      },
      currentMilestonePercentage: 75,
    });
  });

  it('derives Today app-wide from countable sessions while preserving partial minutes', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const otherJourney = createJourney({
      id: 'journey-other',
      lastActiveAt: '2026-07-11T00:00:00.000Z',
    });
    state.journeys.push(otherJourney);
    state.focusSessions = [
      createSession({
        id: 'session-primary-partial',
        endedAt: '2026-07-12T17:00:00.000Z',
        focusedMinutes: 12,
      }),
      createSession({
        id: 'session-other-partial',
        journeyId: otherJourney.id,
        nextStepId: null,
        endedAt: '2026-07-12T18:00:00.000Z',
        focusedMinutes: 18,
      }),
      createSession({
        id: 'session-under-minimum',
        journeyId: otherJourney.id,
        nextStepId: null,
        endedAt: '2026-07-12T18:30:00.000Z',
        focusedMinutes: 4,
      }),
      createSession({
        id: 'session-running',
        journeyId: otherJourney.id,
        nextStepId: null,
        endedAt: null,
        focusedMinutes: 25,
        status: 'running',
      }),
      createSession({
        id: 'session-cancelled',
        journeyId: otherJourney.id,
        nextStepId: null,
        endedAt: '2026-07-12T19:00:00.000Z',
        focusedMinutes: 25,
        status: 'cancelled',
      }),
    ];

    const data = deriveHomeData(state, LOCAL_SEED_NOW);

    expect(data.today).toEqual({
      completedPomodoros: 1,
      focusedMinutes: 30,
    });
    expect(data.weekly).toMatchObject({
      completedPomodoros: 1,
      focusedMinutes: 30,
      activeDays: 1,
    });
    expect(data.continueJourney?.progress).toMatchObject({
      focusedMinutes: 12,
      fullPomodoros: 0,
      partialMinutes: 12,
    });
  });

  it('honors weekly Journey scope and week start, clamps over-goal progress, and allows no goal', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const otherJourney = createJourney({
      id: 'journey-other',
      lastActiveAt: '2026-07-11T00:00:00.000Z',
    });
    state.journeys.push(otherJourney);
    state.focusSessions.push(
      createSession({
        id: 'session-other-this-week',
        journeyId: otherJourney.id,
        nextStepId: null,
        endedAt: '2026-07-07T18:00:00.000Z',
        focusedMinutes: 100,
      })
    );
    state.weeklyGoal = {
      ...state.weeklyGoal,
      id: 'goal-learn-guitar',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      targetPomodoros: 3,
      weekStartsOn: 1,
      createdAt: '2026-07-01T00:00:00.000Z',
    };

    expect(deriveHomeData(state, LOCAL_SEED_NOW).weekly).toEqual({
      completedPomodoros: 7,
      focusedMinutes: 175,
      targetPomodoros: 3,
      remainingPomodoros: 0,
      activeDays: 3,
    });

    state.weeklyGoal = {
      ...state.weeklyGoal,
      id: 'goal-all-journeys-sunday',
      journeyId: null,
      targetPomodoros: 10,
      weekStartsOn: 0,
    };
    expect(deriveHomeData(state, LOCAL_SEED_NOW).weekly).toEqual({
      completedPomodoros: 2,
      focusedMinutes: 50,
      targetPomodoros: 10,
      remainingPomodoros: 8,
      activeDays: 1,
    });

    state.weeklyGoal = null;
    expect(deriveHomeData(state, LOCAL_SEED_NOW).weekly).toBeNull();
  });

  it('keeps only the three newest valid global sessions and resolves multi-Journey labels', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const otherJourney = createJourney({
      id: 'journey-portfolio',
      lastActiveAt: '2026-07-13T00:00:00.000Z',
      name: 'Build my portfolio',
    });
    const otherStep = {
      ...createNextStep({
        id: 'step-case-study',
        journeyId: otherJourney.id,
        status: 'completed',
      }),
      title: 'Refine the case study intro',
    };
    state.journeys.push(otherJourney);
    state.nextSteps.push(otherStep);
    state.focusSessions = [
      createSession({
        id: 'session-invalid-end',
        endedAt: 'not-a-date',
        startedAt: '2026-07-14T16:00:00.000Z',
      }),
      createSession({
        id: 'session-start-fallback',
        endedAt: null,
        startedAt: '2026-07-14T15:00:00.000Z',
      }),
      createSession({
        id: 'session-portfolio',
        journeyId: otherJourney.id,
        nextStepId: otherStep.id,
        endedAt: '2026-07-14T14:00:00.000Z',
      }),
      createSession({
        id: 'session-missing-references',
        journeyId: 'journey-missing',
        nextStepId: 'step-missing',
        endedAt: '2026-07-14T13:00:00.000Z',
      }),
      createSession({
        id: 'session-fourth',
        endedAt: '2026-07-14T12:00:00.000Z',
      }),
    ];

    const recentSessions = deriveHomeData(state, LOCAL_SEED_NOW).recentSessions;

    expect(recentSessions.map(({ session }) => session.id)).toEqual([
      'session-start-fallback',
      'session-portfolio',
      'session-missing-references',
    ]);
    expect(recentSessions[0]).toMatchObject({
      journeyName: 'Learn guitar',
      nextStepTitle: 'Practice the F chord transition',
    });
    expect(recentSessions[1]).toMatchObject({
      journeyName: 'Build my portfolio',
      nextStepTitle: 'Refine the case study intro',
    });
    expect(recentSessions[2]).toMatchObject({
      journeyName: null,
      nextStepTitle: null,
    });
  });

  it('excludes under-five-minute, running, and cancelled sessions from recent activity', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    state.focusSessions = [
      createSession({
        id: 'session-countable',
        endedAt: '2026-07-14T12:00:00.000Z',
      }),
      createSession({
        id: 'session-under-five',
        endedAt: '2026-07-14T13:00:00.000Z',
        focusedMinutes: 4,
      }),
      createSession({
        id: 'session-running',
        endedAt: '2026-07-14T14:00:00.000Z',
        status: 'running',
      }),
      createSession({
        id: 'session-cancelled',
        endedAt: '2026-07-14T15:00:00.000Z',
        status: 'cancelled',
      }),
    ];

    expect(
      deriveHomeData(state, LOCAL_SEED_NOW).recentSessions.map(({ session }) => session.id)
    ).toEqual(['session-countable']);
  });

  it('does not label a recent session with a Next step from another Journey', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const otherJourney = createJourney({
      id: 'journey-other',
      lastActiveAt: '2026-07-13T00:00:00.000Z',
    });
    const otherStep = createNextStep({
      id: 'step-other',
      journeyId: otherJourney.id,
    });
    state.journeys.push(otherJourney);
    state.nextSteps.push(otherStep);
    state.focusSessions = [
      createSession({
        id: 'session-cross-journey-step',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: otherStep.id,
        endedAt: '2026-07-14T12:00:00.000Z',
      }),
    ];

    expect(deriveHomeData(state, LOCAL_SEED_NOW).recentSessions[0]).toMatchObject({
      session: { id: 'session-cross-journey-step' },
      journeyName: 'Learn guitar',
      nextStepTitle: null,
    });
  });

  it('flags zero activity for the Continue Journey even when another Journey has activity', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const otherJourney = createJourney({
      id: 'journey-other',
      lastActiveAt: '2026-07-11T00:00:00.000Z',
    });
    state.journeys.push(otherJourney);
    state.focusSessions = [
      createSession({
        id: 'session-other',
        journeyId: otherJourney.id,
        nextStepId: null,
        endedAt: '2026-07-12T18:00:00.000Z',
      }),
    ];

    const data = deriveHomeData(state, LOCAL_SEED_NOW);

    expect(data.continueJourney?.journey.id).toBe(LEARN_GUITAR_JOURNEY_ID);
    expect(data.continueJourney?.progress.focusedMinutes).toBe(0);
    expect(data.today.completedPomodoros).toBe(1);
    expect(data.recentSessions).toHaveLength(1);
    expect(data.hasCompletedActivity).toBe(false);

    state.journeys = state.journeys.map((journey) => ({ ...journey, status: 'paused' }));
    const noActiveJourneys = deriveHomeData(state, LOCAL_SEED_NOW);
    expect(noActiveJourneys.continueJourney).toBeNull();
    expect(noActiveJourneys.activeJourneys).toEqual([]);
    expect(noActiveJourneys.hasCompletedActivity).toBe(false);
  });

  it('derives the global streak from timer and manual sessions and leaves a new local day open', () => {
    const state = createSeedAppState(LOCAL_SEED_NOW);
    const july11End = new Date(2026, 6, 11, 12).toISOString();
    const july12End = new Date(2026, 6, 12, 12).toISOString();
    state.focusSessions = [
      createSession({
        id: 'streak-timer-july-11',
        endedAt: july11End,
        startedAt: new Date(2026, 6, 11, 11, 35).toISOString(),
        focusedMinutes: 25,
      }),
      {
        ...createSession({
          id: 'streak-manual-july-12',
          endedAt: july12End,
          startedAt: new Date(2026, 6, 12, 11, 55).toISOString(),
          focusedMinutes: 5,
        }),
        source: 'manual',
      },
    ];

    const completedToday = deriveHomeData(state, new Date(2026, 6, 12, 23, 59));
    expect(completedToday.streak).toMatchObject({
      currentStreak: 2,
      freezesAvailable: 0,
      todayState: 'practiced',
      totalPracticedDays: 2,
    });

    const afterLocalMidnight = deriveHomeData(state, new Date(2026, 6, 13, 0, 1));
    expect(afterLocalMidnight.streak).toMatchObject({
      currentStreak: 2,
      freezesAvailable: 0,
      todayState: 'open',
      totalPracticedDays: 2,
    });

    state.focusSessions = [];
    expect(deriveHomeData(state, LOCAL_SEED_NOW).streak).toMatchObject({
      currentStreak: 0,
      todayState: 'not-started',
      totalPracticedDays: 0,
    });
  });

  it.each([
    {
      name: 'no saved Journeys',
      statuses: [] as Journey['status'][],
      expectedPreviewCount: 0,
      expectedOmitted: false,
    },
    {
      name: 'one active Journey',
      statuses: ['active'] as Journey['status'][],
      expectedPreviewCount: 1,
      expectedOmitted: false,
    },
    {
      name: 'two active Journeys',
      statuses: ['active', 'active'] as Journey['status'][],
      expectedPreviewCount: 2,
      expectedOmitted: false,
    },
    {
      name: 'three active Journeys',
      statuses: ['active', 'active', 'active'] as Journey['status'][],
      expectedPreviewCount: 2,
      expectedOmitted: true,
    },
    {
      name: 'an inactive Journey beside one active Journey',
      statuses: ['active', 'paused'] as Journey['status'][],
      expectedPreviewCount: 1,
      expectedOmitted: true,
    },
    {
      name: 'an inactive Journey beyond a full active preview',
      statuses: ['active', 'active', 'archived'] as Journey['status'][],
      expectedPreviewCount: 2,
      expectedOmitted: true,
    },
    {
      name: 'only inactive Journeys',
      statuses: ['paused', 'completed'] as Journey['status'][],
      expectedPreviewCount: 0,
      expectedOmitted: true,
    },
  ])('reports whether the Home preview omits a saved Journey with $name', ({
    expectedOmitted,
    expectedPreviewCount,
    statuses,
  }) => {
    const state = createEmptyAppState();
    state.journeys = statuses.map((status, index) =>
      createJourney({
        id: `journey-${status}-${index}`,
        lastActiveAt: new Date(Date.UTC(2026, 6, 10 + index)).toISOString(),
        status,
      })
    );

    const data = deriveHomeData(state, LOCAL_SEED_NOW);

    expect(data.activeJourneys).toHaveLength(expectedPreviewCount);
    expect(data.hasJourneyOutsidePreview).toBe(expectedOmitted);
  });
});
