/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */

import {
  globalSWRCache,
  cacheHasKey,
  cacheGet,
  isPromiseLike,
} from '../swr.utils';

describe('swr.utils', () => {
  beforeEach(() => {
    const map = globalSWRCache as Map<string, unknown>;
    map.clear();
  });

  test('cacheHasKey and cacheGet behavior', () => {
    expect(cacheHasKey('foo')).toBe(false);
    expect(cacheGet('foo')).toBeUndefined();

    (globalSWRCache as Map<string, unknown>).set('foo', { a: 1 });

    expect(cacheHasKey('foo')).toBe(true);
    const v = cacheGet<{ a: number }>('foo');
    expect(v).toEqual({ a: 1 });
  });

  test('isPromiseLike identifies promises and thenables', () => {
    expect(isPromiseLike(Promise.resolve(1))).toBe(true);
    expect(isPromiseLike({ then: (fn: any) => {} })).toBe(true);

    expect(isPromiseLike(null)).toBe(false);
    expect(isPromiseLike(undefined)).toBe(false);
    expect(isPromiseLike(123)).toBe(false);
    expect(isPromiseLike({})).toBe(false);
    expect(isPromiseLike(() => {})).toBe(false);
  });

  test('respects existing __SWR_CACHE on globalThis when module is reloaded', () => {
    const original = (globalThis as any).__SWR_CACHE;

    jest.resetModules();

    const preexisting = new Map<string, unknown>();
    preexisting.set('pre', 123);
    (globalThis as any).__SWR_CACHE = preexisting;

    const mod = require('../swr.utils') as typeof import('../swr.utils');

    try {
      expect(mod.globalSWRCache).toBe(preexisting);
      expect(mod.cacheHasKey('pre')).toBe(true);
      expect(mod.cacheGet('pre')).toBe(123);
    } finally {
      if (original === undefined) delete (globalThis as any).__SWR_CACHE;
      else (globalThis as any).__SWR_CACHE = original;
      jest.resetModules();
    }
  });
});
