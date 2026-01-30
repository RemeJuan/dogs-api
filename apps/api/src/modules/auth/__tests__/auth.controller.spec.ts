import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import * as tokenUtils from '../util/token.utils';

jest.spyOn(tokenUtils, 'extractUserIdFromToken');

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let jwtService: JwtService;

  const mockAuthService = {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
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
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
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

    it('should propagate errors from service', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getCurrentUser', () => {
    const validAuthHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    it('should extract userId from token and return user', async () => {
      (tokenUtils.extractUserIdFromToken as jest.Mock).mockReturnValue(1);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUserData);

      const result = await controller.getCurrentUser(validAuthHeader);

      expect(result).toEqual(mockUserData);
      expect(tokenUtils.extractUserIdFromToken).toHaveBeenCalledWith(
        validAuthHeader,
        expect.any(Object),
      );
      expect(service.getCurrentUser).toHaveBeenCalledWith(1);
    });

    it('should throw when token extraction fails', async () => {
      (tokenUtils.extractUserIdFromToken as jest.Mock).mockImplementation(
        () => {
          throw new UnauthorizedException('Invalid token');
        },
      );

      await expect(controller.getCurrentUser(validAuthHeader)).rejects.toThrow(
        'Invalid token',
      );
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

    it('should propagate errors from service', async () => {
      const error = new Error('Invalid refresh token');
      mockAuthService.refreshToken.mockRejectedValue(error);

      await expect(controller.refreshToken(refreshDto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });
});
