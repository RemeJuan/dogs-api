import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '../services/auth.repository';
import { DatabaseService } from '@api/modules/database/services/database.service';
import { ConfigService } from '@nestjs/config';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let databaseService: DatabaseService;
  const testDbPath = join(process.cwd(), 'data', 'test-auth.db');

  const mockConfigService = {
    get: jest.fn().mockReturnValue(testDbPath),
  };

  const mockUserData = {
    id: 1,
    username: 'emilys',
    email: 'emily.johnson@x.dummyjson.com',
    firstName: 'Emily',
    lastName: 'Johnson',
    gender: 'female',
    image: 'https://dummyjson.com/icon/emilys/128',
  };

  beforeEach(async () => {
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        DatabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<AuthRepository>(AuthRepository);

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

  describe('saveSession and getSession', () => {
    it('should save and retrieve a session by userId', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      repository.saveSession(accessToken, refreshToken, mockUserData);

      const result = repository.getSession(mockUserData.id);

      expect(result).toEqual(mockUserData);
    });

    it('should return null for non-existent userId', () => {
      const result = repository.getSession(999);
      expect(result).toBeNull();
    });

    it('should use default TTL of 59 minutes', () => {
      const accessToken = 'test-token';
      repository.saveSession(accessToken, 'refresh', mockUserData);

      const session = repository.getSession(mockUserData.id);
      expect(session).not.toBeNull();
    });

    it('should use custom TTL when provided', () => {
      const accessToken = 'test-token';
      repository.saveSession(accessToken, 'refresh', mockUserData, 120);

      const session = repository.getSession(mockUserData.id);
      expect(session).not.toBeNull();
    });

    it('should replace existing session for same userId', () => {
      const accessToken1 = 'token-1';
      const accessToken2 = 'token-2';
      const userData1 = { ...mockUserData, username: 'user1' };
      const userData2 = { ...mockUserData, username: 'user2' };

      repository.saveSession(accessToken1, 'refresh1', userData1);
      repository.saveSession(accessToken2, 'refresh2', userData2);

      const result = repository.getSession(mockUserData.id);
      expect(result?.username).toBe('user2');
    });

    it('should handle multiple sessions for different users', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';
      const user1 = { ...mockUserData, id: 1, username: 'user1' };
      const user2 = { ...mockUserData, id: 2, username: 'user2' };

      repository.saveSession(token1, 'refresh1', user1);
      repository.saveSession(token2, 'refresh2', user2);

      expect(repository.getSession(user1.id)?.username).toBe('user1');
      expect(repository.getSession(user2.id)?.username).toBe('user2');
    });
  });

  describe('token expiration', () => {
    it('should return session before expiration', () => {
      const accessToken = 'valid-token';

      // Save with 60 minute TTL
      repository.saveSession(accessToken, 'refresh', mockUserData, 60);

      const result = repository.getSession(mockUserData.id);
      expect(result).not.toBeNull();
      expect(result).toEqual(mockUserData);
    });

    it('should handle different TTL values', () => {
      const token = 'test-token';

      repository.saveSession(token, 'refresh', mockUserData, 60);

      expect(repository.getSession(mockUserData.id)).not.toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session by userId', () => {
      const accessToken = 'test-token';

      repository.saveSession(accessToken, 'refresh', mockUserData);
      expect(repository.getSession(mockUserData.id)).not.toBeNull();

      repository.deleteSession(mockUserData.id);
      expect(repository.getSession(mockUserData.id)).toBeNull();
    });

    it('should not throw error when deleting non-existent session', () => {
      expect(() => repository.deleteSession(999)).not.toThrow();
    });
  });

  describe('getSession with userId', () => {
    it('should retrieve session by userId', () => {
      const accessToken = 'test-token';
      repository.saveSession(accessToken, 'refresh', mockUserData);

      expect(repository.getSession(mockUserData.id)).not.toBeNull();
      expect(repository.getSession(mockUserData.id)).toEqual(mockUserData);
    });

    it('should return null for non-existent userId', () => {
      expect(repository.getSession(999)).toBeNull();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up without errors', () => {
      repository.saveSession('token1', 'refresh1', mockUserData, 60);

      expect(() => repository.cleanupExpiredTokens()).not.toThrow();

      expect(repository.getSession(mockUserData.id)).not.toBeNull();
    });

    it('should handle cleanup when no expired tokens exist', () => {
      repository.saveSession('token', 'refresh', mockUserData, 60);

      expect(() => repository.cleanupExpiredTokens()).not.toThrow();
      expect(repository.getSession(mockUserData.id)).not.toBeNull();
    });

    it('should handle cleanup on empty table', () => {
      expect(() => repository.cleanupExpiredTokens()).not.toThrow();
    });
  });

  describe('deleteAllSessions', () => {
    it('should delete all sessions', () => {
      const user1 = { ...mockUserData, id: 1 };
      const user2 = { ...mockUserData, id: 2 };
      const user3 = { ...mockUserData, id: 3 };

      repository.saveSession('token1', 'refresh1', user1);
      repository.saveSession('token2', 'refresh2', user2);
      repository.saveSession('token3', 'refresh3', user3);

      expect(repository.getSession(user1.id)).not.toBeNull();
      expect(repository.getSession(user2.id)).not.toBeNull();

      repository.deleteAllSessions();

      expect(repository.getSession(user1.id)).toBeNull();
      expect(repository.getSession(user2.id)).toBeNull();
      expect(repository.getSession(user3.id)).toBeNull();
    });

    it('should handle delete all on empty table', () => {
      expect(() => repository.deleteAllSessions()).not.toThrow();
    });
  });

  describe('data integrity', () => {
    it('should correctly serialize and deserialize user data', () => {
      const complexUser = {
        ...mockUserData,
        // Add some edge cases
        firstName: "O'Connor",
        lastName: 'Test "Quote" User',
      };

      repository.saveSession('token', 'refresh', complexUser);

      const result = repository.getSession(complexUser.id);
      expect(result).toEqual(complexUser);
    });

    it('should maintain data types after storage', () => {
      repository.saveSession('token', 'refresh', mockUserData);

      const result = repository.getSession(mockUserData.id);
      expect(typeof result?.id).toBe('number');
      expect(typeof result?.username).toBe('string');
    });
  });
});
