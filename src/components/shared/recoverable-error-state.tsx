import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';

export function RecoverableErrorState({
  title = 'We could not load your saved progress',
  description = 'Your saved data has not been changed. Try loading it again.',
  onRetry,
  onReset,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
  onReset: () => void;
}) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  return (
    <section
      className="max-w-reading rounded-lg border border-ink/12 bg-paper p-5 sm:p-6"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mb-4 size-6 text-pomodoro-red" />
      <h2 className="mb-2 font-bold text-xl leading-tight">{title}</h2>
      <p className="mb-5 text-ink/65 text-sm leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant={resetDialogOpen ? 'outline' : 'default'} onClick={onRetry}>
          Try again
        </Button>
        <ConfirmDialog
          trigger={<Button variant="outline">Reset saved progress</Button>}
          title="Reset saved progress?"
          description="This removes the saved data on this device and restores the sample Journey. This cannot be undone."
          confirmLabel="Reset progress"
          onOpenChange={setResetDialogOpen}
          onConfirm={onReset}
        />
      </div>
    </section>
  );
}
