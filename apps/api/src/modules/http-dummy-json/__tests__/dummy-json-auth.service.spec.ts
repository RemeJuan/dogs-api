import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DummyJsonAuthService } from '../services/dummy-json-auth.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('DummyJsonAuthService', () => {
  let service: DummyJsonAuthService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://dummyjson.com'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DummyJsonAuthService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DummyJsonAuthService>(DummyJsonAuthService);
    httpService = module.get<HttpService>(HttpService);
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

    const mockLoginResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      id: 1,
      username: 'emilys',
      email: 'emily.johnson@x.dummyjson.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'https://dummyjson.com/icon/emilys/128',
    };

    it('should successfully login with valid credentials', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: mockLoginResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.login(loginRequest);

      expect(result).toEqual(mockLoginResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        'https://dummyjson.com/auth/login',
        loginRequest,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        })
      );
    });

    it('should throw UNAUTHORIZED for invalid credentials', async () => {
      const error = {
        response: { status: 401, data: { message: 'Invalid credentials' } },
        message: 'Request failed with status code 401',
      };

      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.login(loginRequest)).rejects.toThrow(HttpException);
      await expect(service.login(loginRequest)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw SERVICE_UNAVAILABLE for network errors', async () => {
      const error = new Error('Network error');
      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.login(loginRequest)).rejects.toThrow(HttpException);
      await expect(service.login(loginRequest)).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it('should handle login without expiresInMins', async () => {
      const requestWithoutExpiry = {
        username: 'emilys',
        password: 'emilyspass',
      };

      const mockResponse: Partial<AxiosResponse> = {
        data: mockLoginResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.login(requestWithoutExpiry);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://dummyjson.com/auth/login',
        requestWithoutExpiry,
        expect.any(Object)
      );
    });
  });

  describe('getCurrentUser', () => {
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    const mockUserResponse = {
      id: 1,
      username: 'emilys',
      email: 'emily.johnson@x.dummyjson.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'https://dummyjson.com/icon/emilys/128',
    };

    it('should fetch current user with valid token', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: mockUserResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCurrentUser(accessToken);

      expect(result).toEqual(mockUserResponse);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://dummyjson.com/auth/me',
        expect.objectContaining({
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        })
      );
    });

    it('should throw UNAUTHORIZED for invalid token', async () => {
      const error = {
        response: { status: 401, data: { message: 'Invalid token' } },
        message: 'Request failed with status code 401',
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getCurrentUser(accessToken)).rejects.toThrow(HttpException);
      await expect(service.getCurrentUser(accessToken)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw UNAUTHORIZED for expired token', async () => {
      const error = {
        response: { status: 403, data: { message: 'Token expired' } },
        message: 'Request failed with status code 403',
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getCurrentUser(accessToken)).rejects.toThrow(HttpException);
      await expect(service.getCurrentUser(accessToken)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw SERVICE_UNAVAILABLE for API errors', async () => {
      const error = new Error('Service down');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getCurrentUser(accessToken)).rejects.toThrow(HttpException);
      await expect(service.getCurrentUser(accessToken)).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });
  });

  describe('refreshToken', () => {
    const refreshRequest = {
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresInMins: 30,
    };

    const mockRefreshResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should refresh token successfully', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: mockRefreshResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.refreshToken(refreshRequest);

      expect(result).toEqual(mockRefreshResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        'https://dummyjson.com/auth/refresh',
        refreshRequest,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        })
      );
    });

    it('should refresh token using cookies only', async () => {
      const mockResponse: Partial<AxiosResponse> = {
        data: mockRefreshResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.refreshToken({});

      expect(httpService.post).toHaveBeenCalledWith(
        'https://dummyjson.com/auth/refresh',
        {},
        expect.any(Object)
      );
    });

    it('should throw UNAUTHORIZED for invalid refresh token', async () => {
      const error = {
        response: { status: 401, data: { message: 'Invalid refresh token' } },
        message: 'Request failed with status code 401',
      };

      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.refreshToken(refreshRequest)).rejects.toThrow(HttpException);
      await expect(service.refreshToken(refreshRequest)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should throw SERVICE_UNAVAILABLE for API errors', async () => {
      const error = new Error('API error');
      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.refreshToken(refreshRequest)).rejects.toThrow(HttpException);
      await expect(service.refreshToken(refreshRequest)).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });
  });

  describe('configuration', () => {
    it('should use custom API URL from config', async () => {
      mockConfigService.get.mockReturnValue('https://custom-api.com');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DummyJsonAuthService,
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const customService = module.get<DummyJsonAuthService>(DummyJsonAuthService);

      const mockResponse: Partial<AxiosResponse> = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await customService.login({ username: 'test', password: 'test' });

      expect(httpService.post).toHaveBeenCalledWith(
        'https://custom-api.com/auth/login',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});