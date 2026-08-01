import { describe, expect, it } from 'vitest';

import {
  createMilestoneReachedAppState,
  createSeedAppState,
  LEARN_GUITAR_25_HOUR_MILESTONE_ID,
  LEARN_GUITAR_JOURNEY_ID,
} from '@/lib/mock-data';
import type { FocusSession, Journey, Milestone } from '@/lib/models';

import { deriveMilestoneDetailData } from './milestone-detail-data';

describe('deriveMilestoneDetailData', () => {
  it('derives the seeded earned milestone, completed range, and next milestone progress', () => {
    const detail = deriveMilestoneDetailData(
      createMilestoneReachedAppState(),
      LEARN_GUITAR_25_HOUR_MILESTONE_ID
    );

    expect(detail).toMatchObject({
      targetPomodoros: 60,
      targetBlockCount: 60,
      milestoneSectionStartIndex: 0,
      milestoneSectionBlockCount: 60,
      focusedMinutes: 1_500,
      nextSectionMinutes: 1_500,
      nextSectionFocusedMinutes: 0,
      nextSectionPercentage: 0,
      remainingMinutes: 1_500,
    });
    expect(detail?.journey.id).toBe(LEARN_GUITAR_JOURNEY_ID);
    expect(detail?.nextMilestone?.name).toBe('50 focused hours');
  });

  it('returns null for missing, unearned, and orphaned milestones', () => {
    const unearnedState = createSeedAppState();
    expect(deriveMilestoneDetailData(unearnedState, LEARN_GUITAR_25_HOUR_MILESTONE_ID)).toBeNull();
    expect(deriveMilestoneDetailData(unearnedState, 'missing-milestone')).toBeNull();

    const orphanedState = createMilestoneReachedAppState();
    orphanedState.journeys = orphanedState.journeys.filter(
      ({ id }) => id !== LEARN_GUITAR_JOURNEY_ID
    );
    expect(deriveMilestoneDetailData(orphanedState, LEARN_GUITAR_25_HOUR_MILESTONE_ID)).toBeNull();
  });

  it('sorts later milestones within the same Journey and derives remaining eligible progress', () => {
    const state = createMilestoneReachedAppState();
    const otherJourney: Journey = {
      ...state.journeys[0],
      id: 'journey-other',
      name: 'Other Journey',
    };
    const extraEligibleSession: FocusSession = {
      ...state.focusSessions[0],
      id: 'session-extra-eligible',
      focusedMinutes: 125,
    };
    const tooShortSession: FocusSession = {
      ...extraEligibleSession,
      id: 'session-too-short',
      focusedMinutes: 4,
    };
    const cancelledSession: FocusSession = {
      ...extraEligibleSession,
      id: 'session-cancelled',
      focusedMinutes: 500,
      status: 'cancelled',
    };
    const otherJourneySession: FocusSession = {
      ...extraEligibleSession,
      id: 'session-other-journey',
      journeyId: otherJourney.id,
      focusedMinutes: 500,
    };
    const laterMilestones: Milestone[] = [
      {
        id: 'milestone-later-b',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        name: 'Later B',
        targetFocusedMinutes: 1_800,
        earnedAt: null,
      },
      {
        id: 'milestone-other-journey',
        journeyId: otherJourney.id,
        name: 'Other Journey milestone',
        targetFocusedMinutes: 1_600,
        earnedAt: null,
      },
      {
        id: 'milestone-later-a',
        journeyId: LEARN_GUITAR_JOURNEY_ID,
        name: 'Later A',
        targetFocusedMinutes: 1_800,
        earnedAt: null,
      },
    ];

    state.journeys.push(otherJourney);
    state.focusSessions.push(
      extraEligibleSession,
      tooShortSession,
      cancelledSession,
      otherJourneySession
    );
    state.milestones.push(...laterMilestones);

    const detail = deriveMilestoneDetailData(state, LEARN_GUITAR_25_HOUR_MILESTONE_ID);

    expect(detail?.focusedMinutes).toBe(1_625);
    expect(detail?.nextMilestone?.id).toBe('milestone-later-a');
    expect(detail?.nextSectionMinutes).toBe(300);
    expect(detail?.nextSectionFocusedMinutes).toBe(125);
    expect(detail?.nextSectionPercentage).toBeCloseTo(41.67, 2);
    expect(detail?.remainingMinutes).toBe(175);
  });

  it('handles an earned final milestone without inventing another target', () => {
    const state = createMilestoneReachedAppState();
    state.milestones = state.milestones.filter(
      ({ targetFocusedMinutes }) => targetFocusedMinutes <= 1_500
    );

    const detail = deriveMilestoneDetailData(state, LEARN_GUITAR_25_HOUR_MILESTONE_ID);

    expect(detail?.nextMilestone).toBeNull();
    expect(detail?.nextSectionMinutes).toBe(0);
    expect(detail?.nextSectionPercentage).toBe(0);
    expect(detail?.remainingMinutes).toBe(0);
  });

  it('bounds a large earned milestone to its final 100-block section', () => {
    const state = createMilestoneReachedAppState();
    const milestone = state.milestones.find(({ id }) => id === LEARN_GUITAR_25_HOUR_MILESTONE_ID);

    if (!milestone) throw new Error('Expected seeded milestone');

    milestone.targetFocusedMinutes = 60_000;

    const detail = deriveMilestoneDetailData(state, LEARN_GUITAR_25_HOUR_MILESTONE_ID);

    expect(detail?.targetBlockCount).toBe(2_400);
    expect(detail?.milestoneSectionStartIndex).toBe(2_300);
    expect(detail?.milestoneSectionBlockCount).toBe(100);
  });
});
