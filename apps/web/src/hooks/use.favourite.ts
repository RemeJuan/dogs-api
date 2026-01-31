import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddFavouriteRequest, Favourite } from '@dogs-api/shared-interfaces';
import {
  addFavourite,
  deleteFavourite,
  getFavourites,
} from '@web/network/favourites.client';

type State = {
  favourites: Favourite[];
  isLoading: boolean;
  error: string | null;
};

export function useFavourites() {
  const [state, setState] = useState<State>({
    favourites: [],
    isLoading: true,
    error: null,
  });

  const clearError = useCallback(() => {
    setTimeout(() => {
      setState((s) => ({ ...s, error: null }));
    }, 3000);
  }, []);

  const favSet = useMemo(() => {
    return new Set(state.favourites.map((f) => f.imageUrl));
  }, [state.favourites]);

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const { favourites } = await getFavourites();

      setState({ favourites, isLoading: false, error: null });
    } catch (e: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e?.message ?? 'Failed to load favourites',
      }));

      clearError();
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const isFavourite = useCallback(
    (imageUrl: string) => favSet.has(imageUrl),
    [favSet],
  );

  const add = useCallback(
    async (payload: AddFavouriteRequest) => {
      const tempId = `temp-${Date.now()}`;
      const tempFavourite: Favourite = {
        id: tempId,
        breed: payload.breed,
        imageUrl: payload.imageUrl,
        createdAt: new Date(),
      };

      setState((s) => ({
        ...s,
        favourites: s.favourites.some((f) => f.imageUrl === payload.imageUrl)
          ? s.favourites
          : [...s.favourites, tempFavourite],
      }));

      try {
        const res = await addFavourite(payload);
        const created = res.favourite;

        setState((s) => ({
          ...s,
          favourites: s.favourites.map((f) => (f.id === tempId ? created : f)),
        }));
      } catch (e) {
        setState((s) => ({
          ...s,
          favourites: s.favourites.filter((f) => f.id !== tempId),
          error: 'Unable to add favourite. Please try again.',
        }));

        clearError();

        await refetch();
      }
    },
    [refetch],
  );

  const remove = useCallback(
    async (imageUrl: string) => {
      const prev = state.favourites;

      setState((s) => ({
        ...s,
        favourites: s.favourites.filter((f) => f.imageUrl !== imageUrl),
      }));

      try {
        await deleteFavourite(imageUrl);
      } catch (e) {
        console.log('delete favourite error', e);
        setState((s) => ({
          ...s,
          favourites: prev,
          error: 'Unable to remove favourite. Please try again.',
        }));

        clearError();
      }
    },
    [state.favourites],
  );

  const toggle = useCallback(
    async (payload: AddFavouriteRequest) => {
      if (favSet.has(payload.imageUrl)) {
        const fav = state.favourites.find(
          (f) => f.imageUrl === payload.imageUrl,
        );
        if (fav) return remove(fav.imageUrl);

        await refetch();
        return;
      }
      return add(payload);
    },
    [favSet, add, remove, state.favourites, refetch],
  );

  return {
    favourites: state.favourites,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    isFavourite,
    add,
    remove,
    toggle,
  };
}
