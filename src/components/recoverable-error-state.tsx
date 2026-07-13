import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function RecoverableErrorState({
  title = 'We could not load your saved progress',
  description = 'Your saved data has not been changed. Try loading it again.',
  onRetry,
  onReset,
}: {
  title?: string
  description?: string
  onRetry: () => void
  onReset: () => void
}) {
  return (
    <section
      className="max-w-reading rounded-lg border border-ink/20 bg-paper p-6"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mb-4 size-6 text-pomodoro-red" />
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      <p className="mb-5 text-sm leading-relaxed text-ink/60">{description}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onRetry}>Try again</Button>
        <ConfirmDialog
          trigger={<Button variant="outline">Reset saved progress</Button>}
          title="Reset saved progress?"
          description="This removes the saved data on this device and restores the sample Journey. This cannot be undone."
          confirmLabel="Reset progress"
          onConfirm={onReset}
        />
      </div>
    </section>
  )
}
