import { XIcon } from 'lucide-react';
import { type ReactNode, type RefObject, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function JourneyDetailDialog({
  open,
  onOpenChange,
  titleId,
  dialogId,
  descriptionId,
  initialFocusRef,
  getReturnFocus,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  dialogId?: string;
  descriptionId?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  getReturnFocus?: () => HTMLElement | null;
  className?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusElement = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  const getReturnFocusRef = useRef(getReturnFocus);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
    getReturnFocusRef.current = getReturnFocus;
  }, [getReturnFocus, onOpenChange]);

  useEffect(() => {
    if (!open) {
      if (!wasOpen.current) return;

      wasOpen.current = false;
      returnFocusElement.current?.focus();
      return;
    }

    wasOpen.current = true;
    returnFocusElement.current =
      getReturnFocusRef.current?.() ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    (initialFocusRef?.current ?? closeButtonRef.current)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const firstElement = focusableElements.at(0);
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [initialFocusRef, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
      />
      <div
        ref={dialogRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          'relative z-10 grid w-full max-w-sm gap-4 rounded-xl border border-ink/20 bg-popover p-4 text-popover-foreground text-sm shadow-[0_16px_48px_rgba(25,24,22,0.16)] outline-none',
          className
        )}
      >
        {children}
        <Button
          ref={closeButtonRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
