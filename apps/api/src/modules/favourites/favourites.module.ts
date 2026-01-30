import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FavouritesController } from '@api/modules/favourites/controllers/favourites.controller';
import { FavouritesService } from '@api/modules/favourites/services/favourites.service';
import { FavouritesRepository } from '@api/modules/favourites/services/favourites.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: 'not-used-for-decoding',
    }),
  ],
  controllers: [FavouritesController],
  providers: [FavouritesService, FavouritesRepository],
})
export class FavouritesModule {}
