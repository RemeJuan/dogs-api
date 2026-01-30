import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { AuthRepository } from '../services/auth.repository';
import { DummyJsonAuthService } from '@api/modules/http-dummy-json/services/dummy-json-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let repository: AuthRepository;
  let dummyJsonAuthService: DummyJsonAuthService;

  const mockRepository = {
    saveSession: jest.fn(),
    getSession: jest.fn(),
    getSessionByRefreshToken: jest.fn(),
    updateSessionTokens: jest.fn(),
    deleteSession: jest.fn(),
    sessionExists: jest.fn(),
  };

  const mockDummyJsonAuthService = {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
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
        { provide: AuthRepository, useValue: mockRepository },
        { provide: DummyJsonAuthService, useValue: mockDummyJsonAuthService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<AuthRepository>(AuthRepository);
    dummyJsonAuthService =
      module.get<DummyJsonAuthService>(DummyJsonAuthService);
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

    it('should login successfully and save session', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await service.login(loginRequest);

      expect(result).toEqual(mockLoginResponse);
      expect(dummyJsonAuthService.login).toHaveBeenCalledWith(loginRequest);
      expect(repository.saveSession).toHaveBeenCalledWith(
        'test-access-token',
        'test-refresh-token',
        mockUserData,
        30,
      );
    });

    it('should use default TTL when not specified', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      await service.login({ username: 'test', password: 'test' });

      expect(repository.saveSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        59, // Default TTL
      );
    });

    it('should extract only user data for storage', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      await service.login(loginRequest);

      const savedUserData = mockRepository.saveSession.mock.calls[0][2];
      expect(savedUserData).not.toHaveProperty('accessToken');
      expect(savedUserData).not.toHaveProperty('refreshToken');
      expect(savedUserData).toMatchObject(mockUserData);
    });

    it('should propagate errors from DummyJsonAuthService', async () => {
      const error = new Error('Login failed');
      mockDummyJsonAuthService.login.mockRejectedValue(error);

      await expect(service.login(loginRequest)).rejects.toThrow('Login failed');
      expect(repository.saveSession).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    const accessToken = 'test-access-token';

    it('should return session from repository if available', async () => {
      mockRepository.getSession.mockReturnValue(mockUserData);

      const result = await service.getCurrentUser(accessToken);

      expect(result).toEqual(mockUserData);
      expect(repository.getSession).toHaveBeenCalledWith(accessToken);
      expect(dummyJsonAuthService.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when session not found', async () => {
      mockRepository.getSession.mockReturnValue(null);

      await expect(service.getCurrentUser(accessToken)).rejects.toThrow(
        'Session not found or expired. Please log in again.',
      );
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

    const mockOldSession = {
      userId: 1,
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
      userData: JSON.stringify(mockUserData),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    it('should refresh token successfully and update session', async () => {
      mockRepository.getSessionByRefreshToken.mockReturnValue(mockOldSession);
      mockDummyJsonAuthService.refreshToken.mockResolvedValue(
        mockRefreshResponse,
      );

      const result = await service.refreshToken(refreshRequest);

      expect(result).toEqual(mockRefreshResponse);
      expect(dummyJsonAuthService.refreshToken).toHaveBeenCalledWith(
        refreshRequest,
      );
      expect(repository.updateSessionTokens).toHaveBeenCalledWith(
        1,
        'new-access-token',
        'new-refresh-token',
        30,
      );
    });

    it('should throw UnauthorizedException when session not found', async () => {
      mockRepository.getSessionByRefreshToken.mockReturnValue(null);

      await expect(service.refreshToken(refreshRequest)).rejects.toThrow(
        'Invalid or expired refresh token. Please log in again.',
      );
      expect(dummyJsonAuthService.refreshToken).not.toHaveBeenCalled();
      expect(repository.updateSessionTokens).not.toHaveBeenCalled();
    });

    it('should handle refresh without refresh token in request', async () => {
      mockRepository.getSessionByRefreshToken.mockReturnValue(null);

      await expect(service.refreshToken({})).rejects.toThrow(
        'Invalid or expired refresh token. Please log in again.',
      );
    });

    it('should use default TTL when not specified', async () => {
      mockRepository.getSessionByRefreshToken.mockReturnValue(mockOldSession);
      mockDummyJsonAuthService.refreshToken.mockResolvedValue(
        mockRefreshResponse,
      );

      await service.refreshToken({ refreshToken: 'old-token' });

      expect(repository.updateSessionTokens).toHaveBeenCalledWith(
        1,
        expect.any(String),
        expect.any(String),
        59,
      );
    });
  });
});
