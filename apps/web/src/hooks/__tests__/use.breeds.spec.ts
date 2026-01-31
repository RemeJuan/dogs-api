import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Wrapper } from './test-utils';
import { useBreeds } from '../use.breeds';
import * as swrUtils from '@web/network/utils/swr.utils';

const { act } = React;

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

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
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

  it('uses fallbackData from cache and does not revalidate on mount', async () => {
    jest.spyOn(swrUtils, 'cacheHasKey').mockReturnValue(true);
    jest
      .spyOn(swrUtils, 'cacheGet')
      .mockReturnValue({ breeds: [{ id: 'c1', name: 'Cached' }] });

    (global as any).fetch = jest.fn();

    render(
      React.createElement(Wrapper, null, React.createElement(TestComponent)),
    );

    expect(screen.getByText(/Cached/)).toBeDefined();
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('refetch updates the UI when network returns new data', async () => {
    const first = { breeds: [{ id: '1', name: 'First' }] };
    const second = { breeds: [{ id: '2', name: 'Second' }] };

    let call = 0;
    (global as any).fetch = jest.fn().mockImplementation(() => {
      call += 1;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => (call === 1 ? first : second),
      });
    });

    jest.spyOn(swrUtils, 'cacheHasKey').mockReturnValue(false);
    jest.spyOn(swrUtils, 'cacheGet').mockReturnValue(undefined as any);

    function TestRefetch() {
      const { dogs, isLoading, refetch } = useBreeds();
      return React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          null,
          isLoading
            ? 'loading'
            : dogs
              ? dogs.map((d: any) => d.name).join(',')
              : 'no-dogs',
        ),
        React.createElement(
          'button',
          {
            onClick: () => {
              refetch({ revalidate: true });
            },
          },
          'refetch',
        ),
      );
    }

    render(
      React.createElement(Wrapper, null, React.createElement(TestRefetch)),
    );

    await waitFor(() => expect(screen.getByText(/First/)).toBeDefined());

    const btn = screen.getByText('refetch');
    await act(async () => btn.click());

    await waitFor(() => expect(screen.getByText(/Second/)).toBeDefined());
  });
});
