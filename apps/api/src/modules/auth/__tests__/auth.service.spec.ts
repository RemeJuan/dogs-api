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

    it('should login successfully and save session', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await service.login(loginRequest);

      expect(result).toEqual(mockLoginResponse);
      expect(dummyJsonAuthService.login).toHaveBeenCalledWith(loginRequest);
      expect(repository.saveSession).toHaveBeenCalledWith(
        'test-access-token',
        'test-refresh-token',
        mockUserData,
        30
      );
    });

    it('should use default TTL when not specified', async () => {
      mockDummyJsonAuthService.login.mockResolvedValue(mockLoginResponse);

      await service.login({ username: 'test', password: 'test' });

      expect(repository.saveSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        59 // Default TTL
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

    it('should fetch user from API when session not found', async () => {
      mockRepository.getSession.mockReturnValue(null);
      mockDummyJsonAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      const result = await service.getCurrentUser(accessToken);

      expect(result).toEqual(mockUserData);
      expect(dummyJsonAuthService.getCurrentUser).toHaveBeenCalledWith(accessToken);
    });

    it('should save fetched user data to repository', async () => {
      mockRepository.getSession.mockReturnValue(null);
      mockDummyJsonAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      await service.getCurrentUser(accessToken);

      expect(repository.saveSession).toHaveBeenCalledWith(
        accessToken,
        '',
        mockUserData,
        59
      );
    });

    it('should propagate errors from DummyJsonAuthService', async () => {
      mockRepository.getSession.mockReturnValue(null);
      const error = new Error('Unauthorized');
      mockDummyJsonAuthService.getCurrentUser.mockRejectedValue(error);

      await expect(service.getCurrentUser(accessToken)).rejects.toThrow('Unauthorized');
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

    it('should not save session after refresh', async () => {
      mockDummyJsonAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      await service.refreshToken(refreshRequest);

      expect(repository.saveSession).not.toHaveBeenCalled();
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
});