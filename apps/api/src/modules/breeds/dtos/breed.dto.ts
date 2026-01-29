import { ApiProperty } from '@nestjs/swagger';
import { Breed } from '@dogs-api/shared-interfaces';

export class BreedDto implements Breed {
  @ApiProperty({ description: 'The name of the dog breed', example: 'labrador' })
  name: string;
}

export class BreedListDto {
  @ApiProperty({ type: [BreedDto], description: 'List of all dog breeds' })
  breeds: BreedDto[];
}