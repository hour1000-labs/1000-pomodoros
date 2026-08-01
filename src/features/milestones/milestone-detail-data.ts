import type { AppState, Journey, Milestone } from '@/lib/models';
import { getFocusedMinutes, POMODORO_MINUTES } from '@/lib/progress';

const POMODOROS_PER_SECTION = 100;

type EarnedMilestone = Omit<Milestone, 'earnedAt'> & { earnedAt: string };

export interface MilestoneDetailData {
  milestone: EarnedMilestone;
  journey: Journey;
  targetPomodoros: number;
  targetBlockCount: number;
  milestoneSectionStartIndex: number;
  milestoneSectionBlockCount: number;
  focusedMinutes: number;
  nextMilestone: Milestone | null;
  nextSectionMinutes: number;
  nextSectionFocusedMinutes: number;
  nextSectionPercentage: number;
  remainingMinutes: number;
}

export function deriveMilestoneDetailData(
  state: AppState,
  milestoneId: string
): MilestoneDetailData | null {
  const milestone = state.milestones.find(({ id }) => id === milestoneId);

  if (!milestone || milestone.earnedAt === null) return null;

  const journey = state.journeys.find(({ id }) => id === milestone.journeyId);

  if (!journey) return null;

  const focusedMinutes = getFocusedMinutes(state.focusSessions, journey.id);
  const nextMilestone =
    state.milestones
      .filter(
        (candidate) =>
          candidate.journeyId === journey.id &&
          candidate.targetFocusedMinutes > milestone.targetFocusedMinutes
      )
      .sort(
        (left, right) =>
          left.targetFocusedMinutes - right.targetFocusedMinutes || left.id.localeCompare(right.id)
      )[0] ?? null;
  const nextSectionMinutes =
    nextMilestone === null
      ? 0
      : nextMilestone.targetFocusedMinutes - milestone.targetFocusedMinutes;
  const nextSectionFocusedMinutes = Math.min(
    nextSectionMinutes,
    Math.max(0, focusedMinutes - milestone.targetFocusedMinutes)
  );
  const targetBlockCount = Math.ceil(milestone.targetFocusedMinutes / POMODORO_MINUTES);
  const milestoneSectionStartIndex =
    targetBlockCount === 0
      ? 0
      : Math.floor((targetBlockCount - 1) / POMODOROS_PER_SECTION) * POMODOROS_PER_SECTION;

  return {
    milestone: { ...milestone, earnedAt: milestone.earnedAt },
    journey,
    targetPomodoros: milestone.targetFocusedMinutes / POMODORO_MINUTES,
    targetBlockCount,
    milestoneSectionStartIndex,
    milestoneSectionBlockCount: Math.min(
      POMODOROS_PER_SECTION,
      targetBlockCount - milestoneSectionStartIndex
    ),
    focusedMinutes,
    nextMilestone,
    nextSectionMinutes,
    nextSectionFocusedMinutes,
    nextSectionPercentage:
      nextSectionMinutes === 0 ? 0 : (nextSectionFocusedMinutes / nextSectionMinutes) * 100,
    remainingMinutes:
      nextMilestone === null ? 0 : Math.max(0, nextMilestone.targetFocusedMinutes - focusedMinutes),
  };
}
