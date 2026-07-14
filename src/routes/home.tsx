import { createFileRoute } from '@tanstack/react-router';

import { HomeScreen } from '@/features/journeys/home-screen';

export const Route = createFileRoute('/home')({ component: HomeScreen });
