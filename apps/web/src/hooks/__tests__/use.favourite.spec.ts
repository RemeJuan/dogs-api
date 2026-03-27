import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

import type { Mock } from 'vitest';
// Ensure the hook sees an authenticated user in tests and provide an AuthProvider
vi.mock('@web/context/auth.context', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    toggleLoginModal: vi.fn(),
  }),
  AuthProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

import { Wrapper } from '@web/utils/test-utils';
import { useFavourites } from '@web/hooks/use.favourite';

vi.mock('@web/network/favourites.client', () => ({
  __esModule: true,
  getFavourites: vi.fn(),
  addFavourite: vi.fn(),
  deleteFavourite: vi.fn(),
}));

import * as favClient from '@web/network/favourites.client';

const mockClient = favClient as unknown as {
  getFavourites: Mock;
  addFavourite: Mock;
  deleteFavourite: Mock;
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
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const existing = [
      { id: '1', breed: 'labrador', imageUrl: 'url', createdAt: new Date() },
    ];

    mockClient.getFavourites.mockResolvedValueOnce({ favourites: existing });
    mockClient.getFavourites.mockResolvedValue({ favourites: existing });
    mockClient.deleteFavourite.mockRejectedValue(new Error('delete-fail'));

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    await waitFor(() =>
      expect(screen.getByTestId('list').textContent).toContain('1:url'),
    );

    await act(async () => {
      screen.getByText('remove').click();
    });

    await waitFor(() => expect(screen.getByText('error')).toBeDefined());
    expect(mockClient.deleteFavourite).toHaveBeenCalledWith('url');
  });


});
