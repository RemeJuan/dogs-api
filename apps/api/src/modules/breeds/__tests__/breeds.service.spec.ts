import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BreedsService } from '../services/breeds.service';
import { CacheService } from '@api/modules/cache/services/cache.service';
import { DogCeoApiService } from '@api/modules/http-dog-ceo/services/dog-ceo-api.service';

describe('BreedsService', () => {
  let service: BreedsService;
  let cacheService: CacheService;
  let dogCeoApiService: DogCeoApiService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockDogCeoApiService = {
    getAllBreeds: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('86400'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreedsService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: DogCeoApiService, useValue: mockDogCeoApiService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BreedsService>(BreedsService);
    cacheService = module.get<CacheService>(CacheService);
    dogCeoApiService = module.get<DogCeoApiService>(DogCeoApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllBreeds', () => {
    it('should return cached breeds if available', async () => {
      const cachedBreeds = {
        breeds: [
          { name: 'labrador' },
          { name: 'bulldog' },
        ],
      };

      mockCacheService.get.mockReturnValue(cachedBreeds);

      const result = await service.getAllBreeds();

      expect(result).toEqual(cachedBreeds);
      expect(cacheService.get).toHaveBeenCalledWith('breeds:list:v1');
      expect(dogCeoApiService.getAllBreeds).not.toHaveBeenCalled();
    });

    it('should fetch breeds from API when cache is empty', async () => {
      const apiResponse = {
        labrador: [],
        bulldog: ['english', 'french'],
        poodle: ['toy', 'miniature', 'standard'],
      };

      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getAllBreeds.mockResolvedValue(apiResponse);

      const result = await service.getAllBreeds();

      expect(result.breeds).toHaveLength(3);
      expect(result.breeds[0]).toEqual({ name: 'labrador' });
      expect(result.breeds[1]).toEqual({ name: 'bulldog' });
      expect(result.breeds[2]).toEqual({ name: 'poodle' });
      expect(dogCeoApiService.getAllBreeds).toHaveBeenCalled();
    });

    it('should cache the fetched breeds', async () => {
      const apiResponse = {
        labrador: [],
        bulldog: ['english', 'french'],
      };

      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getAllBreeds.mockResolvedValue(apiResponse);

      await service.getAllBreeds();

      expect(cacheService.set).toHaveBeenCalledWith(
        'breeds:list:v1',
        expect.objectContaining({
          breeds: expect.arrayContaining([
            { name: 'labrador' },
            { name: 'bulldog' },
          ]),
        }),
        86400
      );
    });
  });
});