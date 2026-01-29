import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@api/modules/cache/services/cache.service';
import { DogCeoApiService } from '@api/modules/http-dog-ceo/services/dog-ceo-api.service';
import { Breed } from '@dogs-api/shared-interfaces';
import {BreedListDto} from "@api/modules/breeds/dtos/breed.dto";

@Injectable()
export class BreedsService {
  private readonly CACHE_KEY = 'breeds:list:v1';
  private readonly CACHE_TTL: number;

  constructor(
    private readonly cacheService: CacheService,
    private readonly dogCeoApiService: DogCeoApiService,
    private readonly configService: ConfigService
  ) {
    this.CACHE_TTL = parseInt(this.configService.get<string>('CACHE_TTL_BREEDS', '86400'), 10);
  }

  async getAllBreeds(): Promise<BreedListDto> {
    const cached = this.cacheService.get<BreedListDto>(this.CACHE_KEY);

    if (cached) {
      return cached;
    }

    const breedsData = await this.dogCeoApiService.getAllBreeds();

    const breeds: Breed[] = Object.keys(breedsData).map(name => ({ name }));

    const response: BreedListDto = { breeds };

    this.cacheService.set(this.CACHE_KEY, response, this.CACHE_TTL);

    return response;
  }
}