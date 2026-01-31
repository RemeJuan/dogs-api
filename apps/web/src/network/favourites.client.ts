import api from '@web/network/api.controller';
import { tokenStorage } from '@web/network/token.storage';
import {
  AddFavouriteRequest,
  AddFavouriteResponse,
  FavouritesResponse,
} from '@dogs-api/shared-interfaces';

const AUTH_BASE = '/favourites';

function authHeader(): Record<string, string> | undefined {
  const t = tokenStorage.getAccessToken();
  if (!t) return undefined;
  return { Authorization: `Bearer ${t}` };
}

export async function getFavourites(): Promise<FavouritesResponse> {
  const headers = authHeader();
  return api.get<FavouritesResponse>(
    `${AUTH_BASE}`,
    headers ? { headers } : undefined,
  );
}

export async function addFavourite(
  payload: AddFavouriteRequest,
): Promise<AddFavouriteResponse> {
  const headers = authHeader();
  return api.post<AddFavouriteResponse, AddFavouriteRequest>(
    `${AUTH_BASE}`,
    payload,
    headers ? { headers } : undefined,
  );
}

export async function deleteFavourite(imageUrl: string): Promise<void> {
  const headers = authHeader();
  return api.delete<void>(
    `${AUTH_BASE}/`,
    { imageUrl },
    headers ? { headers } : undefined,
  );
}
