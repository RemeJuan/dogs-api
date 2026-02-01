import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddFavouriteRequest, Favourite } from '@dogs-api/shared-interfaces';
import {
  addFavourite,
  deleteFavourite,
  getFavourites,
} from '@web/network/favourites.client';
import { useAuthContext } from '@web/context/auth.context';

type State = {
  favourites: Favourite[];
  isLoading: boolean;
  error: string | null;
};

export function useFavourites() {
  const { isAuthenticated, toggleLoginModal } = useAuthContext();

  const [state, setState] = useState<State>({
    favourites: [],
    isLoading: false,
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
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, clearError]);

  useEffect(() => {
    // Only fetch when user becomes authenticated. If user logs out, clear favourites.
    if (isAuthenticated) {
      void refetch();
    } else {
      setState({ favourites: [], isLoading: false, error: null });
    }
  }, [isAuthenticated, refetch]);

  const isFavourite = useCallback(
    (imageUrl: string) => favSet.has(imageUrl),
    [favSet],
  );

  const add = useCallback(
    async (payload: AddFavouriteRequest) => {
      if (!isAuthenticated) {
        setState((s) => ({ ...s, error: 'Please log in to add favourites.' }));
        clearError();
        toggleLoginModal(true);
        return;
      }

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
    [isAuthenticated, clearError, toggleLoginModal, refetch],
  );

  const remove = useCallback(
    async (imageUrl: string) => {
      if (!isAuthenticated) {
        setState((s) => ({
          ...s,
          error: 'Please log in to remove favourites.',
        }));
        clearError();
        toggleLoginModal(true);
        return;
      }

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
    [isAuthenticated, state.favourites, clearError, toggleLoginModal],
  );

  const toggle = useCallback(
    async (payload: AddFavouriteRequest) => {
      if (!isAuthenticated) {
        setState((s) => ({
          ...s,
          error: 'Please log in to manage favourites.',
        }));
        clearError();
        toggleLoginModal(true);
        return;
      }

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
    [
      favSet,
      add,
      remove,
      state.favourites,
      refetch,
      isAuthenticated,
      clearError,
      toggleLoginModal,
    ],
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
