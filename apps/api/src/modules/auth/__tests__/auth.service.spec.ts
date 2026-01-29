import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { CacheService } from '@api/modules/cache/services/cache.service';
import { DummyJsonAuthService } from '@api/modules/http-dummy-json/services/dummy-json-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let cacheService: CacheService;
  let dummyJsonAuthService: DummyJsonAuthService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockDummyJsonAuthService = {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('1800'),
  };

  const mockLoginResponse = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    id: 1,
    username: 'emilys',
    email: 'emily.johnson@x.dummyjson.com',
    firstName: 'Emily',
    lastName: 'Johnson',
    gender: 'female',
    image: 'https://dummyjson.com/icon/emilys/128',
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: DummyJsonAuthService, useValue: mockDummyJsonAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    cacheService = module.get<CacheService>(CacheService);
    dummyJsonAuthService = module.get<DummyJsonAuthService>(DummyJsonAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginRequest = {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30,
    };

    it('should login successfully and cache user session', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await service.login(loginRequest);

      expect(result).toEqual(mockLoginResponse);
      expect(dummyJsonAuthService.login).toHaveBeenCalledWith(loginRequest);
      expect(cacheService.set).toHaveBeenCalledWith(
        'auth:session:test-access-token',
        mockUserData,
        1800
      );
    });

    it('should extract and cache only user data, not tokens', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      await service.login(loginRequest);

      const cachedData = mockCacheService.set.mock.calls[0][1];
      expect(cachedData).not.toHaveProperty('accessToken');
      expect(cachedData).not.toHaveProperty('refreshToken');
      expect(cachedData).toMatchObject(mockUserData);
    });

    it('should use configured TTL for session cache', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      await service.login(loginRequest);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        1800
      );
    });

    it('should propagate errors from DummyJsonAuthService', async () => {
      const error = new Error('Login failed');
      mockDummyJsonAuthService.login.mockRejectedValue(error);

      await expect(service.login(loginRequest)).rejects.toThrow('Login failed');
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    const accessToken = 'test-access-token';

    it('should return cached user if available', async () => {
      mockCacheService.get.mockReturnValue(mockUserData);

      const result = await service.getCurrentUser(accessToken);

      expect(result).toEqual(mockUserData);
      expect(cacheService.get).toHaveBeenCalledWith('auth:session:test-access-token');
      expect(dummyJsonAuthService.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should fetch user from API when cache is empty', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDummyJsonAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      const result = await service.getCurrentUser(accessToken);

      expect(result).toEqual(mockUserData);
      expect(dummyJsonAuthService.getCurrentUser).toHaveBeenCalledWith(accessToken);
    });

    it('should cache fetched user data', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDummyJsonAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      await service.getCurrentUser(accessToken);

      expect(cacheService.set).toHaveBeenCalledWith(
        'auth:session:test-access-token',
        mockUserData,
        1800
      );
    });

    it('should use different cache keys for different tokens', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      mockCacheService.get.mockReturnValue(null);
      mockDummyJsonAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      await service.getCurrentUser(token1);
      await service.getCurrentUser(token2);

      expect(cacheService.get).toHaveBeenCalledWith('auth:session:token-1');
      expect(cacheService.get).toHaveBeenCalledWith('auth:session:token-2');
    });

    it('should propagate errors from DummyJsonAuthService', async () => {
      mockCacheService.get.mockReturnValue(null);
      const error = new Error('Unauthorized');
      mockDummyJsonAuthService.getCurrentUser.mockRejectedValue(error);

      await expect(service.getCurrentUser(accessToken)).rejects.toThrow('Unauthorized');
    });

    it('should handle cache hit for multiple requests with same token', async () => {
      mockCacheService.get.mockReturnValue(mockUserData);

      await service.getCurrentUser(accessToken);
      await service.getCurrentUser(accessToken);
      await service.getCurrentUser(accessToken);

      expect(cacheService.get).toHaveBeenCalledTimes(3);
      expect(dummyJsonAuthService.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const refreshRequest = {
      refreshToken: 'old-refresh-token',
      expiresInMins: 30,
    };

    const mockRefreshResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should refresh token successfully', async () => {
      mockDummyJsonAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      const result = await service.refreshToken(refreshRequest);

      expect(result).toEqual(mockRefreshResponse);
      expect(dummyJsonAuthService.refreshToken).toHaveBeenCalledWith(refreshRequest);
    });

    it('should not cache refresh token response', async () => {
      mockDummyJsonAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      await service.refreshToken(refreshRequest);

      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should handle refresh with cookie only', async () => {
      mockDummyJsonAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      await service.refreshToken({});

      expect(dummyJsonAuthService.refreshToken).toHaveBeenCalledWith({});
    });

    it('should propagate errors from DummyJsonAuthService', async () => {
      const error = new Error('Invalid refresh token');
      mockDummyJsonAuthService.refreshToken.mockRejectedValue(error);

      await expect(service.refreshToken(refreshRequest)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('cache TTL configuration', () => {
    it('should use custom TTL from environment', async () => {
      mockConfigService.get.mockReturnValue('3600');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: CacheService, useValue: mockCacheService },
          { provide: DummyJsonAuthService, useValue: mockDummyJsonAuthService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const customService = module.get<AuthService>(AuthService);

      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      await customService.login({ username: 'test', password: 'test' });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        3600
      );
    });
  });
});