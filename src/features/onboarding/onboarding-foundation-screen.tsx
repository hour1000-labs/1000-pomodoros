import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardContent } from '@/components/ui/card';

import { OnboardingLayout } from './components/onboarding-layout';

const onboardingCopy = {
  journey: {
    step: '1 of 4',
    title: 'What do you want to make progress on?',
    description: 'Start with one skill, project, or goal that matters to you.',
  },
  motivation: {
    step: '2 of 4',
    title: 'Why does this matter to you?',
    description: 'A short reason can help your Journey stay meaningful.',
  },
  target: {
    step: '3 of 4',
    title: 'How much focused time are you aiming for?',
    description: 'You will see the next milestone first, not all 2,400 pomodoros.',
  },
  nextStep: {
    step: '4 of 4',
    title: 'What is the next thing you can work on?',
    description: 'Choose one action you can make progress on in your next session.',
  },
} as const;

export function OnboardingFoundationScreen({ screen }: { screen: keyof typeof onboardingCopy }) {
  const copy = onboardingCopy[screen];

  return (
    <OnboardingLayout>
      <div className="w-full max-w-reading space-y-8">
        <ScreenHeader eyebrow={copy.step} title={copy.title} description={copy.description} />
        <Card>
          <CardContent className="p-6">
            <p className="mb-0 text-sm text-ink/60">
              This route is ready for its screen-specific onboarding feature.
            </p>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
}
