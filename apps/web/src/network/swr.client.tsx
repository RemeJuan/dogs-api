import React, { PropsWithChildren } from 'react';
import { SWRConfig, type Cache } from 'swr';
import api from './api.controller';
import useSWR, { type SWRConfiguration } from 'swr';
import { globalSWRCache, isPromiseLike } from '@web/network/utils/swr.utils';

const fetcher = <T,>(key: string): Promise<T> => api.get<T>(key);

export function SWRProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 2000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        shouldRetryOnError: false,
        provider: (_cache: Readonly<Cache<unknown>>) => {
          // Remove any pending Promise-like entries from the global cache so the
          // Map instance remains stable across HMR/remounts.
          try {
            for (const [k, v] of Array.from(
              (globalSWRCache as Map<string, unknown>).entries(),
            )) {
              if (isPromiseLike(v)) {
                (globalSWRCache as Map<string, unknown>).delete(k);
              }
            }
          } catch (e) {
            // ignore
          }

          return globalSWRCache;
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

export function useApiSWR<T = unknown>(
  key: string | null,
  options?: SWRConfiguration<T, unknown>,
) {
  return useSWR<T>(key, null, options);
}
