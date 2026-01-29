import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImagesService } from '../services/images.service';
import { CacheService } from '@api/modules/cache/services/cache.service';
import { DogCeoApiService } from '@api/modules/http-dog-ceo/services/dog-ceo-api.service';

describe('ImagesService', () => {
  let service: ImagesService;
  let cacheService: CacheService;
  let dogCeoApiService: DogCeoApiService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockDogCeoApiService = {
    getBreedImages: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('60'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: DogCeoApiService, useValue: mockDogCeoApiService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    cacheService = module.get<CacheService>(CacheService);
    dogCeoApiService = module.get<DogCeoApiService>(DogCeoApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBreedImages', () => {
    it('should return cached images if available', async () => {
      const cachedImages = {
        breed: 'labrador',
        images: [
          'https://images.dog.ceo/breeds/labrador/1.jpg',
          'https://images.dog.ceo/breeds/labrador/2.jpg',
          'https://images.dog.ceo/breeds/labrador/3.jpg',
        ],
      };

      mockCacheService.get.mockReturnValue(cachedImages);

      const result = await service.getBreedImages('labrador', 3);

      expect(result).toEqual(cachedImages);
      expect(cacheService.get).toHaveBeenCalledWith('breed-images:labrador:count:3');
      expect(dogCeoApiService.getBreedImages).not.toHaveBeenCalled();
    });

    it('should fetch images from API when cache is empty', async () => {
      const mockImages = [
        'https://images.dog.ceo/breeds/bulldog/1.jpg',
        'https://images.dog.ceo/breeds/bulldog/2.jpg',
        'https://images.dog.ceo/breeds/bulldog/3.jpg',
      ];

      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockResolvedValue(mockImages);

      const result = await service.getBreedImages('bulldog', 3);

      expect(result).toEqual({
        breed: 'bulldog',
        images: mockImages,
      });
      expect(dogCeoApiService.getBreedImages).toHaveBeenCalledWith('bulldog', 3);
    });

    it('should cache the fetched images', async () => {
      const mockImages = [
        'https://images.dog.ceo/breeds/poodle/1.jpg',
        'https://images.dog.ceo/breeds/poodle/2.jpg',
      ];

      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockResolvedValue(mockImages);

      await service.getBreedImages('poodle', 2);

      expect(cacheService.set).toHaveBeenCalledWith(
        'breed-images:poodle:count:2',
        {
          breed: 'poodle',
          images: mockImages,
        },
        60
      );
    });

    it('should use default count of 3', async () => {
      const mockImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockResolvedValue(mockImages);

      await service.getBreedImages('labrador');

      expect(dogCeoApiService.getBreedImages).toHaveBeenCalledWith('labrador', 3);
    });

    it('should handle different image counts', async () => {
      const counts = [1, 5, 10];

      for (const count of counts) {
        mockCacheService.get.mockReturnValue(null);
        mockDogCeoApiService.getBreedImages.mockResolvedValue(
          Array.from({ length: count }, (_, i) => `img${i}.jpg`)
        );

        const result = await service.getBreedImages('husky', count);

        expect(result.images).toHaveLength(count);
        expect(dogCeoApiService.getBreedImages).toHaveBeenCalledWith('husky', count);
      }
    });

    it('should create unique cache keys for different breeds and counts', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockResolvedValue(['img.jpg']);

      await service.getBreedImages('labrador', 3);
      await service.getBreedImages('labrador', 5);
      await service.getBreedImages('bulldog', 3);

      expect(cacheService.get).toHaveBeenCalledWith('breed-images:labrador:count:3');
      expect(cacheService.get).toHaveBeenCalledWith('breed-images:labrador:count:5');
      expect(cacheService.get).toHaveBeenCalledWith('breed-images:bulldog:count:3');
    });

    it('should propagate errors from DogCeoApiService', async () => {
      const error = new Error('API error');
      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockRejectedValue(error);

      await expect(service.getBreedImages('invalid', 3)).rejects.toThrow('API error');
    });

    it('should handle empty image arrays', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockResolvedValue([]);

      const result = await service.getBreedImages('rare-breed', 3);

      expect(result).toEqual({
        breed: 'rare-breed',
        images: [],
      });
    });

    it('should use TTL from environment configuration', async () => {
      mockConfigService.get.mockReturnValue('120');
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ImagesService,
          { provide: CacheService, useValue: mockCacheService },
          { provide: DogCeoApiService, useValue: mockDogCeoApiService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const customService = module.get<ImagesService>(ImagesService);

      mockCacheService.get.mockReturnValue(null);
      mockDogCeoApiService.getBreedImages.mockResolvedValue(['img.jpg']);

      await customService.getBreedImages('test', 3);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        120
      );
    });
  });
});