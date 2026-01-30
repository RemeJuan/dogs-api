import React, { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';
import api from './api.controller';

export function SWRProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        fetcher: (key: string) => api.get(key),
        dedupingInterval: 2000,
        revalidateOnFocus: true,
        shouldRetryOnError: false,
        provider: () => new Map(),
      }}
    >
      {children}
    </SWRConfig>
  );
}
