export function LoadingState({ label = 'Loading saved progress' }: { label?: string }) {
  return (
    <section className="w-full max-w-reading" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="h-3 w-24 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-5 h-12 w-4/5 animate-pulse rounded-md bg-ink/10" />
      <div className="mt-4 h-5 w-full animate-pulse rounded-md bg-ink/10" />
      <div className="mt-2 h-5 w-3/4 animate-pulse rounded-md bg-ink/10" />
      <div className="mt-8 h-28 w-full animate-pulse rounded-lg bg-ink/10" />
    </section>
  )
}
