import { Test, TestingModule } from '@nestjs/testing';
import { ImagesController } from '../controllers/images.controller';
import { ImagesService } from '../services/images.service';

describe('ImagesController', () => {
  let controller: ImagesController;
  let service: ImagesService;

  const mockImagesService = {
    getBreedImages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        { provide: ImagesService, useValue: mockImagesService },
      ],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
    service = module.get<ImagesService>(ImagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBreedImages', () => {
    it('should return breed images with default count', async () => {
      const expectedResult = {
        breed: 'labrador',
        images: [
          'https://images.dog.ceo/breeds/labrador/1.jpg',
          'https://images.dog.ceo/breeds/labrador/2.jpg',
          'https://images.dog.ceo/breeds/labrador/3.jpg',
        ],
      };

      mockImagesService.getBreedImages.mockResolvedValue(expectedResult);

      const result = await controller.getBreedImages('labrador');

      expect(result).toEqual(expectedResult);
      expect(service.getBreedImages).toHaveBeenCalledWith('labrador', 3);
    });

    it('should return breed images with custom count', async () => {
      const expectedResult = {
        breed: 'bulldog',
        images: [
          'https://images.dog.ceo/breeds/bulldog/1.jpg',
          'https://images.dog.ceo/breeds/bulldog/2.jpg',
          'https://images.dog.ceo/breeds/bulldog/3.jpg',
          'https://images.dog.ceo/breeds/bulldog/4.jpg',
          'https://images.dog.ceo/breeds/bulldog/5.jpg',
        ],
      };

      mockImagesService.getBreedImages.mockResolvedValue(expectedResult);

      const result = await controller.getBreedImages('bulldog', 5);

      expect(result).toEqual(expectedResult);
      expect(service.getBreedImages).toHaveBeenCalledWith('bulldog', 5);
    });

    it('should handle single image request', async () => {
      const expectedResult = {
        breed: 'poodle',
        images: ['https://images.dog.ceo/breeds/poodle/1.jpg'],
      };

      mockImagesService.getBreedImages.mockResolvedValue(expectedResult);

      const result = await controller.getBreedImages('poodle', 1);

      expect(result).toEqual(expectedResult);
      expect(result.images).toHaveLength(1);
    });

    it('should handle empty image array', async () => {
      const expectedResult = {
        breed: 'rare-breed',
        images: [],
      };

      mockImagesService.getBreedImages.mockResolvedValue(expectedResult);

      const result = await controller.getBreedImages('rare-breed', 3);

      expect(result).toEqual(expectedResult);
      expect(result.images).toHaveLength(0);
    });

    it('should handle breeds with hyphens and special characters', async () => {
      const breeds = ['german-shepherd', 'saint-bernard', 'cocker-spaniel'];

      for (const breed of breeds) {
        const expectedResult = {
          breed,
          images: [`https://images.dog.ceo/breeds/${breed}/1.jpg`],
        };

        mockImagesService.getBreedImages.mockResolvedValue(expectedResult);

        const result = await controller.getBreedImages(breed, 1);

        expect(result.breed).toBe(breed);
        expect(service.getBreedImages).toHaveBeenCalledWith(breed, 1);
      }
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Failed to fetch images');
      mockImagesService.getBreedImages.mockRejectedValue(error);

      await expect(controller.getBreedImages('invalid', 3)).rejects.toThrow('Failed to fetch images');
    });

    it('should handle large image counts', async () => {
      const largeCount = 50;
      const mockImages = Array.from({ length: largeCount }, (_, i) => 
        `https://images.dog.ceo/breeds/husky/${i + 1}.jpg`
      );

      const expectedResult = {
        breed: 'husky',
        images: mockImages,
      };

      mockImagesService.getBreedImages.mockResolvedValue(expectedResult);

      const result = await controller.getBreedImages('husky', largeCount);

      expect(result.images).toHaveLength(largeCount);
      expect(service.getBreedImages).toHaveBeenCalledWith('husky', largeCount);
    });

    it('should handle concurrent requests for different breeds', async () => {
      const breeds = ['labrador', 'bulldog', 'poodle'];
      const promises = breeds.map(breed => {
        const expectedResult = {
          breed,
          images: [`https://images.dog.ceo/breeds/${breed}/1.jpg`],
        };
        mockImagesService.getBreedImages.mockResolvedValue(expectedResult);
        return controller.getBreedImages(breed, 1);
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.breed).toBe(breeds[index]);
      });
    });
  });
});