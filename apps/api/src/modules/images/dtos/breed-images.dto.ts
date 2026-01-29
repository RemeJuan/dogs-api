import { ApiProperty } from '@nestjs/swagger';
import { BreedImagesResponse } from '@dogs-api/shared-interfaces';

export class BreedImagesDto implements BreedImagesResponse {
  @ApiProperty({ 
    description: 'The breed name', 
    example: 'labrador' 
  })
  breed: string;

  @ApiProperty({ 
    description: 'Array of image URLs for the breed', 
    example: [
      'https://images.dog.ceo/breeds/labrador/1.jpg',
      'https://images.dog.ceo/breeds/labrador/2.jpg',
      'https://images.dog.ceo/breeds/labrador/3.jpg'
    ],
    type: [String]
  })
  images: string[];
}