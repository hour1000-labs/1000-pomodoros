// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
