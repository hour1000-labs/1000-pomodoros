import { describe, expect, it } from 'vitest';

import { createEmptyAppState } from '@/lib/mock-data';
import type { FocusSession, Journey, NextStep } from '@/lib/models';

import {
  deriveJourneySummary,
  deriveJourneySummaryGroups,
  getOrderedJourneyGroups,
} from './journey-summary-data';

function createJourney({
  id,
  lastActiveAt,
  status = 'active',
}: {
  id: string;
  lastActiveAt: string;
  status?: Journey['status'];
}): Journey {
  return {
    id,
    name: id,
    reason: '',
    targetMinutes: 1_000,
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: lastActiveAt,
    lastActiveAt,
  };
}

function createNextStep({
  createdAt = '2026-07-01T00:00:00.000Z',
  id,
  journeyId,
  position = 0,
  status = 'current',
}: {
  createdAt?: string;
  id: string;
  journeyId: string;
  position?: number;
  status?: NextStep['status'];
}): NextStep {
  return {
    id,
    journeyId,
    title: `Step ${id}`,
    description: '',
    status,
    position,
    createdAt,
    completedAt: null,
  };
}

function createSession({
  focusedMinutes,
  id,
  journeyId,
  nextStepId,
}: {
  focusedMinutes: number;
  id: string;
  journeyId: string;
  nextStepId: string;
}): FocusSession {
  return {
    id,
    journeyId,
    nextStepId,
    plannedMinutes: focusedMinutes,
    focusedMinutes,
    status: 'completed',
    source: 'timer',
    startedAt: '2026-07-12T16:00:00.000Z',
    endedAt: '2026-07-12T17:00:00.000Z',
    reflection: '',
  };
}

describe('Journey summary selectors', () => {
  it('includes every saved Journey exactly once and preserves inactive statuses', () => {
    const state = createEmptyAppState();
    state.journeys = [
      createJourney({
        id: 'journey-paused',
        lastActiveAt: '2026-07-04T00:00:00.000Z',
        status: 'paused',
      }),
      createJourney({
        id: 'journey-active',
        lastActiveAt: '2026-07-05T00:00:00.000Z',
      }),
      createJourney({
        id: 'journey-archived',
        lastActiveAt: '2026-07-03T00:00:00.000Z',
        status: 'archived',
      }),
      createJourney({
        id: 'journey-completed',
        lastActiveAt: '2026-07-06T00:00:00.000Z',
        status: 'completed',
      }),
    ];

    const groups = deriveJourneySummaryGroups(state);

    expect(groups.active.map(({ journey }) => journey.id)).toEqual(['journey-active']);
    expect(groups.inactive.map(({ journey }) => [journey.id, journey.status])).toEqual([
      ['journey-completed', 'completed'],
      ['journey-paused', 'paused'],
      ['journey-archived', 'archived'],
    ]);
    expect([...groups.active, ...groups.inactive].map(({ journey }) => journey.id).sort()).toEqual(
      state.journeys.map(({ id }) => id).sort()
    );
  });

  it('promotes only a valid active last-active pointer within the active group', () => {
    const state = createEmptyAppState();
    state.journeys = [
      createJourney({
        id: 'journey-active-old',
        lastActiveAt: '2026-07-10T00:00:00.000Z',
      }),
      createJourney({
        id: 'journey-active-new',
        lastActiveAt: '2026-07-20T00:00:00.000Z',
      }),
      createJourney({ id: 'journey-active-invalid', lastActiveAt: 'not-a-date' }),
      createJourney({
        id: 'journey-inactive-newest',
        lastActiveAt: '2026-07-30T00:00:00.000Z',
        status: 'paused',
      }),
    ];

    state.lastActiveJourneyId = 'journey-active-invalid';
    const activePointer = getOrderedJourneyGroups(state);
    expect(activePointer.active.map(({ id }) => id)).toEqual([
      'journey-active-invalid',
      'journey-active-new',
      'journey-active-old',
    ]);
    expect(activePointer.inactive.map(({ id }) => id)).toEqual(['journey-inactive-newest']);

    for (const pointer of ['journey-inactive-newest', 'journey-missing', null]) {
      state.lastActiveJourneyId = pointer;
      const ignoredPointer = getOrderedJourneyGroups(state);

      expect(ignoredPointer.active.map(({ id }) => id)).toEqual([
        'journey-active-new',
        'journey-active-old',
        'journey-active-invalid',
      ]);
      expect(ignoredPointer.inactive.map(({ id }) => id)).toEqual(['journey-inactive-newest']);
    }
  });

  it('orders each group by recent activity, then ID, with invalid dates last', () => {
    const state = createEmptyAppState();
    state.journeys = [
      createJourney({ id: 'journey-active-invalid-z', lastActiveAt: 'invalid-z' }),
      createJourney({
        id: 'journey-active-tie-b',
        lastActiveAt: '2026-07-02T00:00:00.000Z',
      }),
      createJourney({
        id: 'journey-active-recent',
        lastActiveAt: '2026-07-03T00:00:00.000Z',
      }),
      createJourney({ id: 'journey-active-invalid-a', lastActiveAt: 'invalid-a' }),
      createJourney({
        id: 'journey-active-tie-a',
        lastActiveAt: '2026-07-02T00:00:00.000Z',
      }),
      createJourney({
        id: 'journey-inactive-tie-b',
        lastActiveAt: '2026-07-04T00:00:00.000Z',
        status: 'paused',
      }),
      createJourney({
        id: 'journey-inactive-invalid',
        lastActiveAt: 'invalid',
        status: 'archived',
      }),
      createJourney({
        id: 'journey-inactive-tie-a',
        lastActiveAt: '2026-07-04T00:00:00.000Z',
        status: 'completed',
      }),
    ];

    const groups = getOrderedJourneyGroups(state);

    expect(groups.active.map(({ id }) => id)).toEqual([
      'journey-active-recent',
      'journey-active-tie-a',
      'journey-active-tie-b',
      'journey-active-invalid-a',
      'journey-active-invalid-z',
    ]);
    expect(groups.inactive.map(({ id }) => id)).toEqual([
      'journey-inactive-tie-a',
      'journey-inactive-tie-b',
      'journey-inactive-invalid',
    ]);
  });

  it('isolates progress, milestones, and deterministic current steps by Journey', () => {
    const state = createEmptyAppState();
    const primaryJourney = createJourney({
      id: 'journey-primary',
      lastActiveAt: '2026-07-12T17:00:00.000Z',
    });
    const otherJourney = createJourney({
      id: 'journey-other',
      lastActiveAt: '2026-07-12T18:00:00.000Z',
      status: 'paused',
    });
    const primaryStep = createNextStep({
      id: 'step-primary-first',
      journeyId: primaryJourney.id,
      position: 1,
    });
    const otherStep = createNextStep({
      id: 'step-other',
      journeyId: otherJourney.id,
    });
    state.journeys = [primaryJourney, otherJourney];
    state.nextSteps = [
      createNextStep({
        createdAt: '2026-07-02T00:00:00.000Z',
        id: 'step-primary-later',
        journeyId: primaryJourney.id,
        position: 1,
      }),
      primaryStep,
      createNextStep({
        id: 'step-primary-upcoming',
        journeyId: primaryJourney.id,
        status: 'upcoming',
      }),
      otherStep,
    ];
    state.milestones = [
      {
        id: 'milestone-primary-50',
        journeyId: primaryJourney.id,
        name: 'Primary 50 minutes',
        targetFocusedMinutes: 50,
        earnedAt: null,
      },
      {
        id: 'milestone-other-100',
        journeyId: otherJourney.id,
        name: 'Other 100 minutes',
        targetFocusedMinutes: 100,
        earnedAt: null,
      },
    ];
    state.focusSessions = [
      createSession({
        focusedMinutes: 25,
        id: 'session-primary',
        journeyId: primaryJourney.id,
        nextStepId: primaryStep.id,
      }),
      createSession({
        focusedMinutes: 75,
        id: 'session-other',
        journeyId: otherJourney.id,
        nextStepId: otherStep.id,
      }),
    ];

    expect(deriveJourneySummary(state, primaryJourney)).toMatchObject({
      currentStep: { id: primaryStep.id },
      progress: { focusedMinutes: 25 },
      currentMilestone: { id: 'milestone-primary-50', journeyId: primaryJourney.id },
      currentMilestonePercentage: 50,
    });
    expect(deriveJourneySummary(state, otherJourney)).toMatchObject({
      currentStep: { id: otherStep.id },
      progress: { focusedMinutes: 75 },
      currentMilestone: { id: 'milestone-other-100', journeyId: otherJourney.id },
      currentMilestonePercentage: 75,
    });

    state.nextSteps = state.nextSteps.map((nextStep) =>
      nextStep.journeyId === primaryJourney.id ? { ...nextStep, status: 'upcoming' } : nextStep
    );
    expect(deriveJourneySummary(state, primaryJourney).currentStep).toBeNull();
  });
});
