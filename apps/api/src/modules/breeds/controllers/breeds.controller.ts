import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BreedsService } from '@api/modules/breeds/services/breeds.service';
import { BreedListDto } from '@api/modules/breeds/dtos/breed.dto';

@ApiTags('breeds')
@Controller('breeds')
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dog breeds', description: 'Returns a list of all available dog breeds with optional sub-breeds' })
  @ApiResponse({ status: 200, description: 'List of breeds retrieved successfully', type: BreedListDto })
  async getAllBreeds(): Promise<BreedListDto> {
    return this.breedsService.getAllBreeds();
  }
}