import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Wrapper } from '@web/utils/test-utils';
import { useFavourites } from '@web/hooks/use.favourite';

jest.mock('@web/network/favourites.client', () => ({
  __esModule: true,
  getFavourites: jest.fn(),
  addFavourite: jest.fn(),
  deleteFavourite: jest.fn(),
}));

import * as favClient from '@web/network/favourites.client';

const mockClient = favClient as unknown as {
  getFavourites: jest.Mock;
  addFavourite: jest.Mock;
  deleteFavourite: jest.Mock;
};

function TestComponent() {
  const { favourites, isLoading, error, add, remove, isFavourite } =
    useFavourites();

  if (isLoading) return React.createElement('div', null, 'loading');
  if (error) return React.createElement('div', null, 'error');

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      { 'data-testid': 'list' },
      favourites.map((f: any) => `${f.id}:${f.imageUrl}`).join(','),
    ),
    React.createElement(
      'div',
      { 'data-testid': 'isfav' },
      isFavourite('url') ? 'yes' : 'no',
    ),
    React.createElement(
      'button',
      { onClick: () => void add({ breed: 'poodle', imageUrl: 'url-2' }) },
      'add',
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          (window as any).lastRemove = remove('url');
        },
      },
      'remove',
    ),
  );
}

describe('useFavourites', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns loading state initially and then data', async () => {
    const fake = {
      favourites: [
        {
          id: '1',
          breed: 'labrador',
          imageUrl: 'url',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ],
    };

    mockClient.getFavourites.mockResolvedValue(fake);

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    expect(screen.getByText('loading')).toBeDefined();

    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toContain('1:url'),
    );
    expect(screen.getByTestId('isfav').textContent).toContain('yes');
  });

  it('add - optimistic update then replaced with created favourite', async () => {
    mockClient.getFavourites.mockResolvedValue({ favourites: [] });

    const created = {
      favourite: {
        id: 'real-id',
        breed: 'poodle',
        imageUrl: 'url-2',
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
      },
    };

    mockClient.addFavourite.mockImplementation(
      () => new Promise((res) => setTimeout(() => res(created), 20)),
    );

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    await waitFor(() => expect(screen.getByTestId('list')).toBeDefined());

    await act(async () => {
      const btn = screen.getByText('add');
      btn.click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toMatch(/temp-/),
    );

    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toContain('real-id:url-2'),
    );
  });

  it('remove - optimistic removal is reverted on api failure', async () => {
    jest.useFakeTimers();

    const existing = [
      { id: '1', breed: 'labrador', imageUrl: 'url', createdAt: new Date() },
    ];

    mockClient.getFavourites.mockResolvedValueOnce({ favourites: existing });

    mockClient.getFavourites.mockResolvedValue({ favourites: existing });

    mockClient.deleteFavourite.mockImplementation(
      () =>
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('delete-fail')), 20),
        ),
    );

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toContain('1:url'),
    );

    await act(async () => {
      const btn = screen.getByText('remove');
      btn.click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toBe(''),
    );

    // Trigger the deleteFavourite rejection inside act so state updates are flushed
    await act(async () => {
      jest.advanceTimersByTime(20);
      // Allow any microtasks scheduled as a result of the timer to run
      await Promise.resolve();
      // Also await the removal promise here so the hook's catch+setState runs inside act
      try {
        await (window as any).lastRemove;
      } catch (e) {
        // ignore
      }
    });

    // wait for the removal promise to reject and be handled

    // await (window as any).lastRemove?.catch?.(() => {});

    // error should be shown
    await waitFor(() => expect(screen.getByText('error')).toBeDefined());

    // advance timers to clear the error (clearError uses 3000ms) inside act
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    // now the list should be restored
    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toContain('1:url'),
    );

    jest.useRealTimers();
  });
});
