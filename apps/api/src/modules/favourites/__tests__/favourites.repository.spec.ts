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

  const testUserId = 1;
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

  describe('create and findAllByUser', () => {
    it('should create and retrieve a favourite for a user', () => {
      repository.create(testUserId, mockFavourite);

      const favourites = repository.findAllByUser(testUserId);

      expect(favourites).toHaveLength(1);
      expect(favourites[0]).toMatchObject({
        id: mockFavourite.id,
        breed: mockFavourite.breed,
        imageUrl: mockFavourite.imageUrl,
      });
    });

    it('should return empty array when no favourites exist for user', () => {
      const favourites = repository.findAllByUser(testUserId);

      expect(favourites).toEqual([]);
      expect(favourites).toHaveLength(0);
    });

    it('should store multiple favourites for a user', () => {
      const favourite1 = { ...mockFavourite, id: 'id-1', breed: 'labrador' };
      const favourite2 = { ...mockFavourite, id: 'id-2', breed: 'bulldog' };
      const favourite3 = { ...mockFavourite, id: 'id-3', breed: 'poodle' };

      repository.create(testUserId, favourite1);
      repository.create(testUserId, favourite2);
      repository.create(testUserId, favourite3);

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites).toHaveLength(3);
    });

    it('should isolate favourites by userId', () => {
      const user1Id = 1;
      const user2Id = 2;

      repository.create(user1Id, { ...mockFavourite, id: 'user1-fav' });
      repository.create(user2Id, { ...mockFavourite, id: 'user2-fav' });

      const user1Favourites = repository.findAllByUser(user1Id);
      const user2Favourites = repository.findAllByUser(user2Id);

      expect(user1Favourites).toHaveLength(1);
      expect(user2Favourites).toHaveLength(1);
      expect(user1Favourites[0].id).toBe('user1-fav');
      expect(user2Favourites[0].id).toBe('user2-fav');
    });

    it('should return favourites in descending order by createdAt', () => {
      const fav1 = {
        ...mockFavourite,
        id: 'id-1',
        imageUrl: 'https://example.com/1.jpg',
        createdAt: new Date('2024-01-01'),
      };
      const fav2 = {
        ...mockFavourite,
        id: 'id-2',
        imageUrl: 'https://example.com/2.jpg',
        createdAt: new Date('2024-01-02'),
      };
      const fav3 = {
        ...mockFavourite,
        id: 'id-3',
        imageUrl: 'https://example.com/3.jpg',
        createdAt: new Date('2024-01-03'),
      };

      repository.create(testUserId, fav1);
      repository.create(testUserId, fav2);
      repository.create(testUserId, fav3);

      const favourites = repository.findAllByUser(testUserId);

      expect(favourites[0].id).toBe('id-3'); // Most recent first
      expect(favourites[1].id).toBe('id-2');
      expect(favourites[2].id).toBe('id-1');
    });

    it('should handle breeds with hyphens and special characters', () => {
      const breeds = ['german-shepherd', 'saint-bernard', 'cocker-spaniel'];

      breeds.forEach((breed, i) => {
        repository.create(testUserId, {
          ...mockFavourite,
          id: `id-${i}`,
          breed,
        });
      });

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites).toHaveLength(3);
      expect(favourites.map((f) => f.breed)).toEqual(
        expect.arrayContaining(breeds),
      );
    });

    it('should correctly parse Date objects', () => {
      repository.create(testUserId, mockFavourite);

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites[0].createdAt).toBeInstanceOf(Date);
      expect(favourites[0].createdAt.toISOString()).toBe(
        '2024-01-01T00:00:00.000Z',
      );
    });

    it('should prevent duplicate breed+image combinations per user', () => {
      repository.create(testUserId, mockFavourite);

      // Attempting to insert duplicate should throw due to UNIQUE constraint
      expect(() => repository.create(testUserId, mockFavourite)).toThrow();
    });

    it('should allow same breed+image for different users', () => {
      repository.create(1, mockFavourite);

      // Same breed+image but different id for different user
      expect(() =>
        repository.create(2, { ...mockFavourite, id: 'user2-id' }),
      ).not.toThrow();

      expect(repository.findAllByUser(1)).toHaveLength(1);
      expect(repository.findAllByUser(2)).toHaveLength(1);
    });
  });

  describe('deleteByUserAndId', () => {
    beforeEach(() => {
      repository.create(testUserId, { ...mockFavourite, id: 'to-delete' });
      repository.create(testUserId, {
        ...mockFavourite,
        id: 'to-keep',
        imageUrl: 'https://example.com/keep.jpg',
      });
    });

    it('should delete a favourite by userId and id', () => {
      const result = repository.deleteByUserAndId(testUserId, 'to-delete');

      expect(result).toBe(true);
      const favourites = repository.findAllByUser(testUserId);
      expect(favourites).toHaveLength(1);
      expect(favourites[0].id).toBe('to-keep');
    });

    it('should return false when deleting non-existent favourite', () => {
      const result = repository.deleteByUserAndId(testUserId, 'non-existent');
      expect(result).toBe(false);
    });

    it("should not delete another user's favourite", () => {
      const user2Id = 2;
      repository.create(user2Id, { ...mockFavourite, id: 'user2-fav' });

      const result = repository.deleteByUserAndId(testUserId, 'user2-fav');

      expect(result).toBe(false);
      expect(repository.findAllByUser(user2Id)).toHaveLength(1);
    });

    it('should handle multiple deletions', () => {
      repository.create(testUserId, {
        ...mockFavourite,
        id: 'id-1',
        imageUrl: 'https://example.com/1.jpg',
      });
      repository.create(testUserId, {
        ...mockFavourite,
        id: 'id-2',
        imageUrl: 'https://example.com/2.jpg',
      });

      repository.deleteByUserAndId(testUserId, 'to-delete');
      repository.deleteByUserAndId(testUserId, 'id-1');

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites).toHaveLength(2); // to-keep and id-2
    });
  });

  describe('existsByUserAndId', () => {
    it('should return true for existing favourite', () => {
      repository.create(testUserId, mockFavourite);

      expect(repository.existsByUserAndId(testUserId, mockFavourite.id)).toBe(
        true,
      );
    });

    it('should return false for non-existent favourite', () => {
      expect(repository.existsByUserAndId(testUserId, 'non-existent-id')).toBe(
        false,
      );
    });

    it("should return false for another user's favourite", () => {
      repository.create(testUserId, mockFavourite);

      expect(repository.existsByUserAndId(2, mockFavourite.id)).toBe(false);
    });

    it('should return false after deletion', () => {
      repository.create(testUserId, mockFavourite);
      expect(repository.existsByUserAndId(testUserId, mockFavourite.id)).toBe(
        true,
      );

      repository.deleteByUserAndId(testUserId, mockFavourite.id);
      expect(repository.existsByUserAndId(testUserId, mockFavourite.id)).toBe(
        false,
      );
    });
  });

  describe('existsByUserBreedAndImage', () => {
    it('should return true for existing breed+image combination', () => {
      repository.create(testUserId, mockFavourite);

      expect(
        repository.existsByUserBreedAndImage(
          testUserId,
          mockFavourite.breed,
          mockFavourite.imageUrl,
        ),
      ).toBe(true);
    });

    it('should return false for non-existent combination', () => {
      expect(
        repository.existsByUserBreedAndImage(
          testUserId,
          'poodle',
          'https://example.com/poodle.jpg',
        ),
      ).toBe(false);
    });

    it('should return false for another user with same breed+image', () => {
      repository.create(testUserId, mockFavourite);

      expect(
        repository.existsByUserBreedAndImage(
          2,
          mockFavourite.breed,
          mockFavourite.imageUrl,
        ),
      ).toBe(false);
    });
  });

  describe('deleteAll', () => {
    it('should delete all favourites', () => {
      repository.create(testUserId, { ...mockFavourite, id: 'id-1' });
      repository.create(testUserId, {
        ...mockFavourite,
        id: 'id-2',
        imageUrl: 'https://example.com/2.jpg',
      });
      repository.create(2, {
        ...mockFavourite,
        id: 'id-3',
        imageUrl: 'https://example.com/3.jpg',
      });

      expect(repository.findAllByUser(testUserId)).toHaveLength(2);
      expect(repository.findAllByUser(2)).toHaveLength(1);

      repository.deleteAll();

      expect(repository.findAllByUser(testUserId)).toHaveLength(0);
      expect(repository.findAllByUser(2)).toHaveLength(0);
    });

    it('should not throw error on empty table', () => {
      expect(() => repository.deleteAll()).not.toThrow();
    });

    it('should allow adding new favourites after clear', () => {
      repository.create(testUserId, mockFavourite);
      repository.deleteAll();
      repository.create(testUserId, { ...mockFavourite, id: 'new-id' });

      expect(repository.findAllByUser(testUserId)).toHaveLength(1);
    });
  });

  describe('data integrity', () => {
    it('should handle URLs with query parameters', () => {
      const favouriteWithQuery = {
        ...mockFavourite,
        imageUrl:
          'https://images.dog.ceo/breeds/labrador/1.jpg?size=large&format=png',
      };

      repository.create(testUserId, favouriteWithQuery);

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites[0].imageUrl).toBe(favouriteWithQuery.imageUrl);
    });

    it('should handle breed names with apostrophes', () => {
      const favouriteWithApostrophe = {
        ...mockFavourite,
        breed: "cocker-spaniel's-mix",
      };

      expect(() =>
        repository.create(testUserId, favouriteWithApostrophe),
      ).not.toThrow();

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites[0].breed).toBe("cocker-spaniel's-mix");
    });

    it('should maintain UUID format for IDs', () => {
      const uuidFormat =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const favouriteWithUUID = {
        ...mockFavourite,
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      repository.create(testUserId, favouriteWithUUID);

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites[0].id).toMatch(uuidFormat);
    });
  });

  describe('large datasets', () => {
    it('should handle 100 favourites efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        repository.create(testUserId, {
          ...mockFavourite,
          id: `id-${i}`,
          breed: `breed-${i}`,
          imageUrl: `https://example.com/${i}.jpg`,
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      const favourites = repository.findAllByUser(testUserId);
      expect(favourites).toHaveLength(100);
    });
  });
});
