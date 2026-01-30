import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BreedsModule } from '@api/modules/breeds/breeds.module';
import { ImagesModule } from '@api/modules/images/images.module';
import { FavouritesModule } from '@api/modules/favourites/favourites.module';
import { CacheModule } from '@api/modules/cache/cache.module';
import { DatabaseModule } from '@api/modules/database/database.module';
import { HttpDogCeoModule } from '@api/modules/http-dog-ceo/http-dog-ceo.module';
import { HttpDummyJsonModule } from '@api/modules/http-dummy-json/http-dummy-json.module';
import { AuthModule } from '@api/modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    CacheModule,
    HttpDogCeoModule,
    HttpDummyJsonModule,
    BreedsModule,
    ImagesModule,
    FavouritesModule,
    AuthModule,
  ],
})
export class AppModule {}
