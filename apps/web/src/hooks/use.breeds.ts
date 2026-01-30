import useSWR from 'swr';
import { BreedListResponse } from '@dogs-api/shared-interfaces';

export function useBreeds() {
  const { data, error, isValidating, mutate } =
    useSWR<BreedListResponse>('/breeds');

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
