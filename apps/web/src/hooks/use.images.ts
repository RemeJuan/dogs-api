import useSWR from 'swr';
import {
  BreedImagesResponse,
  BreedListResponse,
} from '@dogs-api/shared-interfaces';

export function useImages(breed?: string | null) {
  const key = breed ? `/breeds/${breed}/images` : null;

  const { data, error, isValidating, mutate } =
    useSWR<BreedImagesResponse>(key);

  const isLoading = breed && !error && !data;

  return {
    images: data?.images,
    isLoading,
    isValidating,
    error,
    refetch: (opts?: { revalidate?: boolean }) =>
      mutate(undefined, opts?.revalidate ?? true) as Promise<
        BreedImagesResponse[] | undefined
      >,
  };
}
