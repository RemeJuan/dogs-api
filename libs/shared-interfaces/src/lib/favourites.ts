export interface Favourite {
  id: string;
  breed: string;
  imageUrl: string;
  createdAt: Date;
}

export interface FavouritesResponse {
  favourites: Favourite[];
}

export interface AddFavouriteRequest {
  breed: string;
  imageUrl: string;
}

export interface AddFavouriteResponse {
  favourite: Favourite;
}

export interface RemoveFavouriteRequest {
  imageUrl: string;
}
