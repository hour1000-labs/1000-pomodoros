import { Link } from '@tanstack/react-router';

import { EmptyState } from './empty-state';
import { PrimaryButton } from './primary-button';

export function EmptyJourneyState() {
  return (
    <EmptyState
      className="w-full"
      title="Your next pomodoro starts here"
      description="Create a Journey to give your focused work a place to grow."
      action={
        <PrimaryButton asChild>
          <Link to="/onboarding/journey">Create a Journey</Link>
        </PrimaryButton>
      }
    />
  );
}
