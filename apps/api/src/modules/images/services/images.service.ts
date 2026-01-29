import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@api/modules/cache/services/cache.service';
import { DogCeoApiService } from '@api/modules/http-dog-ceo/services/dog-ceo-api.service';
import {BreedImagesDto} from "@api/modules/images/dtos/breed-images.dto";

@Injectable()
export class ImagesService {
  private readonly CACHE_TTL: number;

  constructor(
    private readonly cacheService: CacheService,
    private readonly dogCeoApiService: DogCeoApiService,
    private readonly configService: ConfigService
  ) {
    this.CACHE_TTL = parseInt(this.configService.get<string>('CACHE_TTL_IMAGES', '60'), 10);
  }

  async getBreedImages(breed: string, count: number = 3): Promise<BreedImagesDto> {
    const cacheKey = `breed-images:${breed}:count:${count}`;

    const cached = this.cacheService.get<BreedImagesDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const images = await this.dogCeoApiService.getBreedImages(breed, count);

    const response: BreedImagesDto = { breed, images };

    this.cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }
}