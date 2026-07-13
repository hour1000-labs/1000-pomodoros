// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './confirm-dialog'

afterEach(cleanup)

describe('ConfirmDialog', () => {
  it('provides an accessible name, description, and labeled actions', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        trigger={<button type="button">Delete session</button>}
        title="Delete this session?"
        description="This removes 25 focused minutes from your progress."
        confirmLabel="Delete session"
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete this session?',
      description: 'This removes 25 focused minutes from your progress.',
    })
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Delete session' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Cancel' }),
      )
    })
  })

  it('confirms once, closes, and restores focus to the trigger', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        trigger={<button type="button">Remove progress</button>}
        title="Remove progress?"
        description="This cannot be undone."
        confirmLabel="Remove"
        onConfirm={onConfirm}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Remove progress' })
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(trigger)
    })
  })

  it('dismisses with Escape without confirming', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        trigger={<button type="button">Reset timer</button>}
        title="Reset timer?"
        description="Current timer progress will be cleared."
        onConfirm={onConfirm}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Reset timer' })
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Reset timer?' })
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(trigger)
    })
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
