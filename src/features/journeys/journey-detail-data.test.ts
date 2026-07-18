import { describe, expect, it } from 'vitest';

import {
  createSeedAppState,
  LEARN_GUITAR_25_HOUR_MILESTONE_ID,
  LEARN_GUITAR_CURRENT_STEP_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { FocusSession } from '@/lib/models';

import { deriveJourneyDetailData } from './journey-detail-data';

function requireJourneyDetailData(state = createSeedAppState()) {
  const data = deriveJourneyDetailData(state, LEARN_GUITAR_JOURNEY_ID);

  if (data === null) {
    throw new Error('Expected Journey detail data');
  }

  return data;
}

describe('deriveJourneyDetailData', () => {
  it('derives the seeded metrics, sorted milestone progress, and target sections', () => {
    const state = createSeedAppState();
    state.milestones.reverse();
    const data = requireJourneyDetailData(state);

    expect(data.progress).toMatchObject({
      focusedMinutes: 1_075,
      totalPomodoros: 43,
      fullPomodoros: 43,
      partialMinutes: 0,
    });
    expect(data.sortedMilestones.map(({ targetFocusedMinutes }) => targetFocusedMinutes)).toEqual([
      250, 1_500, 3_000,
    ]);
    expect(data.currentMilestone?.id).toBe(LEARN_GUITAR_25_HOUR_MILESTONE_ID);
    expect(data.nextMilestone?.targetFocusedMinutes).toBe(3_000);
    expect(data.nextMilestonePercentage).toBe(72);
    expect(data.remainingPomodoros).toBe(17);
    expect(data.targetBlocks).toBe(2_400);
    expect(data.totalBlocks).toBe(2_400);
    expect(data.totalSections).toBe(24);
    expect(data.currentSectionIndex).toBe(0);
    expect(data.currentSectionStart).toBe(0);
    expect(data.currentSectionCount).toBe(100);
    expect(data.latestIndex).toBe(42);
    expect(data.milestoneIndexes).toEqual([9, 59, 119, 2_399]);
  });

  it('derives the current and upcoming steps plus the three most recent Journey sessions', () => {
    const state = createSeedAppState();
    state.nextSteps.reverse();
    const data = requireJourneyDetailData(state);

    expect(data.currentStep?.id).toBe(LEARN_GUITAR_CURRENT_STEP_ID);
    expect(data.upcomingSteps.map(({ id }) => id)).toEqual([
      'next-step-strumming-pattern',
      'next-step-play-first-song',
    ]);
    expect(data.recentSessions).toHaveLength(3);
    expect(data.recentSessions.map(({ session }) => session.id)).toEqual([
      'session-learn-guitar-43',
      'session-learn-guitar-42',
      'session-learn-guitar-41',
    ]);
    expect(data.recentSessions[0]?.nextStepTitle).toBe('Practice the F chord transition');
  });

  it('splits blocks chronologically across multiple timer and manual sessions', () => {
    const state = createSeedAppState();
    const sessions: FocusSession[] = [
      {
        id: 'session-third',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: 'next-step-strumming-pattern',
        plannedMinutes: 30,
        focusedMinutes: 30,
        status: 'completed',
        source: 'timer',
        startedAt: '2026-07-17T11:30:00.000Z',
        endedAt: '2026-07-17T12:00:00.000Z',
        reflection: '',
      },
      {
        id: 'session-first',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
        plannedMinutes: 10,
        focusedMinutes: 10,
        status: 'completed',
        source: 'timer',
        startedAt: '2026-07-17T09:50:00.000Z',
        endedAt: '2026-07-17T10:00:00.000Z',
        reflection: '',
      },
      {
        id: 'session-second-manual',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: null,
        plannedMinutes: 20,
        focusedMinutes: 20,
        status: 'completed',
        source: 'manual',
        startedAt: '2026-07-17T10:40:00.000Z',
        endedAt: '2026-07-17T11:00:00.000Z',
        reflection: '',
      },
      {
        id: 'session-other-journey',
        journeyId: 'journey-other',
        nextStepId: null,
        plannedMinutes: 25,
        focusedMinutes: 25,
        status: 'completed',
        source: 'manual',
        startedAt: '2026-07-17T12:35:00.000Z',
        endedAt: '2026-07-17T13:00:00.000Z',
        reflection: '',
      },
    ];
    state.focusSessions = sessions;
    const data = requireJourneyDetailData(state);

    expect(data.progress.focusedMinutes).toBe(60);
    expect(data.latestIndex).toBe(2);
    expect(data.getBlockContributions(0)).toEqual([
      {
        sessionId: 'session-first',
        date: '2026-07-17T10:00:00.000Z',
        focusedMinutes: 10,
        contributionMinutes: 10,
        nextStepTitle: 'Practice the F chord transition',
        source: 'timer',
      },
      {
        sessionId: 'session-second-manual',
        date: '2026-07-17T11:00:00.000Z',
        focusedMinutes: 20,
        contributionMinutes: 15,
        nextStepTitle: null,
        source: 'manual',
      },
    ]);
    expect(data.getBlockContributions(1)).toEqual([
      expect.objectContaining({
        sessionId: 'session-second-manual',
        contributionMinutes: 5,
        source: 'manual',
      }),
      expect.objectContaining({ sessionId: 'session-third', contributionMinutes: 20 }),
    ]);
    expect(data.getBlockContributions(2)).toEqual([
      expect.objectContaining({ sessionId: 'session-third', contributionMinutes: 10 }),
    ]);
    expect(data.getBlockContributions(3)).toEqual([]);
    expect(data.recentSessions.map(({ session }) => session.id)).toEqual([
      'session-third',
      'session-second-manual',
      'session-first',
    ]);
  });

  it('keeps partial and exact milestone-boundary progress honest', () => {
    const state = createSeedAppState();
    const session: FocusSession = {
      id: 'session-near-milestone',
      journeyId: LEARN_GUITAR_JOURNEY_ID,
      nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
      plannedMinutes: 1_499,
      focusedMinutes: 1_499,
      status: 'completed',
      source: 'manual',
      startedAt: '2026-07-17T10:00:00.000Z',
      endedAt: '2026-07-17T11:00:00.000Z',
      reflection: '',
    };
    state.focusSessions = [session];

    const nearMilestone = requireJourneyDetailData(state);
    expect(nearMilestone.progress).toMatchObject({
      totalPomodoros: 1_499 / 25,
      fullPomodoros: 59,
      partialMinutes: 24,
      partialPomodoro: 24 / 25,
    });
    expect(nearMilestone.currentMilestone?.targetFocusedMinutes).toBe(1_500);
    expect(nearMilestone.nextMilestonePercentage).toBe(99);
    expect(nearMilestone.remainingPomodoros).toBe(1);

    state.focusSessions = [{ ...session, focusedMinutes: 1_500 }];
    const exactMilestone = requireJourneyDetailData(state);
    expect(exactMilestone.currentMilestone?.targetFocusedMinutes).toBe(3_000);
    expect(exactMilestone.nextMilestonePercentage).toBe(50);
    expect(exactMilestone.remainingPomodoros).toBe(60);
  });

  it('uses the progress-bearing target section and keeps the final section target-derived', () => {
    const state = createSeedAppState();
    state.journeys[0] = { ...state.journeys[0], targetMinutes: 230 * 25 };
    state.focusSessions = [
      {
        id: 'session-large-import',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
        plannedMinutes: 210 * 25,
        focusedMinutes: 210 * 25,
        status: 'completed',
        source: 'manual',
        startedAt: '2026-07-17T10:00:00.000Z',
        endedAt: '2026-07-17T11:00:00.000Z',
        reflection: '',
      },
    ];
    const data = requireJourneyDetailData(state);

    expect(data.totalBlocks).toBe(230);
    expect(data.totalSections).toBe(3);
    expect(data.latestIndex).toBe(209);
    expect(data.currentSectionIndex).toBe(2);
    expect(data.currentSectionStart).toBe(200);
    expect(data.currentSectionCount).toBe(30);
  });

  it('keeps progress beyond the Journey target visible and inspectable', () => {
    const state = createSeedAppState();
    state.focusSessions = [
      {
        id: 'session-beyond-target',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        nextStepId: LEARN_GUITAR_CURRENT_STEP_ID,
        plannedMinutes: 2_425 * 25,
        focusedMinutes: 2_425 * 25,
        status: 'completed',
        source: 'manual',
        startedAt: '2026-07-17T10:00:00.000Z',
        endedAt: '2026-07-17T11:00:00.000Z',
        reflection: '',
      },
    ];
    const data = requireJourneyDetailData(state);

    expect(data.targetBlocks).toBe(2_400);
    expect(data.totalBlocks).toBe(2_425);
    expect(data.totalSections).toBe(25);
    expect(data.currentSectionIndex).toBe(24);
    expect(data.currentSectionStart).toBe(2_400);
    expect(data.currentSectionCount).toBe(25);
    expect(data.latestIndex).toBe(2_424);
    expect(data.getBlockContributions(2_424)).toEqual([
      expect.objectContaining({ sessionId: 'session-beyond-target', contributionMinutes: 25 }),
    ]);
  });

  it('returns honest empty data and null for an unknown Journey', () => {
    const state = createSeedAppState();
    state.focusSessions = [];
    state.nextSteps = [];
    state.milestones = [];
    const data = requireJourneyDetailData(state);

    expect(data.progress.focusedMinutes).toBe(0);
    expect(data.currentMilestone).toMatchObject({
      name: 'Journey target',
      targetFocusedMinutes: 60_000,
    });
    expect(data.nextMilestone).toBeNull();
    expect(data.nextMilestonePercentage).toBe(0);
    expect(data.remainingPomodoros).toBe(2_400);
    expect(data.currentStep).toBeNull();
    expect(data.upcomingSteps).toEqual([]);
    expect(data.recentSessions).toEqual([]);
    expect(data.latestIndex).toBeNull();
    expect(data.getBlockContributions(0)).toEqual([]);
    expect(deriveJourneyDetailData(state, 'missing-journey')).toBeNull();
  });
});
