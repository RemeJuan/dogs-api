import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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

  getAllFavourites(userId: number): FavouritesListDto {
    const favourites = this.repository.findAllByUser(userId);
    return { favourites };
  }

  addFavourite(
    userId: number,
    request: AddFavouriteDto,
  ): AddFavouriteResponseDto {
    if (
      this.repository.existsByUserBreedAndImage(
        userId,
        request.breed,
        request.imageUrl,
      )
    ) {
      throw new ConflictException('This image is already in your favourites');
    }

    const favourite: Favourite = {
      id: uuidv4(),
      breed: request.breed,
      imageUrl: request.imageUrl,
      createdAt: new Date(),
    };

    this.repository.create(userId, favourite);

    return { favourite };
  }

  deleteFavourite(userId: number, id: string): void {
    const deleted = this.repository.deleteByUserAndId(userId, id);

    if (!deleted) {
      throw new NotFoundException('Favourite not found');
    }
  }
}
