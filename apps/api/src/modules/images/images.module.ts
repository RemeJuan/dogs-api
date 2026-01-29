import { Module } from '@nestjs/common';
import { ImagesController } from '@api/modules/images/controllers/images.controller';
import { ImagesService } from '@api/modules/images/services/images.service';
import { CacheModule } from '@api/modules/cache/cache.module';
import { HttpDogCeoModule } from '@api/modules/http-dog-ceo/http-dog-ceo.module';

@Module({
  imports: [CacheModule, HttpDogCeoModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}