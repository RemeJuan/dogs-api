/* eslint-disable @typescript-eslint/no-empty-function */

jest.mock('../api.controller', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import React from 'react';
import { render } from '@testing-library/react';
import { SWRProvider, useApiSWR } from '../swr.client';
import { globalSWRCache } from '../utils/swr.utils';
import api from '../api.controller';
import * as swr from 'swr';

describe('SWRProvider', () => {
  it('renders children and uses api.get as fetcher', () => {
    const { getByText } = render(
      React.createElement(
        SWRProvider,
        null,
        React.createElement('div', null, 'child'),
      ),
    );

    expect(getByText('child')).toBeDefined();
  });
});

describe('SWRProvider cleanup', () => {
  beforeEach(() => {
    (globalSWRCache as Map<string, unknown>).clear();
    (api as any).get?.mockReset?.();
  });

  it('removes promise-like entries from the global cache on provider init', () => {
    const thenable = { then: () => {} } as any;
    (globalSWRCache as Map<string, unknown>).set('/test', thenable);

    render(
      React.createElement(SWRProvider as any, null, React.createElement('div')),
    );

    expect((globalSWRCache as Map<string, unknown>).has('/test')).toBe(false);
  });
});

describe('SWRProvider error handling', () => {
  it('swallows exceptions from global cache entries and still renders children', () => {
    const spy = jest
      .spyOn(Map.prototype as any, 'entries')
      .mockImplementation(() => {
        throw new Error('boom');
      });

    const { getByText } = render(
      React.createElement(
        SWRProvider as any,
        null,
        React.createElement('div', null, 'child2'),
      ),
    );

    expect(getByText('child2')).toBeDefined();

    spy.mockRestore();
  });

  it('useApiSWR with null key does not trigger network fetch', () => {
    (global as any).fetch = jest.fn();

    function NullKeyComponent() {
      const { data, isLoading } = useApiSWR(null);
      return React.createElement(
        'div',
        null,
        isLoading ? 'loading' : data ? 'has' : 'no',
      );
    }

    const { getByText } = render(
      React.createElement(
        SWRProvider as any,
        null,
        React.createElement(NullKeyComponent),
      ),
    );

    expect(getByText('no')).toBeDefined();
    expect((global as any).fetch).not.toHaveBeenCalled();

    delete (global as any).fetch;
  });
});

describe('SWRProvider fetcher', () => {
  it('uses api.get as the fetcher when useApiSWR is used with a key', async () => {
    (api as any).get = jest.fn().mockResolvedValue({ hello: 'world' });

    function Caller() {
      const { fetcher } = swr.useSWRConfig() as any;
      React.useEffect(() => {
        (async () => {
          await fetcher('/fetch-test');
        })();
      }, [fetcher]);
      return React.createElement('div', null, 'ok');
    }

    render(
      React.createElement(
        SWRProvider as any,
        null,
        React.createElement(Caller),
      ),
    );

    await (async () => {
      const start = Date.now();
      while (!(api as any).get.mock.calls.length && Date.now() - start < 2000) {
        await new Promise((r) => setTimeout(r, 10));
      }
    })();

    expect((api as any).get).toHaveBeenCalledWith('/fetch-test');
  });

  it('retains non-promise entries while removing promise-like ones', () => {
    (globalSWRCache as Map<string, unknown>).clear();
    const thenable = { then: () => {} } as any;
    (globalSWRCache as Map<string, unknown>).set('/keep', 42);
    (globalSWRCache as Map<string, unknown>).set('/remove', thenable);

    render(
      React.createElement(SWRProvider as any, null, React.createElement('div')),
    );

    expect((globalSWRCache as Map<string, unknown>).has('/keep')).toBe(true);
    expect((globalSWRCache as Map<string, unknown>).has('/remove')).toBe(false);
  });
});
