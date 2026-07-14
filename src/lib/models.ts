export const APP_STATE_SCHEMA_VERSION = 1 as const;

export type JourneyStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Journey {
  id: string;
  name: string;
  reason: string;
  targetMinutes: number;
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export type NextStepStatus = 'current' | 'upcoming' | 'completed' | 'skipped';

export interface NextStep {
  id: string;
  journeyId: string;
  title: string;
  description: string;
  status: NextStepStatus;
  position: number;
  createdAt: string;
  completedAt: string | null;
}

export type FocusSessionStatus = 'running' | 'paused' | 'completed' | 'cancelled';

export interface FocusSession {
  id: string;
  journeyId: string;
  nextStepId: string | null;
  plannedMinutes: number;
  focusedMinutes: number;
  status: FocusSessionStatus;
  source: 'timer' | 'manual';
  startedAt: string;
  endedAt: string | null;
  reflection: string;
}

export interface ActiveTimer {
  sessionId: string;
  status: 'running' | 'paused';
  remainingSeconds: number;
  accumulatedFocusedSeconds: number;
  targetEndAt: string | null;
  pausedAt: string | null;
}

export interface Milestone {
  id: string;
  journeyId: string;
  name: string;
  targetFocusedMinutes: number;
  earnedAt: string | null;
}

export interface WeeklyGoal {
  id: string;
  journeyId: string | null;
  targetPomodoros: number;
  weekStartsOn: 0 | 1;
  createdAt: string;
}

export interface OnboardingDraft {
  journeyName: string;
  reason: string;
  targetMinutes: number;
  nextStepTitle: string;
  startedAt: string;
  updatedAt: string;
}

export interface AppState {
  schemaVersion: typeof APP_STATE_SCHEMA_VERSION;
  journeys: Journey[];
  nextSteps: NextStep[];
  focusSessions: FocusSession[];
  milestones: Milestone[];
  weeklyGoal: WeeklyGoal | null;
  onboardingDraft: OnboardingDraft | null;
  activeTimer: ActiveTimer | null;
  lastActiveJourneyId: string | null;
  lastCompletedSessionId: string | null;
}
