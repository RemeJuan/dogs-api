import { BreedImagesResponse } from '@dogs-api/shared-interfaces';
import { useApiSWR } from '@web/network/swr.client';
import { cacheGet, cacheHasKey } from '@web/network/utils/swr.utils';

export function useImages(breed?: string | null) {
  const key = breed ? `/breeds/${breed}/images` : null;

  const { data, error, isValidating, mutate } = useApiSWR<BreedImagesResponse>(
    key,
    {
      revalidateOnMount: key ? !cacheHasKey(key) : false,
      fallbackData: key
        ? cacheGet<BreedImagesResponse>(key)
        : ({} as BreedImagesResponse),
    },
  );

  const isLoading = breed && !error && !data;

  return {
    images: data?.images ?? [],
    isLoading,
    isValidating,
    error,
    refetch: (opts?: { revalidate?: boolean }) =>
      mutate(undefined, opts?.revalidate ?? true) as Promise<
        BreedImagesResponse[] | undefined
      >,
  };
}
