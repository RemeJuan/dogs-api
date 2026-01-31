import { type Cache } from 'swr';

export const globalSWRCache: Cache<unknown> =
  (globalThis as any).__SWR_CACHE || new Map<string, unknown>();
if (!(globalThis as any).__SWR_CACHE)
  (globalThis as any).__SWR_CACHE = globalSWRCache;

export function cacheHasKey(key: string): boolean {
  try {
    return (globalSWRCache as Map<string, unknown>).has(key);
  } catch (e) {
    return false;
  }
}

export function cacheGet<T = unknown>(key: string): T | undefined {
  try {
    return (globalSWRCache as Map<string, unknown>).get(key) as T | undefined;
  } catch (e) {
    return undefined;
  }
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}
