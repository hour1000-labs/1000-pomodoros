export function LoadingState({ label = 'Loading saved progress' }: { label?: string }) {
  return (
    <section className="w-full max-w-reading" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="h-3 w-24 animate-pulse rounded-full bg-ink/8" />
      <div className="mt-4 h-10 w-4/5 animate-pulse rounded-md bg-ink/8" />
      <div className="mt-4 h-4 w-full animate-pulse rounded-sm bg-ink/8" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded-sm bg-ink/8" />
      <div className="mt-8 h-24 w-full animate-pulse rounded-lg border bg-paper" />
    </section>
  );
}
