import * as React from 'react';
import { SWRProvider } from '@web/network/swr.client';
import { globalSWRCache } from '@web/network/utils/swr.utils';

export function Wrapper({ children }: { children?: React.ReactNode }) {
  try {
    (globalSWRCache as Map<string, unknown>).clear();
  } catch (e) {
    // ignore
  }

  return React.createElement(SWRProvider, null, children);
}
