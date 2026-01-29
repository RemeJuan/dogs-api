import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
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
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30,
    };

    it('should return login response with tokens', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login without expiresInMins', async () => {
      const loginWithoutExpiry = {
        username: 'emilys',
        password: 'emilyspass',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(loginWithoutExpiry);

      expect(service.login).toHaveBeenCalledWith(loginWithoutExpiry);
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getCurrentUser', () => {
    const validAuthHeader = 'Bearer test-access-token';

    it('should return current user with valid authorization header', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      const result = await controller.getCurrentUser(validAuthHeader);

      expect(result).toEqual(mockUserData);
      expect(service.getCurrentUser).toHaveBeenCalledWith('test-access-token');
    });

    it('should throw UnauthorizedException for missing authorization header', async () => {
      await expect(controller.getCurrentUser(undefined as any)).rejects.toThrow(UnauthorizedException);
      await expect(controller.getCurrentUser(undefined as any)).rejects.toThrow('Missing or invalid authorization header');
      expect(service.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for empty authorization header', async () => {
      await expect(controller.getCurrentUser('')).rejects.toThrow(UnauthorizedException);
      expect(service.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-Bearer token', async () => {
      await expect(controller.getCurrentUser('Basic sometoken')).rejects.toThrow(UnauthorizedException);
      await expect(controller.getCurrentUser('sometoken')).rejects.toThrow(UnauthorizedException);
      expect(service.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should extract token correctly from Bearer header', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      await controller.getCurrentUser('Bearer my-long-token-string');

      expect(service.getCurrentUser).toHaveBeenCalledWith('my-long-token-string');
    });

    it('should handle bearer with different cases', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      await controller.getCurrentUser('Bearer token123');

      expect(service.getCurrentUser).toHaveBeenCalledWith('token123');
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Invalid token');
      mockAuthService.getCurrentUser.mockRejectedValue(error);

      await expect(controller.getCurrentUser(validAuthHeader)).rejects.toThrow('Invalid token');
    });
  });

  describe('refreshToken', () => {
    const refreshDto = {
      refreshToken: 'old-refresh-token',
      expiresInMins: 30,
    };

    const mockRefreshResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should refresh token successfully', async () => {
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refreshToken(refreshDto);

      expect(result).toEqual(mockRefreshResponse);
      expect(service.refreshToken).toHaveBeenCalledWith(refreshDto);
    });

    it('should handle refresh with empty body (cookie-based)', async () => {
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      await controller.refreshToken({});

      expect(service.refreshToken).toHaveBeenCalledWith({});
    });

    it('should handle refresh without expiresInMins', async () => {
      const refreshWithoutExpiry = {
        refreshToken: 'old-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      await controller.refreshToken(refreshWithoutExpiry);

      expect(service.refreshToken).toHaveBeenCalledWith(refreshWithoutExpiry);
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Invalid refresh token');
      mockAuthService.refreshToken.mockRejectedValue(error);

      await expect(controller.refreshToken(refreshDto)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full auth flow: login -> get user -> refresh', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      const loginResult = await controller.login({
        username: 'emilys',
        password: 'emilyspass',
      });
      expect(loginResult.accessToken).toBeDefined();

      mockAuthService.getCurrentUser.mockResolvedValue(mockUserData);
      const userResult = await controller.getCurrentUser(`Bearer ${loginResult.accessToken}`);
      expect(userResult.id).toBe(1);

      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });
      const refreshResult = await controller.refreshToken({
        refreshToken: loginResult.refreshToken,
      });
      expect(refreshResult.accessToken).toBe('new-token');
    });
  });
});