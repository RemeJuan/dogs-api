import * as React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Wrapper } from './test-utils';
import { useImages } from '../use.images';

function TestComponent({ breed }: { breed?: string | null }) {
  const { images, isLoading, error } = useImages(breed ?? null);

  if (isLoading) return React.createElement('div', null, 'loading');
  if (error) return React.createElement('div', null, 'error');
  return React.createElement(
    'div',
    null,
    images ? images.join(',') : 'no-images',
  );
}

function TestComponentWithRefetch({ breed }: { breed: string }) {
  const { images, isLoading, refetch } = useImages(breed);

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      null,
      isLoading ? 'loading' : images ? images.join(',') : 'no-images',
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          // call refetch and ignore the promise here; tests will await UI update
          refetch();
        },
      },
      'refetch',
    ),
  );
}

describe('useImages', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does not fetch when breed is null', async () => {
    (global as any).fetch = jest.fn();

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(TestComponent, { breed: null }),
      ),
    );

    // immediate assertion: should show no-images and not call fetch
    expect(screen.getByText('no-images')).toBeDefined();
    expect((global as any).fetch).not.toHaveBeenCalled();

    delete (global as any).fetch;
  });

  it('returns loading state initially then images on success', async () => {
    const fakeResponse = { images: ['a.jpg', 'b.jpg'] };

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
    });

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(TestComponent, { breed: 'labrador' }),
      ),
    );

    expect(screen.getByText('loading')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/a.jpg/)).toBeDefined();
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
      React.createElement(
        Wrapper,
        null,
        React.createElement(TestComponent, { breed: 'labrador' }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('error')).toBeDefined();
    });

    delete (global as any).fetch;
  });

  it('refetch updates data', async () => {
    // first response
    const first = { images: ['one.jpg'] };
    // second response after refetch
    const second = { images: ['two.jpg'] };

    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => first })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => second,
      });

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(TestComponentWithRefetch, { breed: 'labrador' }),
      ),
    );

    // initial load
    await waitFor(() => {
      expect(screen.getByText(/one.jpg/)).toBeDefined();
    });

    // click refetch to trigger second response
    fireEvent.click(screen.getByText('refetch'));

    await waitFor(() => {
      expect(screen.getByText(/two.jpg/)).toBeDefined();
    });

    delete (global as any).fetch;
  });
});
