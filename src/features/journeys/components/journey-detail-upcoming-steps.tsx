import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { NextStep } from '@/lib/models';
import { appRepository } from '@/lib/repository';

import { JourneyDetailUpcomingStepRow } from './journey-detail-upcoming-step-row';

type Feedback = { kind: 'error' | 'success'; message: string };
type RowMetric = { top: number; height: number };
type DragState = {
  stepId: string;
  originalIds: string[];
  orderedIds: string[];
  mode: 'keyboard' | 'pointer';
  pointerId: number | null;
  startY: number;
  pointerY: number;
  rowMetrics: Record<string, RowMetric> | null;
  scrollContainer: HTMLElement | null;
  startScrollTop: number;
  scrollTop: number;
  active: boolean;
};
type FocusDestination = { kind: 'handle' | 'menu'; stepId: string } | { kind: 'add' | 'start' };
type PendingFocus = FocusDestination & { timing: 'deferred' | 'menu-close' };
type BlockingState = {
  action: 'complete' | 'delete';
  step: NextStep;
};
type DeleteState = { step: NextStep };
type SettlingState = {
  offsets: ReadonlyMap<string, number>;
  phase: 'inverted' | 'settling';
};
type PointerDropMotion = { visualTops: ReadonlyMap<string, number> };

const POINTER_DRAG_THRESHOLD = 6;
const AUTO_SCROLL_EDGE_PX = 56;
const AUTO_SCROLL_MAX_PX = 14;

function moveItem(ids: readonly string[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= ids.length) {
    return [...ids];
  }

  const nextIds = [...ids];
  const [movedId] = nextIds.splice(fromIndex, 1);
  if (movedId === undefined) return [...ids];
  nextIds.splice(toIndex, 0, movedId);
  return nextIds;
}

function getUpcomingIds(nextSteps: readonly NextStep[], journeyId: string) {
  return nextSteps
    .filter(({ journeyId: ownerId, status }) => ownerId === journeyId && status === 'upcoming')
    .sort(
      (left, right) =>
        left.position - right.position ||
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id)
    )
    .map(({ id }) => id);
}

function getNormalizedActiveQueue(nextSteps: readonly NextStep[], journeyId: string) {
  const activeSteps = nextSteps
    .filter(
      ({ journeyId: ownerId, status }) =>
        ownerId === journeyId && (status === 'current' || status === 'upcoming')
    )
    .sort(
      (left, right) =>
        left.position - right.position ||
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id)
    );
  const currentSteps = activeSteps.filter(({ status }) => status === 'current');
  const upcomingSteps = activeSteps.filter(({ status }) => status === 'upcoming');
  const isNormalized =
    (activeSteps.length === 0 ? currentSteps.length === 0 : currentSteps.length === 1) &&
    (currentSteps[0]?.position ?? 0) === 0 &&
    upcomingSteps.every((step, index) => step.position === index + 1);

  return {
    activeIds: activeSteps.map(({ id }) => id),
    currentId: currentSteps[0]?.id ?? null,
    isNormalized,
    upcomingIds: upcomingSteps.map(({ id }) => id),
  };
}

function containsIdsInOrder(actual: readonly string[], requested: readonly string[]) {
  let requestedIndex = 0;
  for (const id of actual) {
    if (id === requested[requestedIndex]) requestedIndex += 1;
  }
  return requestedIndex === requested.length;
}

function matchesOrder(actual: readonly string[], expected: readonly string[]) {
  return actual.length === expected.length && actual.every((id, index) => id === expected[index]);
}

function getPointerOffset(dragState: DragState, pointerY: number, scrollTop = dragState.scrollTop) {
  return pointerY - dragState.startY + (scrollTop - dragState.startScrollTop);
}

function findScrollContainer(element: HTMLElement | null) {
  let candidate = element?.parentElement ?? null;
  while (candidate !== null) {
    const { overflowY } = window.getComputedStyle(candidate);
    if (/(auto|scroll)/.test(overflowY) && candidate.scrollHeight > candidate.clientHeight) {
      return candidate;
    }
    candidate = candidate.parentElement;
  }

  const scrollingElement = document.scrollingElement;
  return scrollingElement instanceof HTMLElement &&
    scrollingElement.scrollHeight > scrollingElement.clientHeight
    ? scrollingElement
    : null;
}

function getScrollViewportBounds(container: HTMLElement) {
  if (container === document.scrollingElement) {
    return { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0 };
  }
  return container.getBoundingClientRect();
}

function resolveFocusTarget(
  destination: FocusDestination,
  handleElements: ReadonlyMap<string, HTMLButtonElement>,
  menuElements: ReadonlyMap<string, HTMLButtonElement>
) {
  if (destination.kind === 'handle') {
    return handleElements.get(destination.stepId) ?? null;
  }
  if (destination.kind === 'menu') {
    return menuElements.get(destination.stepId) ?? null;
  }
  if (destination.kind === 'add') {
    return document.querySelector<HTMLElement>('[data-next-step-add]');
  }

  const startActions = Array.from(
    document.querySelectorAll<HTMLElement>('[data-current-next-step-start]')
  );
  const startAction =
    startActions.find((element) => element.getClientRects().length > 0) ??
    startActions.at(0) ??
    null;
  return (
    startAction ?? document.querySelector<HTMLElement>('[data-current-next-step-focus-fallback]')
  );
}

function getPointerLayout(dragState: DragState | null) {
  const offsets = new Map<string, number>();
  if (dragState?.mode !== 'pointer' || !dragState.active || dragState.rowMetrics === null) {
    return { offsets };
  }

  const firstMetric = dragState.rowMetrics[dragState.originalIds[0] ?? ''];
  if (firstMetric === undefined) return { offsets };

  let targetTop = firstMetric.top;
  for (const id of dragState.orderedIds) {
    const metric = dragState.rowMetrics[id];
    if (metric === undefined) continue;

    const targetOffset = targetTop - metric.top;
    offsets.set(id, targetOffset);
    targetTop += metric.height;
  }

  const pointerOffset = getPointerOffset(dragState, dragState.pointerY);
  offsets.set(dragState.stepId, pointerOffset);
  return { offsets };
}

function getPointerOrder(dragState: DragState, pointerY: number) {
  if (dragState.rowMetrics === null) return dragState.orderedIds;

  const draggedMetric = dragState.rowMetrics[dragState.stepId];
  const originalIndex = dragState.originalIds.indexOf(dragState.stepId);
  if (draggedMetric === undefined || originalIndex < 0) return dragState.orderedIds;

  const pointerOffset = getPointerOffset(dragState, pointerY);
  const draggedCenter = draggedMetric.top + pointerOffset + draggedMetric.height / 2;
  let targetIndex = originalIndex;

  if (pointerOffset > 0) {
    for (let index = originalIndex + 1; index < dragState.originalIds.length; index += 1) {
      const siblingMetric = dragState.rowMetrics[dragState.originalIds[index] ?? ''];
      if (
        siblingMetric === undefined ||
        draggedCenter <= siblingMetric.top + siblingMetric.height / 2
      ) {
        break;
      }
      targetIndex = index;
    }
  } else if (pointerOffset < 0) {
    for (let index = originalIndex - 1; index >= 0; index -= 1) {
      const siblingMetric = dragState.rowMetrics[dragState.originalIds[index] ?? ''];
      if (
        siblingMetric === undefined ||
        draggedCenter >= siblingMetric.top + siblingMetric.height / 2
      ) {
        break;
      }
      targetIndex = index;
    }
  }

  return moveItem(dragState.originalIds, originalIndex, targetIndex);
}

export function JourneyDetailUpcomingSteps({
  journeyId,
  upcomingSteps,
  activeSessionNextStepId,
  sessionReferencedNextStepIds,
}: {
  journeyId: string;
  upcomingSteps: readonly NextStep[];
  activeSessionNextStepId: string | null;
  sessionReferencedNextStepIds: readonly string[];
}) {
  const propIds = useMemo(() => upcomingSteps.map(({ id }) => id), [upcomingSteps]);
  const stepsById = useMemo(
    () => new Map(upcomingSteps.map((step) => [step.id, step])),
    [upcomingSteps]
  );
  const referencedIds = useMemo(
    () => new Set(sessionReferencedNextStepIds),
    [sessionReferencedNextStepIds]
  );
  const [previewIds, setPreviewIds] = useState(propIds);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [announcementVersion, setAnnouncementVersion] = useState(0);
  const [pendingFocus, setPendingFocusState] = useState<PendingFocus | null>(null);
  const [blockingState, setBlockingState] = useState<BlockingState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteErrorVersion, setDeleteErrorVersion] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settlingState, setSettlingState] = useState<SettlingState | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const actionInFlight = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const pendingPointerFlip = useRef<PointerDropMotion | null>(null);
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const suppressDialogReturnFocus = useRef(false);
  const blockingDialogReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const deleteDialogReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  const menuTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const pointerLayout = useMemo(() => getPointerLayout(dragState), [dragState]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (dragState === null) {
      setPreviewIds((currentIds) => (matchesOrder(currentIds, propIds) ? currentIds : propIds));
    }
  }, [dragState, propIds]);

  useEffect(() => {
    if (pendingFocus?.timing !== 'deferred' || settlingState !== null) return;

    const timeoutId = window.setTimeout(() => {
      resolveFocusTarget(pendingFocus, handleRefs.current, menuTriggerRefs.current)?.focus();
      pendingFocusRef.current = null;
      setPendingFocusState(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pendingFocus, settlingState]);

  useLayoutEffect(() => {
    const pendingFlip = pendingPointerFlip.current;
    pendingPointerFlip.current = null;
    if (pendingFlip === null || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const offsets = new Map<string, number>();
    for (const row of listRef.current?.querySelectorAll<HTMLElement>('[data-next-step-id]') ?? []) {
      const stepId = row.dataset.nextStepId;
      const visualTop = stepId === undefined ? undefined : pendingFlip.visualTops.get(stepId);
      if (stepId === undefined || visualTop === undefined) continue;

      const offsetY = visualTop - row.getBoundingClientRect().top;
      if (Math.abs(offsetY) > 0.5) offsets.set(stepId, offsetY);
    }

    if (offsets.size > 0) setSettlingState({ offsets, phase: 'inverted' });
  });

  useEffect(() => {
    if (settlingState === null) return;

    if (settlingState.phase === 'settling') {
      const timeoutId = window.setTimeout(() => setSettlingState(null), 220);
      return () => window.clearTimeout(timeoutId);
    }

    const frameId = window.requestAnimationFrame(() => {
      setSettlingState((current) => {
        if (current === null) return null;
        return {
          offsets: new Map(Array.from(current.offsets.keys()).map((stepId) => [stepId, 0])),
          phase: 'settling',
        };
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [settlingState]);

  const displayedIds = dragState?.mode === 'pointer' ? dragState.originalIds : previewIds;
  const displayedSteps = displayedIds.flatMap((id) => {
    const step = stepsById.get(id);
    return step === undefined ? [] : [step];
  });
  const isPreparingPointerFlip = pendingPointerFlip.current !== null;

  function setHandleRef(stepId: string, element: HTMLButtonElement | null) {
    if (element === null) handleRefs.current.delete(stepId);
    else handleRefs.current.set(stepId, element);
  }

  function setMenuTriggerRef(stepId: string, element: HTMLButtonElement | null) {
    if (element === null) menuTriggerRefs.current.delete(stepId);
    else menuTriggerRefs.current.set(stepId, element);
  }

  function queueFocus(focus: PendingFocus) {
    pendingFocusRef.current = focus;
    setPendingFocusState(focus);
  }

  function announce(message: string) {
    setAnnouncementVersion((version) => version + 1);
    setAnnouncement(message);
  }

  function clearPendingFocus() {
    pendingFocusRef.current = null;
    setPendingFocusState(null);
  }

  function stopAutoScroll() {
    if (autoScrollFrameRef.current === null) return;
    window.cancelAnimationFrame(autoScrollFrameRef.current);
    autoScrollFrameRef.current = null;
  }

  function scheduleAutoScroll() {
    if (autoScrollFrameRef.current !== null) return;
    autoScrollFrameRef.current = window.requestAnimationFrame(() => {
      autoScrollFrameRef.current = null;
      const current = dragStateRef.current;
      if (current?.mode !== 'pointer' || !current.active) return;
      const container = current.scrollContainer;
      if (container === null) return;

      const bounds = getScrollViewportBounds(container);
      const pointerY = current.pointerY;
      let velocity = 0;
      if (pointerY < bounds.top + AUTO_SCROLL_EDGE_PX) {
        velocity =
          -AUTO_SCROLL_MAX_PX *
          Math.min(
            1,
            Math.max(0, (bounds.top + AUTO_SCROLL_EDGE_PX - pointerY) / AUTO_SCROLL_EDGE_PX)
          );
      } else if (pointerY > bounds.bottom - AUTO_SCROLL_EDGE_PX) {
        velocity =
          AUTO_SCROLL_MAX_PX *
          Math.min(
            1,
            Math.max(0, (pointerY - (bounds.bottom - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX)
          );
      }

      const listBounds = listRef.current?.getBoundingClientRect();
      if (listBounds === undefined) return;
      if (velocity < 0) {
        const availableScroll = Math.max(0, bounds.top - listBounds.top);
        velocity = Math.max(velocity, -availableScroll);
      } else if (velocity > 0) {
        const availableScroll = Math.max(0, listBounds.bottom - bounds.bottom);
        velocity = Math.min(velocity, availableScroll);
      }

      if (velocity === 0) return;
      const previousScrollTop = container.scrollTop;
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = Math.min(maxScrollTop, Math.max(0, previousScrollTop + velocity));
      const nextScrollTop = container.scrollTop;
      if (nextScrollTop === previousScrollTop) return;

      const nextDragState = {
        ...current,
        scrollTop: nextScrollTop,
        orderedIds: getPointerOrder({ ...current, scrollTop: nextScrollTop }, pointerY),
      };
      const previousPosition = current.orderedIds.indexOf(current.stepId);
      const nextPosition = nextDragState.orderedIds.indexOf(current.stepId);
      dragStateRef.current = nextDragState;
      setPreviewIds(nextDragState.orderedIds);
      setDragState(nextDragState);
      if (nextPosition !== previousPosition) {
        const title = stepsById.get(current.stepId)?.title ?? 'Next step';
        announce(
          `${title} moved to position ${nextPosition + 1} of ${nextDragState.orderedIds.length}.`
        );
      }
      scheduleAutoScroll();
    });
  }

  useEffect(
    () => () => {
      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
      }
    },
    []
  );

  function handleMenuCloseAutoFocus(event: Event) {
    const requestedFocus = pendingFocusRef.current;
    if (requestedFocus?.timing !== 'menu-close') return;

    event.preventDefault();
    const target = resolveFocusTarget(requestedFocus, handleRefs.current, menuTriggerRefs.current);
    if (target !== null) {
      target.focus();
      clearPendingFocus();
      return;
    }

    queueFocus({ ...requestedFocus, timing: 'deferred' });
  }

  function getRemovalFocus(ids: readonly string[], removedIndex: number): FocusDestination {
    const stepId = ids[removedIndex] ?? ids[removedIndex - 1];
    return stepId === undefined ? { kind: 'add' } : { kind: 'menu', stepId };
  }

  function persistOrder(
    orderedIds: string[],
    stepId: string,
    focusTiming: PendingFocus['timing'] = 'deferred',
    pointerDropMotion?: PointerDropMotion
  ) {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setBusyStepId(stepId);
    setFeedback(null);
    setAnnouncement('');

    const result = appRepository.reorderUpcomingNextSteps(journeyId, orderedIds);
    const savedQueue =
      result.status === 'saved'
        ? getNormalizedActiveQueue(result.state.nextSteps, journeyId)
        : null;
    if (savedQueue?.isNormalized && containsIdsInOrder(savedQueue.activeIds, orderedIds)) {
      const step = stepsById.get(stepId);
      const wasUnchangedDrop =
        dragState !== null && matchesOrder(orderedIds, dragState.originalIds);
      const movedStepWasPromoted = savedQueue.currentId === stepId;
      const requestedFirstStepWasPromoted = savedQueue.currentId === orderedIds[0];
      const savedPosition = savedQueue.upcomingIds.indexOf(stepId) + 1;
      if (pointerDropMotion !== undefined) pendingPointerFlip.current = pointerDropMotion;
      setPreviewIds(savedQueue.upcomingIds);
      setFeedback(null);
      if (
        wasUnchangedDrop &&
        matchesOrder(savedQueue.upcomingIds, orderedIds) &&
        !movedStepWasPromoted
      ) {
        announce(
          `${step?.title ?? 'Next step'} dropped at position ${savedPosition} of ${savedQueue.upcomingIds.length}. The order did not change.`
        );
        queueFocus({ kind: 'handle', stepId, timing: focusTiming });
      } else if (movedStepWasPromoted) {
        const currentTitle = stepsById.get(savedQueue.currentId ?? '')?.title ?? 'Your first step';
        announce(`${currentTitle} is now your current Next step. Upcoming order saved.`);
        queueFocus({ kind: 'start', timing: focusTiming });
      } else {
        const action = dragState === null ? 'moved' : 'dropped';
        const promotedTitle = stepsById.get(savedQueue.currentId ?? '')?.title;
        const promotionAnnouncement =
          requestedFirstStepWasPromoted && promotedTitle !== undefined
            ? ` ${promotedTitle} is now your current Next step.`
            : '';
        announce(
          `${step?.title ?? 'Next step'} ${action} at position ${savedPosition} of ${savedQueue.upcomingIds.length}. Order saved.${promotionAnnouncement}`
        );
        queueFocus({ kind: 'handle', stepId, timing: focusTiming });
      }
    } else {
      if (pointerDropMotion !== undefined) pendingPointerFlip.current = pointerDropMotion;
      setPreviewIds(propIds);
      setFeedbackVersion((version) => version + 1);
      setFeedback({
        kind: 'error',
        message: 'Your Next steps could not be reordered. Nothing changed. Try again.',
      });
      queueFocus({ kind: 'handle', stepId, timing: focusTiming });
    }

    actionInFlight.current = false;
    setBusyStepId(null);
    dragStateRef.current = null;
    setDragState(null);
  }

  function startKeyboardDrag(step: NextStep) {
    if (settlingState !== null) return;
    const index = previewIds.indexOf(step.id);
    const nextDragState: DragState = {
      stepId: step.id,
      originalIds: [...previewIds],
      orderedIds: [...previewIds],
      mode: 'keyboard',
      pointerId: null,
      startY: 0,
      pointerY: 0,
      rowMetrics: null,
      scrollContainer: null,
      startScrollTop: 0,
      scrollTop: 0,
      active: true,
    };
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
    setFeedback(null);
    announce(
      `${step.title} picked up at position ${index + 1} of ${previewIds.length}. Use Arrow Up or Arrow Down to move, Space or Enter to drop, or Escape to cancel.`
    );
  }

  function cancelKeyboardDrag(step: NextStep) {
    const currentDragState = dragStateRef.current;
    if (
      currentDragState?.mode !== 'keyboard' ||
      currentDragState.stepId !== step.id ||
      !currentDragState.active
    ) {
      return;
    }

    setPreviewIds(currentDragState.originalIds);
    dragStateRef.current = null;
    setDragState(null);
    announce(`Reordering ${step.title} cancelled. The order did not change.`);
  }

  function handleDragKeyDown(step: NextStep, event: KeyboardEvent<HTMLButtonElement>) {
    const isOwnKeyboardDrag =
      dragState?.mode === 'keyboard' && dragState.stepId === step.id && dragState.active;

    if (!isOwnKeyboardDrag) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      startKeyboardDrag(step);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelKeyboardDrag(step);
      return;
    }

    if (event.key === 'Tab') {
      cancelKeyboardDrag(step);
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      persistOrder(dragState.orderedIds, step.id);
      return;
    }

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const currentIndex = dragState.orderedIds.indexOf(step.id);
    const nextIndex = currentIndex + (event.key === 'ArrowUp' ? -1 : 1);

    if (nextIndex < 0 || nextIndex >= dragState.orderedIds.length) {
      announce(
        `${step.title} is already at position ${currentIndex + 1} of ${dragState.orderedIds.length}.`
      );
      return;
    }

    const orderedIds = moveItem(dragState.orderedIds, currentIndex, nextIndex);
    const nextDragState = { ...dragState, orderedIds };
    setPreviewIds(orderedIds);
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
    announce(`${step.title} moved to position ${nextIndex + 1} of ${orderedIds.length}.`);
  }

  function handleDragBlur(step: NextStep) {
    cancelKeyboardDrag(step);
  }

  function handlePointerDown(step: NextStep, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || actionInFlight.current || settlingState !== null) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rowMetrics = Object.fromEntries(
      Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-next-step-id]') ?? []).map(
        (row) => {
          const bounds = row.getBoundingClientRect();
          return [
            row.dataset.nextStepId ?? '',
            { top: bounds.top, height: bounds.height },
          ] as const;
        }
      )
    );
    const scrollContainer = findScrollContainer(listRef.current);
    const nextDragState: DragState = {
      stepId: step.id,
      originalIds: [...previewIds],
      orderedIds: [...previewIds],
      mode: 'pointer',
      pointerId: event.pointerId,
      startY: event.clientY,
      pointerY: event.clientY,
      rowMetrics,
      scrollContainer,
      startScrollTop: scrollContainer?.scrollTop ?? 0,
      scrollTop: scrollContainer?.scrollTop ?? 0,
      active: false,
    };
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  }

  function isInsideUpcomingList(
    clientX: number,
    clientY: number,
    scrollContainer: HTMLElement | null
  ) {
    const bounds = listRef.current?.getBoundingClientRect();
    if (bounds === undefined) return false;
    const scrollBounds =
      scrollContainer === null ? undefined : getScrollViewportBounds(scrollContainer);
    const left = Math.max(bounds.left, scrollBounds?.left ?? bounds.left);
    const right = Math.min(bounds.right, scrollBounds?.right ?? bounds.right);
    const top = Math.max(bounds.top, scrollBounds?.top ?? bounds.top);
    const bottom = Math.min(bounds.bottom, scrollBounds?.bottom ?? bounds.bottom);

    return clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;
  }

  function handlePointerMove(step: NextStep, event: PointerEvent<HTMLButtonElement>) {
    const currentDragState = dragStateRef.current;
    if (
      currentDragState?.mode !== 'pointer' ||
      currentDragState.stepId !== step.id ||
      currentDragState.pointerId !== event.pointerId
    ) {
      return;
    }

    const active =
      currentDragState.active ||
      Math.abs(event.clientY - currentDragState.startY) >= POINTER_DRAG_THRESHOLD;
    if (!active) return;
    event.preventDefault();
    const scrollTop = currentDragState.scrollContainer?.scrollTop ?? currentDragState.scrollTop;
    const orderedIds = getPointerOrder({ ...currentDragState, scrollTop }, event.clientY);
    const previousPosition = currentDragState.orderedIds.indexOf(step.id);
    const nextPosition = orderedIds.indexOf(step.id);
    const nextDragState = {
      ...currentDragState,
      active: true,
      orderedIds,
      pointerY: event.clientY,
      scrollTop,
    };
    dragStateRef.current = nextDragState;
    setPreviewIds(orderedIds);
    setDragState(nextDragState);
    if (nextPosition !== previousPosition) {
      announce(`${step.title} moved to position ${nextPosition + 1} of ${orderedIds.length}.`);
    }
    scheduleAutoScroll();
  }

  function handlePointerUp(step: NextStep, event: PointerEvent<HTMLButtonElement>) {
    const currentDragState = dragStateRef.current;
    if (
      currentDragState?.mode !== 'pointer' ||
      currentDragState.stepId !== step.id ||
      currentDragState.pointerId !== event.pointerId
    ) {
      return;
    }

    stopAutoScroll();
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const active =
      currentDragState.active ||
      Math.abs(event.clientY - currentDragState.startY) >= POINTER_DRAG_THRESHOLD;
    if (!active) {
      setDragState(null);
      return;
    }

    if (!isInsideUpcomingList(event.clientX, event.clientY, currentDragState.scrollContainer)) {
      setPreviewIds(currentDragState.originalIds);
      setDragState(null);
      announce(`Reordering ${step.title} cancelled. The order did not change.`);
      return;
    }

    const finalDragState: DragState = {
      ...currentDragState,
      active: true,
      scrollTop: currentDragState.scrollContainer?.scrollTop ?? currentDragState.scrollTop,
      pointerY: event.clientY,
    };
    finalDragState.orderedIds = getPointerOrder(finalDragState, event.clientY);
    const visualTops = new Map<string, number>();
    for (const row of listRef.current?.querySelectorAll<HTMLElement>('[data-next-step-id]') ?? []) {
      const stepId = row.dataset.nextStepId;
      if (stepId === undefined) continue;
      const finalPointerAdjustment =
        stepId === step.id ? event.clientY - currentDragState.pointerY : 0;
      visualTops.set(stepId, row.getBoundingClientRect().top + finalPointerAdjustment);
    }
    setPreviewIds(finalDragState.orderedIds);
    persistOrder(finalDragState.orderedIds, step.id, 'deferred', {
      visualTops,
    });
  }

  function handlePointerCancel(step: NextStep, event: PointerEvent<HTMLButtonElement>) {
    const currentDragState = dragStateRef.current;
    if (currentDragState?.mode !== 'pointer' || currentDragState.stepId !== step.id) return;
    stopAutoScroll();
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setPreviewIds(currentDragState.originalIds);
    setDragState(null);
    if (currentDragState.active) {
      announce(`Reordering ${step.title} cancelled. The order did not change.`);
    }
  }

  function handleLostPointerCapture(step: NextStep) {
    const currentDragState = dragStateRef.current;
    if (currentDragState?.mode !== 'pointer' || currentDragState.stepId !== step.id) return;
    stopAutoScroll();
    setPreviewIds(currentDragState.originalIds);
    dragStateRef.current = null;
    setDragState(null);
    if (currentDragState.active) {
      announce(`Reordering ${step.title} cancelled. The order did not change.`);
    }
  }

  function handleMove(step: NextStep, direction: -1 | 1) {
    const currentIndex = previewIds.indexOf(step.id);
    const orderedIds = moveItem(previewIds, currentIndex, currentIndex + direction);
    if (!matchesOrder(orderedIds, previewIds)) {
      persistOrder(orderedIds, step.id, 'menu-close');
    }
  }

  function handleMakeCurrent(step: NextStep) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusyStepId(step.id);
    setFeedback(null);
    setAnnouncement('');
    const result = appRepository.makeNextStepCurrent(journeyId, step.id);
    const selectedStep =
      result.status === 'saved'
        ? result.state.nextSteps.find(({ id }) => id === step.id)
        : undefined;

    if (selectedStep?.status === 'current') {
      setFeedback({ kind: 'success', message: `“${step.title}” is now your Next step.` });
      announce(`${step.title} is now your current Next step.`);
      queueFocus({ kind: 'start', timing: 'menu-close' });
    } else {
      setFeedbackVersion((version) => version + 1);
      setFeedback({
        kind: 'error',
        message: 'Your current Next step could not be changed. Nothing changed. Try again.',
      });
      queueFocus({ kind: 'menu', stepId: step.id, timing: 'menu-close' });
    }

    actionInFlight.current = false;
    setBusyStepId(null);
  }

  function handleComplete(step: NextStep, returnFocus: HTMLButtonElement | null) {
    if (activeSessionNextStepId === step.id) {
      blockingDialogReturnFocusRef.current = returnFocus;
      setBlockingState({ action: 'complete', step });
      return;
    }
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setBusyStepId(step.id);
    setFeedback(null);
    setAnnouncement('');
    const removedIndex = previewIds.indexOf(step.id);
    const result = appRepository.completeUpcomingNextStep(
      journeyId,
      step.id,
      new Date().toISOString()
    );
    const completedStep =
      result.status === 'saved'
        ? result.state.nextSteps.find(({ id }) => id === step.id)
        : undefined;

    if (result.status === 'saved' && completedStep?.status === 'completed') {
      const savedIds = getUpcomingIds(result.state.nextSteps, journeyId);
      setFeedback({ kind: 'success', message: `Marked “${step.title}” complete.` });
      announce(`${step.title} marked complete.`);
      queueFocus({
        ...getRemovalFocus(savedIds, removedIndex),
        timing: 'menu-close',
      });
    } else {
      setFeedbackVersion((version) => version + 1);
      setFeedback({
        kind: 'error',
        message: 'Your Next step could not be completed. Nothing changed. Try again.',
      });
      queueFocus({ kind: 'menu', stepId: step.id, timing: 'menu-close' });
    }

    actionInFlight.current = false;
    setBusyStepId(null);
  }

  function requestDelete(step: NextStep, returnFocus: HTMLButtonElement | null) {
    if (referencedIds.has(step.id)) {
      blockingDialogReturnFocusRef.current = returnFocus;
      setBlockingState({ action: 'delete', step });
      return;
    }

    suppressDialogReturnFocus.current = false;
    deleteDialogReturnFocusRef.current = returnFocus;
    setDeleteError(null);
    setDeleteState({ step });
  }

  function handleDelete() {
    if (deleteState === null || actionInFlight.current) return;
    const { step } = deleteState;
    actionInFlight.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    setAnnouncement('');
    const removedIndex = previewIds.indexOf(step.id);
    const result = appRepository.deleteUpcomingNextStep(journeyId, step.id);
    const wasDeleted =
      result.status === 'saved' && !result.state.nextSteps.some(({ id }) => id === step.id);

    if (wasDeleted) {
      const savedIds = getUpcomingIds(result.state.nextSteps, journeyId);
      suppressDialogReturnFocus.current = true;
      setDeleteState(null);
      setFeedback({ kind: 'success', message: `Deleted “${step.title}”.` });
      announce(`${step.title} deleted.`);
      queueFocus({ ...getRemovalFocus(savedIds, removedIndex), timing: 'deferred' });
    } else {
      setDeleteErrorVersion((version) => version + 1);
      setDeleteError('This Next step could not be deleted. Nothing changed. Try again.');
    }

    actionInFlight.current = false;
    setIsDeleting(false);
  }

  const blockingStepTitle = blockingState?.step.title ?? 'This step';
  const isBlockingActiveSession = activeSessionNextStepId === blockingState?.step.id;
  const blockingTitle = isBlockingActiveSession
    ? 'Finish this Focus session first'
    : `Keep “${blockingStepTitle}” in your history`;
  const blockingDescription = isBlockingActiveSession
    ? blockingState?.action === 'delete'
      ? `“${blockingStepTitle}” is attached to your running or paused Focus session. Finish or cancel that session first, then mark this step complete so its title stays in your history.`
      : `“${blockingStepTitle}” is attached to your running or paused Focus session. Finish or cancel that session before marking it complete.`
    : `“${blockingStepTitle}” has Focus sessions in your history. Mark it complete instead so those sessions keep their Next-step title.`;

  return (
    <>
      <p id="next-step-reorder-instructions" className="sr-only">
        Press Space or Enter to pick up a Next step. Use Arrow Up or Arrow Down to move it. Press
        Space or Enter to drop, or Escape to cancel.
      </p>
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        <span key={announcementVersion}>{announcement}</span>
      </p>
      {feedback ? (
        <p
          key={feedback.kind === 'error' ? feedbackVersion : undefined}
          className={`mb-3 text-sm ${
            feedback.kind === 'error' ? 'font-bold text-pomodoro-red' : 'text-ink/65'
          }`}
          role={feedback.kind === 'error' ? 'alert' : undefined}
        >
          {feedback.message}
        </p>
      ) : null}
      {displayedSteps.length === 0 ? (
        <p className="my-0 text-ink/55 text-sm">No upcoming steps.</p>
      ) : (
        <ol ref={listRef} className="m-0 list-none p-0" aria-label="Upcoming Next steps">
          {displayedSteps.map((step, index) => {
            const isPointerDragging =
              dragState?.mode === 'pointer' && dragState.active && dragState.stepId === step.id;
            const isPointerLayoutActive = dragState?.mode === 'pointer' && dragState.active;
            const isSettling = settlingState !== null;
            const motionOffsetY = isPointerLayoutActive
              ? (pointerLayout.offsets.get(step.id) ?? 0)
              : isSettling
                ? (settlingState.offsets.get(step.id) ?? 0)
                : 0;

            return (
              <JourneyDetailUpcomingStepRow
                key={step.id}
                step={step}
                index={index}
                total={displayedSteps.length}
                isDragging={dragState?.stepId === step.id && dragState.active}
                isBusy={
                  busyStepId !== null ||
                  settlingState !== null ||
                  (dragState?.stepId !== undefined && dragState.stepId !== step.id)
                }
                isPointerTracking={isPointerDragging}
                isMotionInverted={isPreparingPointerFlip || settlingState?.phase === 'inverted'}
                isLayoutAnimating={isPointerLayoutActive || isPreparingPointerFlip || isSettling}
                motionOffsetY={motionOffsetY}
                onDragKeyDown={(event) => handleDragKeyDown(step, event)}
                onDragBlur={() => handleDragBlur(step)}
                onDragPointerDown={(event) => handlePointerDown(step, event)}
                onDragPointerMove={(event) => handlePointerMove(step, event)}
                onDragPointerUp={(event) => handlePointerUp(step, event)}
                onDragPointerCancel={(event) => handlePointerCancel(step, event)}
                onDragLostPointerCapture={() => handleLostPointerCapture(step)}
                onMove={(direction) => handleMove(step, direction)}
                onMakeCurrent={() => handleMakeCurrent(step)}
                onComplete={() =>
                  handleComplete(step, menuTriggerRefs.current.get(step.id) ?? null)
                }
                onRequestDelete={(returnFocus) => requestDelete(step, returnFocus)}
                onMenuCloseAutoFocus={handleMenuCloseAutoFocus}
                registerHandle={(element) => setHandleRef(step.id, element)}
                registerMenuTrigger={(element) => setMenuTriggerRef(step.id, element)}
              />
            );
          })}
        </ol>
      )}

      <Dialog
        open={blockingState !== null}
        onOpenChange={(open) => {
          if (!open) setBlockingState(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            blockingDialogReturnFocusRef.current?.focus();
            blockingDialogReturnFocusRef.current = null;
          }}
        >
          <DialogHeader>
            <DialogTitle>{blockingTitle}</DialogTitle>
            <DialogDescription>{blockingDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteState !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteError(null);
            setDeleteState(null);
          }
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!suppressDialogReturnFocus.current) deleteDialogReturnFocusRef.current?.focus();
            suppressDialogReturnFocus.current = false;
            deleteDialogReturnFocusRef.current = null;
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete “{deleteState?.step.title}”?</DialogTitle>
            <DialogDescription>
              This removes the Upcoming step permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p
              key={deleteErrorVersion}
              className="mb-0 font-bold text-pomodoro-red text-sm"
              role="alert"
            >
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="bg-pomodoro-red text-paper hover:bg-ink hover:text-paper dark:bg-pomodoro-red dark:text-paper dark:hover:bg-ink dark:hover:text-paper"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Deleting…' : 'Delete step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
