import { Module } from '@nestjs/common';
import { BreedsController } from '@api/modules/breeds/controllers/breeds.controller';
import { BreedsService } from '@api/modules/breeds/services/breeds.service';
import { CacheModule } from '@api/modules/cache/cache.module';
import { HttpDogCeoModule } from '@api/modules/http-dog-ceo/http-dog-ceo.module';

@Module({
  imports: [CacheModule, HttpDogCeoModule],
  controllers: [BreedsController],
  providers: [BreedsService],
})
export class BreedsModule {}