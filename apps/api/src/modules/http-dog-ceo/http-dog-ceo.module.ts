import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DogCeoApiService } from '@api/modules/http-dog-ceo/services/dog-ceo-api.service';

@Module({
  imports: [HttpModule],
  providers: [DogCeoApiService],
  exports: [DogCeoApiService],
})
export class HttpDogCeoModule {}