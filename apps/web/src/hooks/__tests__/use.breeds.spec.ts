import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useBreeds } from '../use.breeds';

function Wrapper({ children }: { children?: React.ReactNode }) {
  return React.createElement(
    SWRConfig,
    {
      value: {
        provider: () => new Map(),
        fetcher: (key: string) =>
          (fetch(key) as Promise<any>).then((r) => r.json()),
      },
    },
    children,
  );
}

function TestComponent() {
  const { dogs, isLoading, error } = useBreeds();

  if (isLoading) return React.createElement('div', null, 'loading');
  if (error) return React.createElement('div', null, 'error');
  return React.createElement(
    'div',
    null,
    dogs ? dogs.map((d: any) => d.name).join(',') : 'no-dogs',
  );
}

describe('useBreeds', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns loading state initially and then data', async () => {
    const fakeResponse = { breeds: [{ id: '1', name: 'Labrador' }] };

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
    });

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    // existence assertion without jest-dom
    expect(screen.getByText('loading')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Labrador/)).toBeDefined();
    });

    delete (global as any).fetch;
  });

  it('exposes error when fetch fails', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'bad',
    });

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    await waitFor(() => {
      expect(screen.getByText('error')).toBeDefined();
    });

    delete (global as any).fetch;
  });
});
