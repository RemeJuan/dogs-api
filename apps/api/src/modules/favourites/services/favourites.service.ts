import { Injectable } from '@nestjs/common';
import { FavouritesRepository } from './favourites.repository';
import { Favourite } from '@dogs-api/shared-interfaces';
import { v4 as uuidv4 } from 'uuid';
import {
  AddFavouriteDto,
  AddFavouriteResponseDto,
  FavouritesListDto,
} from '@api/modules/favourites/dtos/favourite.dto';

@Injectable()
export class FavouritesService {
  constructor(private readonly repository: FavouritesRepository) {}

  getAllFavourites(): FavouritesListDto {
    const favourites = this.repository.findAll();
    return { favourites };
  }

  addFavourite(request: AddFavouriteDto): AddFavouriteResponseDto {
    const favourite: Favourite = {
      id: uuidv4(),
      breed: request.breed,

      imageUrl: request.imageUrl,
      createdAt: new Date(),
    };

    this.repository.create(favourite);

    return { favourite };
  }

  deleteFavourite(id: string): void {
    this.repository.delete(id);
  }
}
