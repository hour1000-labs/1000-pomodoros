export type LoadingSkeletonVariant =
  | 'home'
  | 'journeys'
  | 'journey'
  | 'milestone'
  | 'focus'
  | 'complete'
  | 'form'
  | 'settings'
  | 'landing'
  | 'default';

const SKELETON_KEYS_2 = ['sk-2-1', 'sk-2-2'];
const SKELETON_KEYS_3 = ['sk-3-1', 'sk-3-2', 'sk-3-3'];
const SKELETON_KEYS_10 = [
  'sk-10-1',
  'sk-10-2',
  'sk-10-3',
  'sk-10-4',
  'sk-10-5',
  'sk-10-6',
  'sk-10-7',
  'sk-10-8',
  'sk-10-9',
  'sk-10-10',
];
const SKELETON_KEYS_20 = [
  'sk-20-1',
  'sk-20-2',
  'sk-20-3',
  'sk-20-4',
  'sk-20-5',
  'sk-20-6',
  'sk-20-7',
  'sk-20-8',
  'sk-20-9',
  'sk-20-10',
  'sk-20-11',
  'sk-20-12',
  'sk-20-13',
  'sk-20-14',
  'sk-20-15',
  'sk-20-16',
  'sk-20-17',
  'sk-20-18',
  'sk-20-19',
  'sk-20-20',
];

const SKELETON_KEYS_50 = Array.from({ length: 50 }, (_, idx) => `sk-50-${idx + 1}`);

export function LoadingState({
  label = 'Loading saved progress',
  variant = 'default',
}: {
  label?: string;
  variant?: LoadingSkeletonVariant;
}) {
  return (
    <section className="w-full flex-1" aria-busy="true" aria-label={label} data-variant={variant}>
      <span className="sr-only">{label}</span>
      {renderSkeletonVariant(variant)}
    </section>
  );
}

function renderSkeletonVariant(variant: LoadingSkeletonVariant) {
  switch (variant) {
    case 'home':
      return <HomeSkeleton />;
    case 'journeys':
      return <JourneysSkeleton />;
    case 'journey':
      return <JourneySkeleton />;
    case 'milestone':
      return <MilestoneSkeleton />;
    case 'focus':
      return <FocusSkeleton />;
    case 'complete':
      return <CompleteSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'landing':
      return <LandingSkeleton />;
    default:
      return <DefaultSkeleton />;
  }
}

function LandingSkeleton() {
  return (
    <div className="w-full space-y-16 md:space-y-20">
      {/* Hero Section & Product Preview Skeleton */}
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          <div className="mb-4 h-12 w-4/5 max-w-[16ch] animate-pulse rounded-lg bg-ink/8 sm:h-14 lg:h-16" />
          <div className="mb-3 h-5 w-full max-w-[32rem] animate-pulse rounded bg-ink/8" />
          <div className="mb-7 h-5 w-3/4 max-w-[24rem] animate-pulse rounded bg-ink/8" />
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <div className="h-12 w-48 animate-pulse rounded-lg bg-ink/12" />
            <div className="h-12 w-44 animate-pulse rounded-lg bg-ink/8" />
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="space-y-6 rounded-2xl border border-ink/12 bg-paper p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="h-7 w-36 animate-pulse rounded bg-ink/8 sm:h-8" />
                <div className="h-4 w-60 animate-pulse rounded bg-ink/8" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-7 w-16 animate-pulse rounded bg-ink/8 sm:h-8" />
                <div className="h-3 w-14 animate-pulse rounded bg-ink/8" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 border-ink/10 border-t pt-6 sm:flex-nowrap">
              <div>
                <div className="h-10 w-24 animate-pulse rounded bg-ink/8" />
                <div className="mt-1 h-3 w-20 animate-pulse rounded bg-ink/8" />
              </div>

              <div className="w-full flex-1 sm:w-auto">
                <div className="grid grid-cols-10 gap-1 p-1">
                  {SKELETON_KEYS_50.map((key) => (
                    <div
                      key={key}
                      className="aspect-square w-full animate-pulse rounded-full bg-ink/8"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Core Loop Explanation Skeleton */}
      <div>
        <div className="mb-8 text-center sm:mb-12">
          <div className="mx-auto mb-2.5 h-8 w-44 animate-pulse rounded bg-ink/8 sm:h-9" />
          <div className="mx-auto h-5 w-64 max-w-[32rem] animate-pulse rounded bg-ink/8" />
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {SKELETON_KEYS_3.map((key) => (
            <div
              key={key}
              className="space-y-3 rounded-xl border border-ink/12 bg-paper p-6 sm:p-7"
            >
              <div className="h-4 w-8 animate-pulse rounded bg-ink/8" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-ink/8" />
              <div className="h-4 w-full animate-pulse rounded bg-ink/8" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-ink/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="w-full space-y-14">
      {/* Top Continue Card Skeleton */}
      <div className="rounded-xl border border-ink/15 bg-paper p-6 sm:p-8">
        <div className="h-5 w-28 animate-pulse rounded-full bg-ink/8" />
        <div className="mt-4 h-9 w-2/3 max-w-md animate-pulse rounded-md bg-ink/8 sm:h-10" />
        <div className="mt-3 h-5 w-1/2 max-w-xs animate-pulse rounded-md bg-ink/8" />
        <div className="mt-6 h-12 w-44 animate-pulse rounded-lg bg-ink/12" />
      </div>

      {/* Today & Monthly Activity Grid */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="self-start rounded-xl border border-ink/15 p-6">
          <div className="mb-7 h-7 w-20 animate-pulse rounded bg-ink/8" />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-2 h-4 w-20 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-14 animate-pulse rounded bg-ink/8" />
            </div>
            <div>
              <div className="mb-2 h-4 w-28 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-16 animate-pulse rounded bg-ink/8" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-ink/15 p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="h-7 w-40 animate-pulse rounded bg-ink/8" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-ink/8" />
            </div>
            <div className="flex gap-2">
              <div className="size-11 animate-pulse rounded-lg bg-ink/8" />
              <div className="size-11 animate-pulse rounded-lg bg-ink/8" />
            </div>
          </div>

          <div className="mb-4 h-5 w-28 animate-pulse rounded bg-ink/8" />
          <div className="border-ink/15 border-y">
            <div className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] gap-3 border-ink/15 border-b py-3">
              <div className="h-4 w-10 animate-pulse rounded bg-ink/8" />
              <div className="h-4 w-24 animate-pulse rounded bg-ink/8" />
              <div className="h-4 w-10 animate-pulse rounded bg-ink/8" />
            </div>
            {SKELETON_KEYS_3.map((key) => (
              <div
                key={key}
                className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 border-ink/10 border-b py-4 last:border-b-0"
              >
                <div className="space-y-2">
                  <div className="h-4 w-14 animate-pulse rounded bg-ink/8" />
                  <div className="h-3 w-8 animate-pulse rounded bg-ink/8" />
                </div>
                <div className="flex gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-ink/8" />
                  <div className="size-6 animate-pulse rounded-full bg-ink/8" />
                  <div className="size-6 animate-pulse rounded-full bg-ink/8" />
                </div>
                <div className="h-5 w-8 animate-pulse rounded bg-ink/8" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-ink/8" />
            <div className="h-6 w-20 animate-pulse rounded bg-ink/8" />
          </div>
        </div>
      </div>

      {/* Active Journeys Section */}
      <div>
        <div className="mb-6 flex items-center justify-between border-ink/15 border-b pb-4">
          <div className="h-8 w-44 animate-pulse rounded bg-ink/8" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-ink/8" />
        </div>
        <div className="grid gap-7 lg:grid-cols-2">
          {SKELETON_KEYS_2.map((key) => (
            <div key={key} className="space-y-4 rounded-xl border border-ink/15 p-6">
              <div className="h-6 w-1/2 animate-pulse rounded bg-ink/8" />
              <div className="h-3 w-full animate-pulse rounded-full bg-ink/8" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-5 w-1/3 animate-pulse rounded-full bg-ink/8" />
                <div className="h-6 w-24 animate-pulse rounded-md bg-ink/8" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="mb-6 h-7 w-40 animate-pulse rounded bg-ink/8" />
        <div className="space-y-3">
          {SKELETON_KEYS_2.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-ink/15 p-4"
            >
              <div className="space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-ink/8" />
                <div className="h-4 w-32 animate-pulse rounded bg-ink/8" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-ink/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneysSkeleton() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between gap-4 border-ink/15 border-b pb-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-ink/8 sm:h-12" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-ink/8" />
      </header>

      <section className="mt-10">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-ink/8" />
        <div className="grid gap-7 lg:grid-cols-2">
          {SKELETON_KEYS_2.map((key) => (
            <div key={key} className="space-y-5 rounded-xl border border-ink/15 p-6">
              <div className="h-7 w-3/5 animate-pulse rounded bg-ink/8" />
              <div className="h-5 w-2/5 animate-pulse rounded bg-ink/8" />
              <div className="h-3 w-full animate-pulse rounded-full bg-ink/8" />
              <div className="border-ink/10 border-t pt-4">
                <div className="h-4 w-24 animate-pulse rounded bg-ink/8" />
                <div className="mt-2 h-5 w-4/5 animate-pulse rounded bg-ink/8" />
              </div>
              <div className="h-11 w-full animate-pulse rounded-lg bg-ink/12" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 h-8 w-44 animate-pulse rounded bg-ink/8" />
        <div className="grid gap-7 lg:grid-cols-2">
          <div className="space-y-5 rounded-xl border border-ink/15 p-6">
            <div className="h-7 w-1/2 animate-pulse rounded bg-ink/8" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-ink/8" />
            <div className="h-3 w-full animate-pulse rounded-full bg-ink/8" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-ink/8" />
          </div>
        </div>
      </section>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <header className="border-ink/15 border-b pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-12 w-2/5 max-w-md animate-pulse rounded-lg bg-ink/8 sm:h-14" />
            <div className="mt-3 h-5 w-3/5 max-w-xl animate-pulse rounded-md bg-ink/8" />
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-8 border-ink/15 border-t pt-4 md:min-w-72 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <div>
              <div className="mb-1 h-4 w-20 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-16 animate-pulse rounded bg-ink/8" />
            </div>
            <div>
              <div className="mb-1 h-4 w-24 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-20 animate-pulse rounded bg-ink/8" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Section Grid */}
      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="rounded-xl border border-ink/15 p-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 animate-pulse rounded bg-ink/8" />
              <div className="h-5 w-24 animate-pulse rounded bg-ink/8" />
            </div>
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-ink/8" />
            <div className="mt-6 grid grid-cols-5 gap-2.5 sm:grid-cols-10">
              {SKELETON_KEYS_20.map((key) => (
                <div key={key} className="h-7 w-full animate-pulse rounded-full bg-ink/8" />
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="rounded-xl border border-ink/15 p-6">
            <div className="h-5 w-24 animate-pulse rounded-full bg-ink/8" />
            <div className="mt-3 h-6 w-full animate-pulse rounded bg-ink/8" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-ink/12" />
          </div>
        </div>
      </section>

      {/* Bottom Grid */}
      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-ink/15 p-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-ink/8" />
            <div className="h-8 w-24 animate-pulse rounded-md bg-ink/8" />
          </div>
          {SKELETON_KEYS_3.map((key) => (
            <div key={key} className="h-12 w-full animate-pulse rounded-lg bg-ink/8" />
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-ink/15 p-6">
          <div className="h-6 w-36 animate-pulse rounded bg-ink/8" />
          {SKELETON_KEYS_3.map((key) => (
            <div key={key} className="h-12 w-full animate-pulse rounded-lg bg-ink/8" />
          ))}
        </div>
      </section>
    </div>
  );
}

function MilestoneSkeleton() {
  return (
    <article className="w-full max-w-6xl">
      <div className="mb-8 h-8 w-24 animate-pulse rounded bg-ink/8 sm:mb-12" />

      <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(24rem,1.22fr)] lg:items-start lg:gap-16">
        <header className="min-w-0">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-ink/8" />
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-ink/8" />
          <div className="mb-5 h-20 w-48 animate-pulse rounded-xl bg-ink/8 sm:h-24" />
          <div className="mb-8 h-4 w-36 animate-pulse rounded bg-ink/8" />
          <div className="h-12 w-44 animate-pulse rounded-lg bg-ink/12" />
        </header>

        <div className="min-w-0 rounded-xl border border-ink/15 bg-paper p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-7 w-40 animate-pulse rounded bg-ink/8" />
            <div className="h-5 w-20 animate-pulse rounded bg-ink/8" />
          </div>
          <div className="mb-6 grid grid-cols-5 gap-2.5 sm:grid-cols-10">
            {SKELETON_KEYS_10.map((key) => (
              <div key={key} className="h-7 w-full animate-pulse rounded-full bg-ink/8" />
            ))}
          </div>
          <div className="h-3 w-full animate-pulse rounded-full bg-ink/8" />
        </div>
      </div>
    </article>
  );
}

function FocusSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 h-8 w-24 animate-pulse rounded bg-ink/8" />
      <header className="mb-6">
        <div className="mb-2 h-9 w-3/4 animate-pulse rounded-lg bg-ink/8 sm:h-10" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-ink/8" />
      </header>

      <div className="grid gap-3 rounded-xl border border-ink/15 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="h-4 w-16 animate-pulse rounded bg-ink/8" />
            <div className="h-5 w-32 animate-pulse rounded bg-ink/8" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-md bg-ink/8" />
        </div>
        <div className="flex items-center justify-between gap-4 border-ink/15 border-t pt-3">
          <div className="space-y-1">
            <div className="h-4 w-20 animate-pulse rounded bg-ink/8" />
            <div className="h-5 w-44 animate-pulse rounded bg-ink/8" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-md bg-ink/8" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-ink/8" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 animate-pulse rounded-xl border border-ink/15 bg-paper" />
          <div className="h-16 animate-pulse rounded-xl border border-ink/15 bg-paper" />
          <div className="h-16 animate-pulse rounded-xl border border-ink/15 bg-paper" />
        </div>
      </div>

      <div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-ink/12" />
    </div>
  );
}

function CompleteSkeleton() {
  return (
    <div className="w-full max-w-5xl">
      <div className="mb-10 h-8 w-24 animate-pulse rounded bg-ink/8" />

      <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,1.2fr)] lg:items-start lg:gap-12">
        <div>
          <div className="mb-4 h-16 w-3/4 animate-pulse rounded-xl bg-ink/8 sm:h-20" />
          <div className="mb-8 h-6 w-full max-w-md animate-pulse rounded bg-ink/8" />
          <div className="h-12 w-44 animate-pulse rounded-lg bg-ink/12" />
        </div>

        <div className="space-y-6 rounded-xl border border-ink/15 bg-paper p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 w-full animate-pulse rounded-lg bg-ink/8" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-ink/8" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-ink/8" />
            <div className="h-28 w-full animate-pulse rounded-lg bg-ink/8" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[42rem]">
      {/* Onboarding Step Indicator */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-4 w-10 animate-pulse rounded bg-ink/8" />
        <div className="h-px w-24 bg-ink/20">
          <div className="h-px w-1/4 bg-pomodoro-red/50" />
        </div>
      </div>

      {/* Heading */}
      <div className="mb-4 h-10 w-3/4 max-w-[15ch] animate-pulse rounded-lg bg-ink/8 sm:h-12" />

      {/* Description Line */}
      <div className="mb-8 h-5 w-5/6 max-w-[58ch] animate-pulse rounded bg-ink/8" />

      {/* Input Field Label & Box */}
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-ink/8" />
        <div className="h-14 w-full animate-pulse rounded-lg border border-ink/50 bg-paper" />
      </div>

      {/* Example Pills */}
      <div className="mt-6 space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-ink/8" />
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-28 animate-pulse rounded-md bg-ink/8" />
          <div className="h-9 w-36 animate-pulse rounded-md bg-ink/8" />
          <div className="h-9 w-32 animate-pulse rounded-md bg-ink/8" />
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-9 flex justify-end">
        <div className="h-12 w-36 animate-pulse rounded-lg bg-ink/12" />
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="w-full">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-ink/8" />
        <div className="h-9 w-40 animate-pulse rounded-lg bg-ink/8" />
        <div className="h-5 w-3/4 max-w-xl animate-pulse rounded bg-ink/8" />
      </div>

      <div className="mt-10 max-w-reading space-y-6">
        <div className="rounded-xl border border-ink/15 bg-paper p-6 sm:p-8">
          <div className="mb-2 h-6 w-32 animate-pulse rounded bg-ink/8" />
          <div className="mb-6 h-4 w-full max-w-md animate-pulse rounded bg-ink/8" />
          <div className="mb-7 grid grid-cols-3 gap-5">
            <div>
              <div className="mb-1 h-4 w-16 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-12 animate-pulse rounded bg-ink/8" />
            </div>
            <div>
              <div className="mb-1 h-4 w-24 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-20 animate-pulse rounded bg-ink/8" />
            </div>
            <div>
              <div className="mb-1 h-4 w-16 animate-pulse rounded bg-ink/8" />
              <div className="h-8 w-12 animate-pulse rounded bg-ink/8" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-44 animate-pulse rounded-lg bg-ink/12" />
            <div className="h-11 w-36 animate-pulse rounded-lg bg-ink/8" />
          </div>
        </div>

        <div className="h-16 w-full animate-pulse rounded-lg border border-ink/15 bg-paper" />
      </div>
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="w-full max-w-reading space-y-4">
      <div className="h-4 w-24 animate-pulse rounded-full bg-ink/8" />
      <div className="h-10 w-4/5 animate-pulse rounded-md bg-ink/8" />
      <div className="h-4 w-full animate-pulse rounded-sm bg-ink/8" />
      <div className="h-4 w-3/4 animate-pulse rounded-sm bg-ink/8" />
      <div className="mt-8 h-32 w-full animate-pulse rounded-xl border border-ink/15 bg-paper" />
    </div>
  );
}
