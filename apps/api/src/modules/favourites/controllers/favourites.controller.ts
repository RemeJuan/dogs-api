import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { FavouritesService } from '@api/modules/favourites/services/favourites.service';
import { extractUserIdFromToken } from '@api/modules/auth/util/token.utils';
import {
  AddFavouriteDto,
  AddFavouriteResponseDto,
  FavouritesListDto,
} from '../dtos/favourite.dto';

@ApiTags('favourites')
@Controller('favourites')
export class FavouritesController {
  constructor(
    private readonly favouritesService: FavouritesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all favourites',
    description:
      'Returns all saved favourite dog images for the authenticated user',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Favourites retrieved successfully',
    type: FavouritesListDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getAllFavourites(
    @Headers('authorization') authorization: string,
  ): FavouritesListDto {
    const userId = extractUserIdFromToken(authorization, this.jwtService);
    return this.favouritesService.getAllFavourites(userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a favourite',
    description: 'Saves a dog image as a favourite for the authenticated user',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @ApiBody({ type: AddFavouriteDto })
  @ApiResponse({
    status: 201,
    description: 'Favourite added successfully',
    type: AddFavouriteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid favourite data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Image already in favourites',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  addFavourite(
    @Headers('authorization') authorization: string,
    @Body() request: AddFavouriteDto,
  ): AddFavouriteResponseDto {
    const userId = extractUserIdFromToken(authorization, this.jwtService);
    return this.favouritesService.addFavourite(userId, request);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a favourite',
    description: 'Removes a favourite by ID for the authenticated user',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The favourite ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Favourite deleted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 404, description: 'Favourite not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  deleteFavourite(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
  ): void {
    const userId = extractUserIdFromToken(authorization, this.jwtService);
    this.favouritesService.deleteFavourite(userId, id);
  }
}
