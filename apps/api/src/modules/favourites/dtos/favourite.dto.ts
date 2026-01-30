import { ApiProperty } from '@nestjs/swagger';
import { 
  Favourite, 
  AddFavouriteRequest, 
  AddFavouriteResponse, 
  FavouritesResponse 
} from '@dogs-api/shared-interfaces';

export class FavouriteDto implements Favourite {
  @ApiProperty({ description: 'Unique favourite ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Dog breed name', example: 'labrador' })
  breed: string;

  @ApiProperty({ description: 'Image URL', example: 'https://images.dog.ceo/breeds/labrador/1.jpg' })
  imageUrl: string;

  @ApiProperty({ description: 'Timestamp when favourite was created', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class AddFavouriteDto implements AddFavouriteRequest {
  @ApiProperty({ description: 'Dog breed name', example: 'labrador' })
  breed: string;

  @ApiProperty({ description: 'Image URL to save as favourite', example: 'https://images.dog.ceo/breeds/labrador/1.jpg' })
  imageUrl: string;
}

export class AddFavouriteResponseDto implements AddFavouriteResponse {
  @ApiProperty({ description: 'The created favourite', type: FavouriteDto })
  favourite: FavouriteDto;
}

export class FavouritesListDto implements FavouritesResponse {
  @ApiProperty({ description: 'List of all favourites', type: [FavouriteDto] })
  favourites: FavouriteDto[];
}