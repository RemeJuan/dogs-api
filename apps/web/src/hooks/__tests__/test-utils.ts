import * as React from 'react';
import { SWRConfig } from 'swr';

export function Wrapper({ children }: { children?: React.ReactNode }) {
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
