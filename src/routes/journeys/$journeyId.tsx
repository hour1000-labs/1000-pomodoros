import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/journeys/$journeyId')({
  component: JourneyRoute,
});

function JourneyRoute() {
  return <Outlet />;
}
