import { createSampleAppState, LEARN_GUITAR_JOURNEY_ID } from '@/lib/mock-data';

import { JourneyDetailScreen } from './journey-detail-screen';

export function SampleJourneyScreen() {
  return (
    <JourneyDetailScreen
      journeyId={LEARN_GUITAR_JOURNEY_ID}
      readOnly
      showNavigationItems={false}
      state={createSampleAppState()}
    />
  );
}
