// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PomodoroBlock } from './pomodoro-block';
import { PomodoroGrid } from './pomodoro-grid';

afterEach(cleanup);

describe('PomodoroGrid', () => {
  it('exposes complete, partial, and future progress without relying on color', () => {
    render(<PomodoroGrid focusedMinutes={65} totalPomodoros={5} />);

    expect(screen.getByLabelText('2 complete pomodoros out of 5')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Pomodoro 1: complete' })).toHaveProperty(
      'dataset.state',
      'complete'
    );
    expect(screen.getByRole('img', { name: 'Pomodoro 2: complete' })).toHaveProperty(
      'dataset.state',
      'complete'
    );
    expect(
      screen.getByRole('img', {
        name: 'Pomodoro 3: partial, 60% filled',
      })
    ).toHaveProperty('dataset.state', 'partial');
    expect(
      screen
        .getByRole('img', {
          name: 'Pomodoro 3: partial, 60% filled',
        })
        .getAttribute('data-fill-percent')
    ).toBe('60');
    expect(screen.getByRole('img', { name: 'Pomodoro 4: future' })).toHaveProperty(
      'dataset.state',
      'future'
    );
  });

  it('caps a 2,400-pomodoro target at the default render limit', () => {
    render(<PomodoroGrid focusedMinutes={0} totalPomodoros={2_400} />);

    expect(screen.getAllByRole('img')).toHaveLength(100);
    expect(screen.getByText('Showing pomodoros 1–100 of 2,400.')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Pomodoro 101: future' })).toBeNull();
  });

  it('renders a bounded tail window without exceeding the target', () => {
    render(
      <PomodoroGrid
        focusedMinutes={0}
        totalPomodoros={2_400}
        startIndex={2_375}
        renderLimit={100}
      />
    );

    expect(screen.getAllByRole('img')).toHaveLength(25);
    expect(screen.getByRole('img', { name: 'Pomodoro 2376: future' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Pomodoro 2400: future' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Pomodoro 2401: future' })).toBeNull();
  });

  it('keeps complete, partial, and future base states when latest and milestone modifiers combine', () => {
    render(
      <PomodoroGrid
        focusedMinutes={37.5}
        totalPomodoros={4}
        latestIndex={1}
        milestoneIndexes={[0, 1, 2]}
      />
    );

    const completeMilestone = screen.getByRole('img', {
      name: 'Pomodoro 1: complete, milestone',
    });
    const partialLatestMilestone = screen.getByRole('img', {
      name: 'Pomodoro 2: partial, 50% filled, latest, milestone',
    });
    const futureMilestone = screen.getByRole('img', {
      name: 'Pomodoro 3: future, milestone',
    });

    expect(completeMilestone.getAttribute('data-state')).toBe('complete');
    expect(partialLatestMilestone.getAttribute('data-state')).toBe('partial');
    expect(partialLatestMilestone.getAttribute('data-latest')).toBe('true');
    expect(partialLatestMilestone.getAttribute('data-milestone')).toBe('true');
    expect(partialLatestMilestone.getAttribute('aria-current')).toBe('true');
    expect(partialLatestMilestone.className).toContain('outline-2');
    expect(futureMilestone.getAttribute('data-state')).toBe('future');
    expect(futureMilestone.querySelector('[data-milestone-notch="true"]')).toBeTruthy();
  });

  it('keeps legacy latest and milestone states compatible with composable base styling', () => {
    render(
      <>
        <PomodoroBlock state="latest" fraction={0.4} label="Legacy partial latest" />
        <PomodoroBlock state="milestone" fraction={0} label="Legacy future milestone" />
      </>
    );

    const latest = screen.getByRole('img', { name: 'Legacy partial latest' });
    const milestone = screen.getByRole('img', { name: 'Legacy future milestone' });

    expect(latest.getAttribute('data-state')).toBe('partial');
    expect(latest.getAttribute('data-fill-percent')).toBe('40');
    expect(latest.getAttribute('data-latest')).toBe('true');
    expect(milestone.getAttribute('data-state')).toBe('future');
    expect(milestone.getAttribute('data-milestone')).toBe('true');
  });

  it('uses focusable native buttons for selectable route-facing progress', () => {
    const onSelect = vi.fn();
    render(<PomodoroGrid focusedMinutes={25} totalPomodoros={2} onSelect={onSelect} />);

    const completedBlock = screen.getByRole('button', {
      name: 'Pomodoro 1: complete',
    });

    completedBlock.focus();
    expect(document.activeElement).toBe(completedBlock);
    expect(completedBlock.getAttribute('type')).toBe('button');

    fireEvent.click(completedBlock);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(0);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(completedBlock.getAttribute('data-pomodoro-index')).toBe('0');
    expect(completedBlock.className).toContain('min-h-11');
    expect(completedBlock.parentElement?.className).toContain('min-w-[30.25rem]');
    expect(completedBlock.className).toContain('focus-visible:ring-2');
    expect(
      screen.getByText('Swipe or scroll horizontally to inspect all 10 columns.')
    ).toBeTruthy();
  });

  it('makes only supplied absolute indexes selectable when selection is bounded', () => {
    const onSelect = vi.fn();
    render(
      <PomodoroGrid
        focusedMinutes={2_555}
        totalPomodoros={2_400}
        startIndex={100}
        renderLimit={100}
        selectableIndexes={[100, 101, 102]}
        onSelect={onSelect}
        selectionDialogId="pomodoro-detail-dialog"
        selectedIndex={102}
      />
    );

    const blocks = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('img'),
    ] as HTMLElement[];
    const selectablePartial = screen.getByRole('button', {
      name: 'Pomodoro 103: partial, 20% filled',
    });

    expect(blocks).toHaveLength(100);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Pomodoro 101: complete' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Pomodoro 104: future' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Pomodoro 104: future' }).className).toContain(
      'min-h-11'
    );
    expect(selectablePartial.getAttribute('data-pomodoro-index')).toBe('102');
    expect(selectablePartial.getAttribute('aria-haspopup')).toBe('dialog');
    expect(selectablePartial.getAttribute('aria-controls')).toBe('pomodoro-detail-dialog');
    expect(selectablePartial.getAttribute('aria-expanded')).toBe('true');
    expect(blocks.some((block) => block.getAttribute('data-pomodoro-index') === '100')).toBe(true);
    expect(blocks.some((block) => block.getAttribute('data-pomodoro-index') === '199')).toBe(true);
    expect(
      screen.getByLabelText('102 complete pomodoros out of 2400').firstElementChild?.className
    ).toContain('grid-cols-10');

    fireEvent.click(selectablePartial);
    expect(onSelect).toHaveBeenCalledWith(102);
    expect(screen.getByText('Showing pomodoros 101–200 of 2,400.')).toBeTruthy();
  });

  it('identifies and animates every newly earned full or partial block', () => {
    render(<PomodoroGrid focusedMinutes={32.5} totalPomodoros={4} highlightedIndexes={[0, 1]} />);

    const completed = screen.getByRole('img', {
      name: 'Pomodoro 1: complete, newly earned',
    });
    const partial = screen.getByRole('img', {
      name: 'Pomodoro 2: partial, 30% filled, newly earned',
    });

    expect(completed.getAttribute('data-newly-earned')).toBe('true');
    expect(partial.getAttribute('data-newly-earned')).toBe('true');
    expect(completed.className).toContain('duration-300');
    expect(completed.className).toContain('motion-reduce:animate-none');
  });
});
