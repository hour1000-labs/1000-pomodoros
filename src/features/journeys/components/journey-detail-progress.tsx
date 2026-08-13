import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MilestoneProgress } from '@/components/shared/milestone-progress';
import { PomodoroBlock } from '@/components/shared/pomodoro-block';
import { PomodoroGrid } from '@/components/shared/pomodoro-grid';
import { Button } from '@/components/ui/button';
import type { Milestone } from '@/lib/models';

import {
  type JourneyBlockContributionView,
  JourneyDetailBlockDialog,
} from './journey-detail-block-dialog';

const FULL_VIEW_BATCH_SIZE = 3;
const SECTION_SIZE = 100;

function formatPomodoroCount(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function SectionGrid({
  startIndex,
  count,
  focusedMinutes,
  totalBlocks,
  latestIndex,
  milestoneIndexes,
  getBlockContributions,
  readOnly,
  onSelect,
  selectedIndex,
}: {
  startIndex: number;
  count: number;
  focusedMinutes: number;
  totalBlocks: number;
  latestIndex: number | null;
  milestoneIndexes: readonly number[];
  getBlockContributions: (index: number) => readonly JourneyBlockContributionView[];
  readOnly: boolean;
  onSelect: (index: number) => void;
  selectedIndex: number | null;
}) {
  const selectableIndexes = useMemo(() => {
    const indexes = Array.from({ length: count }, (_, offset) => startIndex + offset);

    return readOnly ? indexes.filter((index) => getBlockContributions(index).length > 0) : indexes;
  }, [count, getBlockContributions, readOnly, startIndex]);

  return (
    <PomodoroGrid
      focusedMinutes={focusedMinutes}
      totalPomodoros={totalBlocks}
      startIndex={startIndex}
      renderLimit={count}
      latestIndex={latestIndex ?? undefined}
      milestoneIndexes={[...milestoneIndexes]}
      selectableIndexes={selectableIndexes}
      onSelect={onSelect}
      selectionDialogId="journey-block-detail-dialog"
      selectedIndex={selectedIndex}
    />
  );
}

function GridLegend() {
  const items = [
    {
      label: 'Complete',
      pomodoro: <PomodoroBlock state="complete" label="Complete Pomodoro example" />,
    },
    {
      label: 'Partial',
      pomodoro: <PomodoroBlock state="partial" fraction={0.5} label="Partial Pomodoro example" />,
    },
    {
      label: 'Future',
      pomodoro: <PomodoroBlock state="future" label="Future Pomodoro example" />,
    },
    {
      label: 'Latest',
      pomodoro: <PomodoroBlock state="complete" latest label="Latest Pomodoro example" />,
    },
    {
      label: 'Milestone',
      pomodoro: <PomodoroBlock state="future" milestone label="Milestone Pomodoro example" />,
    },
  ];

  return (
    <ul
      className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0"
      aria-label="Pomodoro grid legend"
    >
      {items.map(({ label, pomodoro }) => (
        <li key={label} className="flex items-center gap-2">
          <span className="size-4 shrink-0" aria-hidden="true">
            {pomodoro}
          </span>
          <span className="text-ink/65 text-xs">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function JourneyDetailProgress({
  journeyId,
  focusedMinutes,
  totalPomodoros,
  targetBlocks,
  totalBlocks,
  totalSections,
  currentSectionIndex,
  currentSectionStart,
  currentSectionCount,
  currentMilestone,
  nextMilestone,
  nextMilestonePercentage,
  remainingPomodoros,
  latestIndex,
  milestoneIndexes,
  getBlockContributions,
  readOnly = false,
}: {
  journeyId: string;
  focusedMinutes: number;
  totalPomodoros: number;
  targetBlocks: number;
  totalBlocks: number;
  totalSections: number;
  currentSectionIndex: number;
  currentSectionStart: number;
  currentSectionCount: number;
  currentMilestone: Milestone | null;
  nextMilestone: Milestone | null;
  nextMilestonePercentage: number;
  remainingPomodoros: number;
  latestIndex: number | null;
  milestoneIndexes: readonly number[];
  getBlockContributions: (index: number) => readonly JourneyBlockContributionView[];
  readOnly?: boolean;
}) {
  const [fullView, setFullView] = useState(false);
  const [visibleSectionCount, setVisibleSectionCount] = useState(() =>
    Math.min(FULL_VIEW_BATCH_SIZE, totalSections)
  );
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const visibleSections = Math.min(visibleSectionCount, totalSections);
  const visibleSectionIndexes = useMemo(() => {
    const sectionIndexes = Array.from({ length: visibleSections }, (_, index) => index);

    if (currentSectionIndex >= visibleSections && currentSectionIndex < totalSections) {
      sectionIndexes.push(currentSectionIndex);
    }

    return sectionIndexes;
  }, [currentSectionIndex, totalSections, visibleSections]);
  const selectedContributions =
    selectedBlockIndex === null ? [] : getBlockContributions(selectedBlockIndex);
  const currentSectionEnd = currentSectionStart + currentSectionCount;
  const activeMilestoneTarget = currentMilestone?.targetFocusedMinutes ?? null;

  function changeView(showFull: boolean) {
    setFullView(showFull);
    if (showFull) setVisibleSectionCount(Math.min(FULL_VIEW_BATCH_SIZE, totalSections));
  }

  return (
    <section aria-labelledby="journey-progress-heading">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="journey-progress-heading" className="mb-0 font-bold text-3xl tracking-[-0.035em]">
          {formatPomodoroCount(totalPomodoros)} Pomodoros
        </h2>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          aria-pressed={fullView}
          onClick={() => changeView(!fullView)}
        >
          {fullView ? 'View current section' : 'View full Journey'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/15 bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-3 border-ink/15 border-b px-4 py-3 sm:px-5">
          <p className="mb-0 text-ink/65 text-sm">
            {fullView
              ? `${visibleSectionIndexes.length} of ${totalSections} sections`
              : `Section ${currentSectionIndex + 1} · Pomodoros ${currentSectionStart + 1}–${currentSectionEnd}`}
          </p>
          <p className="mb-0 font-bold text-sm tabular-nums">
            {formatPomodoroCount(totalPomodoros)} / {targetBlocks.toLocaleString()}
          </p>
        </div>

        {fullView ? (
          <div className="grid gap-8 p-4 sm:p-6">
            {visibleSectionIndexes.map((sectionIndex) => {
              const startIndex = sectionIndex * SECTION_SIZE;
              const count = Math.min(SECTION_SIZE, totalBlocks - startIndex);

              return (
                <section key={startIndex} aria-labelledby={`journey-section-${sectionIndex + 1}`}>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3
                      id={`journey-section-${sectionIndex + 1}`}
                      className="mb-0 font-bold text-lg"
                    >
                      Section {sectionIndex + 1}
                    </h3>
                    <span className="text-ink/65 text-xs tabular-nums">
                      {startIndex + 1}–{startIndex + count}
                    </span>
                  </div>
                  <SectionGrid
                    startIndex={startIndex}
                    count={count}
                    focusedMinutes={focusedMinutes}
                    totalBlocks={totalBlocks}
                    latestIndex={latestIndex}
                    milestoneIndexes={milestoneIndexes}
                    getBlockContributions={getBlockContributions}
                    readOnly={readOnly}
                    onSelect={setSelectedBlockIndex}
                    selectedIndex={selectedBlockIndex}
                  />
                </section>
              );
            })}

            {visibleSections < totalSections ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setVisibleSectionCount((count) =>
                    Math.min(totalSections, count + FULL_VIEW_BATCH_SIZE)
                  )
                }
              >
                <ChevronDown aria-hidden="true" />
                Show {Math.min(FULL_VIEW_BATCH_SIZE, totalSections - visibleSections)} more sections
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <SectionGrid
              startIndex={currentSectionStart}
              count={currentSectionCount}
              focusedMinutes={focusedMinutes}
              totalBlocks={totalBlocks}
              latestIndex={latestIndex}
              milestoneIndexes={milestoneIndexes}
              getBlockContributions={getBlockContributions}
              readOnly={readOnly}
              onSelect={setSelectedBlockIndex}
              selectedIndex={selectedBlockIndex}
            />
            {totalPomodoros === 0 ? (
              <p className="mt-4 mb-0 text-ink/60 text-sm">
                Finish a Focus session to add your first Pomodoro.
              </p>
            ) : null}
          </div>
        )}

        <div className="grid gap-5 border-ink/15 border-t px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-5">
          <MilestoneProgress
            value={nextMilestonePercentage}
            label={currentMilestone?.name ?? 'Journey target'}
            detail={`${Math.round(nextMilestonePercentage)}% · ${remainingPomodoros} pomodoros remaining`}
          />
          {nextMilestone ? (
            <p className="mb-0 text-ink/65 text-sm sm:text-right">
              Next after this: <span className="font-bold text-ink">{nextMilestone.name}</span>
            </p>
          ) : activeMilestoneTarget !== null ? (
            <p className="mb-0 text-ink/65 text-sm sm:text-right">Final Journey milestone</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <GridLegend />
      </div>

      <JourneyDetailBlockDialog
        journeyId={journeyId}
        blockIndex={selectedBlockIndex}
        contributions={selectedContributions}
        readOnly={readOnly}
        onOpenChange={(open) => {
          if (!open) setSelectedBlockIndex(null);
        }}
      />
    </section>
  );
}
