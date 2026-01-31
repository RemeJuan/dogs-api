import { BreedListResponse } from '@dogs-api/shared-interfaces';
import { useApiSWR } from '@web/network/swr.client';
import { cacheGet, cacheHasKey } from '@web/network/utils/swr.utils';

export function useBreeds() {
  const key = '/breeds';

  const { data, error, isValidating, mutate } = useApiSWR<BreedListResponse>(
    key,
    {
      revalidateOnMount: !cacheHasKey(key),
      fallbackData: cacheGet<BreedListResponse>(key),
    },
  );

  return {
    dogs: data?.breeds,
    isLoading: !error && !data,
    isValidating,
    error,
    refetch: (opts?: { revalidate?: boolean }) =>
      mutate(undefined, opts?.revalidate ?? true) as Promise<
        BreedListResponse[] | undefined
      >,
  };
}
