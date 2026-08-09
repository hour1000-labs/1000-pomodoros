import { createFileRoute, Navigate } from '@tanstack/react-router';

import { PersistedStateBoundary } from '@/components/shared/persisted-state-boundary';
import { LandingPage } from '@/features/landing/landing-page';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SOCIAL_IMAGE_URL,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: SITE_SOCIAL_IMAGE_URL },
      { property: 'og:image:alt', content: '1000 Pomodoros progress card' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: SITE_SOCIAL_IMAGE_URL },
      { name: 'twitter:image:alt', content: '1000 Pomodoros progress card' },
    ],
    links: [{ rel: 'canonical', href: SITE_URL }],
  }),
  component: IndexScreen,
});

function IndexScreen() {
  return (
    <PersistedStateBoundary loadingFallback={<LandingPage />}>
      {(state) => (state.journeys.length > 0 ? <Navigate to="/home" replace /> : <LandingPage />)}
    </PersistedStateBoundary>
  );
}
