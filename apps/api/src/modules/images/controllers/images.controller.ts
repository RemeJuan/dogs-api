import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ImagesService } from '@api/modules/images/services/images.service';
import { BreedImagesDto } from '../dtos/breed-images.dto';

@ApiTags('images')
@Controller('breeds')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':breed/images')
  @ApiOperation({ summary: 'Get breed images', description: 'Returns random images for a specific dog breed' })
  @ApiParam({ name: 'breed', description: 'The breed name', example: 'labrador' })
  @ApiQuery({ name: 'count', description: 'Number of images to return', example: 3, required: false })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully', type: BreedImagesDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid breed name or count parameter' })
  @ApiResponse({ status: 404, description: 'Not found - Breed does not exist' })
  @ApiResponse({ status: 500, description: 'Internal server error - Failed to fetch images from external API' })
  @ApiResponse({ status: 503, description: 'Service unavailable - External API is down' })
  async getBreedImages(
    @Param('breed') breed: string,
    @Query('count', new ParseIntPipe({ optional: true })) count: number = 3
  ): Promise<BreedImagesDto> {
    return this.imagesService.getBreedImages(breed, count);
  }
}