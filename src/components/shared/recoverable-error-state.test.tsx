// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecoverableErrorState } from './recoverable-error-state';

afterEach(cleanup);

describe('RecoverableErrorState', () => {
  it('keeps only the active layer primary while reset confirmation is open', async () => {
    const onReset = vi.fn();
    render(<RecoverableErrorState onRetry={vi.fn()} onReset={onReset} />);

    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry.getAttribute('data-variant')).toBe('default');

    fireEvent.click(screen.getByRole('button', { name: 'Reset saved progress' }));

    expect(await screen.findByRole('dialog', { name: 'Reset saved progress?' })).toBeTruthy();
    expect(retry.getAttribute('data-variant')).toBe('outline');

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));

    expect(onReset).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(retry.getAttribute('data-variant')).toBe('default');
    });
  });
});
