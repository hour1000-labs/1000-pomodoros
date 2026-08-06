import { ScreenHeader } from '@/components/shared/screen-header';

import { OnboardingLayout } from './components/onboarding-layout';

const onboardingCopy = {
  journey: {
    step: '1 of 4',
    title: 'Name your first Journey',
    description: 'Track focused work, one pomodoro at a time.',
  },
  motivation: {
    step: '2 of 4',
    title: 'Why does it matter?',
    description: 'This step is optional.',
  },
  target: {
    step: '3 of 4',
    title: 'Choose a focus target',
    description: 'You can change it later.',
  },
  nextStep: {
    step: '4 of 4',
    title: 'Add your first Next step',
    description: 'Choose one action for your first Focus session.',
  },
} as const;

export function OnboardingFoundationScreen({ screen }: { screen: keyof typeof onboardingCopy }) {
  const copy = onboardingCopy[screen];

  return (
    <OnboardingLayout>
      <div className="w-full max-w-reading">
        <ScreenHeader eyebrow={copy.step} title={copy.title} description={copy.description} />
      </div>
    </OnboardingLayout>
  );
}
