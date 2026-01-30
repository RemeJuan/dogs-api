import { Test, TestingModule } from '@nestjs/testing';
import { FavouritesService } from '../services/favourites.service';
import { FavouritesRepository } from '../services/favourites.repository';

let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mocked-uuid-${++uuidCounter}`),
}));

describe('FavouritesService', () => {
  let service: FavouritesService;
  let repository: FavouritesRepository;

  const mockRepository = {
    findAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    deleteAll: jest.fn(),
  };

  const mockFavourite = {
    id: 'test-id-123',
    breed: 'labrador',
    imageUrl: 'https://images.dog.ceo/breeds/labrador/1.jpg',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavouritesService,
        { provide: FavouritesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<FavouritesService>(FavouritesService);
    repository = module.get<FavouritesRepository>(FavouritesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllFavourites', () => {
    it('should return all favourites from repository', () => {
      const mockFavourites = [
        mockFavourite,
        {
          id: 'test-id-456',
          breed: 'bulldog',
          imageUrl: 'https://images.dog.ceo/breeds/bulldog/1.jpg',
          createdAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ];

      mockRepository.findAll.mockReturnValue(mockFavourites);

      const result = service.getAllFavourites();

      expect(result.favourites).toEqual(mockFavourites);
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no favourites exist', () => {
      mockRepository.findAll.mockReturnValue([]);

      const result = service.getAllFavourites();

      expect(result.favourites).toEqual([]);
      expect(result.favourites).toHaveLength(0);
    });

    it('should handle large number of favourites', () => {
      const largeFavouritesList = Array.from({ length: 100 }, (_, i) => ({
        id: `id-${i}`,
        breed: `breed-${i}`,
        imageUrl: `https://example.com/${i}.jpg`,
        createdAt: new Date(),
      }));

      mockRepository.findAll.mockReturnValue(largeFavouritesList);

      const result = service.getAllFavourites();

      expect(result.favourites).toHaveLength(100);
    });
  });

  describe('addFavourite', () => {
    const addRequest = {
      breed: 'poodle',
      imageUrl: 'https://images.dog.ceo/breeds/poodle/1.jpg',
    };

    it('should create a new favourite', () => {
      const result = service.addFavourite(addRequest);

      expect(result.favourite).toBeDefined();
      expect(result.favourite.id).toBeDefined();
      expect(result.favourite.breed).toBe(addRequest.breed);
      expect(result.favourite.imageUrl).toBe(addRequest.imageUrl);
      expect(result.favourite.createdAt).toBeInstanceOf(Date);
    });

    it('should call repository.create with correct data', () => {
      service.addFavourite(addRequest);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          breed: addRequest.breed,
          imageUrl: addRequest.imageUrl,
          createdAt: expect.any(Date),
        }),
      );
    });

    it('should generate unique IDs for multiple favourites', () => {
      const result1 = service.addFavourite(addRequest);
      const result2 = service.addFavourite(addRequest);
      const result3 = service.addFavourite(addRequest);

      expect(result1.favourite.id).not.toBe(result2.favourite.id);
      expect(result2.favourite.id).not.toBe(result3.favourite.id);
      expect(result1.favourite.id).not.toBe(result3.favourite.id);
    });

    it('should handle different breeds', () => {
      const breeds = ['labrador', 'bulldog', 'poodle', 'german-shepherd'];

      breeds.forEach((breed) => {
        const result = service.addFavourite({
          breed,
          imageUrl: `https://example.com/${breed}.jpg`,
        });

        expect(result.favourite.breed).toBe(breed);
      });

      expect(repository.create).toHaveBeenCalledTimes(4);
    });
  });

  describe('deleteFavourite', () => {
    it('should delete favourite by id', () => {
      const id = 'test-id-123';

      service.deleteFavourite(id);

      expect(repository.delete).toHaveBeenCalledWith(id);
    });

    it('should handle deletion of non-existent favourite', () => {
      expect(() => service.deleteFavourite('non-existent-id')).not.toThrow();
      expect(repository.delete).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle multiple deletions', () => {
      const ids = ['id-1', 'id-2', 'id-3'];

      ids.forEach((id) => service.deleteFavourite(id));

      expect(repository.delete).toHaveBeenCalledTimes(3);
      ids.forEach((id) => {
        expect(repository.delete).toHaveBeenCalledWith(id);
      });
    });
  });
});
