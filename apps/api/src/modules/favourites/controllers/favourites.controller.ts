import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { FavouritesService } from '@api/modules/favourites/services/favourites.service';
import {
  AddFavouriteDto,
  AddFavouriteResponseDto,
  FavouritesListDto
} from '../dtos/favourite.dto';

@ApiTags('favourites')
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favourites', description: 'Returns all saved favourite dog images' })
  @ApiResponse({ status: 200, description: 'Favourites retrieved successfully', type: FavouritesListDto })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getAllFavourites(): FavouritesListDto {
    return this.favouritesService.getAllFavourites();
  }

  @Post()
  @ApiOperation({ summary: 'Add a favourite', description: 'Saves a dog image as a favourite' })
  @ApiBody({ type: AddFavouriteDto })
  @ApiResponse({ status: 201, description: 'Favourite added successfully', type: AddFavouriteResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid favourite data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  addFavourite(@Body() request: AddFavouriteDto): AddFavouriteResponseDto {
    return this.favouritesService.addFavourite(request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a favourite', description: 'Removes a favourite by ID' })
  @ApiParam({ name: 'id', description: 'The favourite ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Favourite deleted successfully' })
  @ApiResponse({ status: 404, description: 'Favourite not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  deleteFavourite(@Param('id') id: string): void {
    this.favouritesService.deleteFavourite(id);
  }
}