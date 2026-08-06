// @vitest-environment jsdom

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createEmptyAppState, createSeedAppState } from '@/lib/mock-data';
import { APP_STORAGE_KEY, createAppExport } from '@/lib/repository';
import { getRouter } from '@/router';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

async function renderSettings(state = createSeedAppState()) {
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));

  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ['/settings'] }) });
  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

describe('SettingsScreen', () => {
  it('provides accessible navigation and a summary of saved data', async () => {
    await renderSettings();

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('href')).toBe('/settings');
    expect(screen.getByText('Journeys')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export saved data' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose backup to import' })).toBeTruthy();
  });

  it('downloads a versioned backup without changing saved data', async () => {
    const state = createSeedAppState();
    await renderSettings(state);
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return 'blob:backup';
    });
    const revokeObjectURL = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Export saved data' }));

      expect(createObjectURL).toHaveBeenCalledOnce();
      const blob = createObjectURL.mock.calls[0]?.[0];
      if (!blob) throw new Error('Expected a backup Blob');
      expect(blob).toBeInstanceOf(Blob);
      const exportedData = JSON.parse(await blob.text());
      expect(exportedData).toMatchObject(createAppExport(state, exportedData.exportedAt));
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup');
      expect(click).toHaveBeenCalledOnce();
      expect(window.localStorage.getItem(APP_STORAGE_KEY)).toBe(JSON.stringify(state));
    } finally {
      if (originalCreateObjectURL) {
        Object.defineProperty(URL, 'createObjectURL', {
          configurable: true,
          value: originalCreateObjectURL,
        });
      } else {
        Reflect.deleteProperty(URL, 'createObjectURL');
      }
      if (originalRevokeObjectURL) {
        Object.defineProperty(URL, 'revokeObjectURL', {
          configurable: true,
          value: originalRevokeObjectURL,
        });
      } else {
        Reflect.deleteProperty(URL, 'revokeObjectURL');
      }
    }
  });

  it('reports invalid files and preserves the existing saved data', async () => {
    const state = createSeedAppState();
    await renderSettings(state);
    const input = screen.getByLabelText('Choose a 1000 Pomodoros backup file');
    const invalidFile = new File(['{"not":"a backup"}'], 'not-a-backup.json', {
      type: 'application/json',
    });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect((await screen.findByRole('alert')).textContent).toContain(
      'This file is not a supported 1000 Pomodoros backup.'
    );
    expect(window.localStorage.getItem(APP_STORAGE_KEY)).toBe(JSON.stringify(state));
  });

  it('validates a selected backup and replaces saved data only after confirmation', async () => {
    const importedState = createEmptyAppState();
    const importedJourney = createSeedAppState().journeys[0];
    if (!importedJourney) throw new Error('Expected the fixture Journey');
    importedState.journeys = [{ ...importedJourney, name: 'Imported Journey' }];
    importedState.lastActiveJourneyId = importedJourney.id;

    await renderSettings();
    const input = screen.getByLabelText('Choose a 1000 Pomodoros backup file');
    const backupFile = new File(
      [JSON.stringify(createAppExport(importedState))],
      'progress-backup.json',
      { type: 'application/json' }
    );

    fireEvent.change(input, { target: { files: [backupFile] } });

    expect(await screen.findByText(/progress-backup\.json is ready to import/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Replace saved data' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Replace saved data?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Replace saved data' }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(APP_STORAGE_KEY) ?? '')).toEqual(importedState);
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toContain(
      'Your saved Journeys and progress were replaced.'
    );
    expect(screen.getByText('0 minutes')).toBeTruthy();
  });
});
