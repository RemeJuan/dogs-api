import { Test, TestingModule } from '@nestjs/testing';
import { FavouritesRepository } from '../services/favourites.repository';
import { DatabaseService } from '@api/modules/database/services/database.service';
import { ConfigService } from '@nestjs/config';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('FavouritesRepository', () => {
  let repository: FavouritesRepository;
  let databaseService: DatabaseService;
  const testDbPath = join(process.cwd(), 'data', 'test-favourites.db');

  const mockConfigService = {
    get: jest.fn().mockReturnValue(testDbPath),
  };

  const mockFavourite = {
    id: 'test-id-123',
    breed: 'labrador',
    imageUrl: 'https://images.dog.ceo/breeds/labrador/1.jpg',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavouritesRepository,
        DatabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<FavouritesRepository>(FavouritesRepository);

    databaseService.onModuleInit();
    repository.onModuleInit();
  });

  afterEach(() => {
    databaseService.onModuleDestroy();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('table initialization', () => {
    it('should create favourites table on init', () => {
      const stmt = databaseService.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='favourites'",
      );
      const result = stmt.get();

      expect(result).toBeDefined();
    });
  });

  describe('create and findAll', () => {
    it('should create and retrieve a favourite', () => {
      repository.create(mockFavourite);

      const favourites = repository.findAll();

      expect(favourites).toHaveLength(1);
      expect(favourites[0]).toMatchObject({
        id: mockFavourite.id,
        breed: mockFavourite.breed,
        imageUrl: mockFavourite.imageUrl,
      });
    });

    it('should return empty array when no favourites exist', () => {
      const favourites = repository.findAll();

      expect(favourites).toEqual([]);
      expect(favourites).toHaveLength(0);
    });

    it('should store multiple favourites', () => {
      const favourite1 = { ...mockFavourite, id: 'id-1', breed: 'labrador' };
      const favourite2 = { ...mockFavourite, id: 'id-2', breed: 'bulldog' };
      const favourite3 = { ...mockFavourite, id: 'id-3', breed: 'poodle' };

      repository.create(favourite1);
      repository.create(favourite2);
      repository.create(favourite3);

      const favourites = repository.findAll();
      expect(favourites).toHaveLength(3);
    });

    it('should return favourites in descending order by createdAt', () => {
      const fav1 = {
        ...mockFavourite,
        id: 'id-1',
        createdAt: new Date('2024-01-01'),
      };
      const fav2 = {
        ...mockFavourite,
        id: 'id-2',
        createdAt: new Date('2024-01-02'),
      };
      const fav3 = {
        ...mockFavourite,
        id: 'id-3',
        createdAt: new Date('2024-01-03'),
      };

      repository.create(fav1);
      repository.create(fav2);
      repository.create(fav3);

      const favourites = repository.findAll();

      expect(favourites[0].id).toBe('id-3'); // Most recent first
      expect(favourites[1].id).toBe('id-2');
      expect(favourites[2].id).toBe('id-1');
    });

    it('should handle breeds with hyphens and special characters', () => {
      const breeds = ['german-shepherd', 'saint-bernard', 'cocker-spaniel'];

      breeds.forEach((breed, i) => {
        repository.create({
          ...mockFavourite,
          id: `id-${i}`,
          breed,
        });
      });

      const favourites = repository.findAll();
      expect(favourites).toHaveLength(3);
      expect(favourites.map((f) => f.breed)).toEqual(
        expect.arrayContaining(breeds),
      );
    });

    it('should correctly parse Date objects', () => {
      repository.create(mockFavourite);

      const favourites = repository.findAll();
      expect(favourites[0].createdAt).toBeInstanceOf(Date);
      expect(favourites[0].createdAt.toISOString()).toBe(
        '2024-01-01T00:00:00.000Z',
      );
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      repository.create({ ...mockFavourite, id: 'to-delete' });
      repository.create({ ...mockFavourite, id: 'to-keep' });
    });

    it('should delete a favourite by id', () => {
      repository.delete('to-delete');

      const favourites = repository.findAll();
      expect(favourites).toHaveLength(1);
      expect(favourites[0].id).toBe('to-keep');
    });

    it('should not throw error when deleting non-existent favourite', () => {
      expect(() => repository.delete('non-existent')).not.toThrow();
    });

    it('should handle multiple deletions', () => {
      repository.create({ ...mockFavourite, id: 'id-1' });
      repository.create({ ...mockFavourite, id: 'id-2' });

      repository.delete('to-delete');
      repository.delete('id-1');

      const favourites = repository.findAll();
      expect(favourites).toHaveLength(2); // to-keep and id-2
    });
  });

  describe('exists', () => {
    it('should return true for existing favourite', () => {
      repository.create(mockFavourite);

      expect(repository.exists(mockFavourite.id)).toBe(true);
    });

    it('should return false for non-existent favourite', () => {
      expect(repository.exists('non-existent-id')).toBe(false);
    });

    it('should return false after deletion', () => {
      repository.create(mockFavourite);
      expect(repository.exists(mockFavourite.id)).toBe(true);

      repository.delete(mockFavourite.id);
      expect(repository.exists(mockFavourite.id)).toBe(false);
    });
  });

  describe('deleteAll', () => {
    it('should delete all favourites', () => {
      repository.create({ ...mockFavourite, id: 'id-1' });
      repository.create({ ...mockFavourite, id: 'id-2' });
      repository.create({ ...mockFavourite, id: 'id-3' });

      expect(repository.findAll()).toHaveLength(3);

      repository.deleteAll();

      expect(repository.findAll()).toHaveLength(0);
    });

    it('should not throw error on empty table', () => {
      expect(() => repository.deleteAll()).not.toThrow();
    });

    it('should allow adding new favourites after clear', () => {
      repository.create(mockFavourite);
      repository.deleteAll();
      repository.create({ ...mockFavourite, id: 'new-id' });

      expect(repository.findAll()).toHaveLength(1);
    });
  });

  describe('data integrity', () => {
    it('should handle URLs with query parameters', () => {
      const favouriteWithQuery = {
        ...mockFavourite,
        imageUrl:
          'https://images.dog.ceo/breeds/labrador/1.jpg?size=large&format=png',
      };

      repository.create(favouriteWithQuery);

      const favourites = repository.findAll();
      expect(favourites[0].imageUrl).toBe(favouriteWithQuery.imageUrl);
    });

    it('should handle breed names with apostrophes', () => {
      const favouriteWithApostrophe = {
        ...mockFavourite,
        breed: "cocker-spaniel's-mix",
      };

      expect(() => repository.create(favouriteWithApostrophe)).not.toThrow();

      const favourites = repository.findAll();
      expect(favourites[0].breed).toBe("cocker-spaniel's-mix");
    });

    it('should maintain UUID format for IDs', () => {
      const uuidFormat =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const favouriteWithUUID = {
        ...mockFavourite,
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      repository.create(favouriteWithUUID);

      const favourites = repository.findAll();
      expect(favourites[0].id).toMatch(uuidFormat);
    });
  });

  describe('large datasets', () => {
    it('should handle 100 favourites efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        repository.create({
          ...mockFavourite,
          id: `id-${i}`,
          breed: `breed-${i}`,
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      const favourites = repository.findAll();
      expect(favourites).toHaveLength(100);
    });
  });
});
