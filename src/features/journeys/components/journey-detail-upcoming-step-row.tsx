import {
  ArrowDown,
  ArrowUp,
  Check,
  Ellipsis,
  GripVertical,
  ListStart,
  Pencil,
  Trash2,
} from 'lucide-react';
import { type KeyboardEvent, type PointerEvent, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NextStep } from '@/lib/models';
import { cn } from '@/lib/utils';

export function JourneyDetailUpcomingStepRow({
  step,
  index,
  total,
  isDragging,
  isBusy,
  isPointerTracking,
  isLayoutAnimating,
  isMotionInverted,
  motionOffsetY,
  onDragKeyDown,
  onDragBlur,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerUp,
  onDragPointerCancel,
  onDragLostPointerCapture,
  onMove,
  onMakeCurrent,
  onComplete,
  onRequestEdit,
  onRequestDelete,
  onMenuCloseAutoFocus,
  registerHandle,
  registerMenuTrigger,
}: {
  step: NextStep;
  index: number;
  total: number;
  isDragging: boolean;
  isBusy: boolean;
  isPointerTracking: boolean;
  isLayoutAnimating: boolean;
  isMotionInverted: boolean;
  motionOffsetY: number;
  onDragKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onDragBlur: () => void;
  onDragPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragLostPointerCapture: () => void;
  onMove: (direction: -1 | 1) => void;
  onMakeCurrent: () => void;
  onComplete: () => void;
  onRequestEdit: (returnFocus: HTMLButtonElement | null) => void;
  onRequestDelete: (returnFocus: HTMLButtonElement | null) => void;
  onMenuCloseAutoFocus: (event: Event) => void;
  registerHandle: (element: HTMLButtonElement | null) => void;
  registerMenuTrigger: (element: HTMLButtonElement | null) => void;
}) {
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <li
      data-next-step-id={step.id}
      data-next-step-index={index}
      className={cn(
        'grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 border-ink/15 border-b py-3 transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
        isLayoutAnimating && 'will-change-transform',
        isDragging &&
          'relative z-10 rounded-lg bg-paper shadow-[0_8px_24px_rgba(25,24,22,0.12)] ring-1 ring-ink/25'
      )}
      style={
        isLayoutAnimating
          ? {
              transform: `translate3d(0, ${motionOffsetY}px, 0)${
                isPointerTracking ? ' scale(1.015)' : ''
              }`,
              transitionDuration: isPointerTracking || isMotionInverted ? '0ms' : undefined,
            }
          : undefined
      }
    >
      <Button
        ref={registerHandle}
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn('cursor-grab touch-none', isDragging && 'cursor-grabbing')}
        aria-label={`Reorder ${step.title}, position ${index + 1} of ${total}`}
        aria-describedby="next-step-reorder-instructions"
        aria-pressed={isDragging}
        disabled={isBusy}
        onKeyDown={onDragKeyDown}
        onBlur={onDragBlur}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerCancel}
        onLostPointerCapture={onDragLostPointerCapture}
      >
        <GripVertical aria-hidden="true" />
      </Button>

      <span className="min-w-0 font-bold leading-snug [overflow-wrap:anywhere]">{step.title}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={(element) => {
              menuTriggerRef.current = element;
              registerMenuTrigger(element);
            }}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${step.title}`}
            disabled={isBusy || isDragging}
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={onMenuCloseAutoFocus}>
          <DropdownMenuItem onSelect={onMakeCurrent}>
            <ListStart aria-hidden="true" />
            Work on this next
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onComplete}>
            <Check aria-hidden="true" />
            Mark complete
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRequestEdit(menuTriggerRef.current)}>
            <Pencil aria-hidden="true" />
            Edit name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(-1)}>
            <ArrowUp aria-hidden="true" />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index === total - 1} onSelect={() => onMove(1)}>
            <ArrowDown aria-hidden="true" />
            Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => onRequestDelete(menuTriggerRef.current)}>
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
