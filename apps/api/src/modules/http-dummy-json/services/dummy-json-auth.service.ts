import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  User,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '@dogs-api/shared-interfaces';

@Injectable()
export class DummyJsonAuthService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(DummyJsonAuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get<string>('DUMMY_JSON_API_URL', 'https://dummyjson.com');
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/login`, credentials, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }).pipe(
          catchError((error: AxiosError) => {
            this.handleHttpError(error, 'Failed to login');
            throw error;
          })
        )
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw new HttpException(
          'Invalid username or password',
          HttpStatus.UNAUTHORIZED
        );
      }
      
      throw new HttpException(
        'Authentication service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/auth/me`, {
          headers: { 
            'Authorization': `Bearer ${accessToken}` 
          },
          withCredentials: true,
        }).pipe(
          catchError((error: AxiosError) => {
            this.handleHttpError(error, 'Failed to fetch current user');
            throw error;
          })
        )
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Get current user error: ${error.message}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new HttpException(
          'Invalid or expired token',
          HttpStatus.UNAUTHORIZED
        );
      }
      
      throw new HttpException(
        'Failed to fetch user information',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/refresh`, request, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }).pipe(
          catchError((error: AxiosError) => {
            this.handleHttpError(error, 'Failed to refresh token');
            throw error;
          })
        )
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new HttpException(
          'Invalid or expired refresh token',
          HttpStatus.UNAUTHORIZED
        );
      }
      
      throw new HttpException(
        'Failed to refresh authentication token',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private handleHttpError(error: AxiosError, context: string): void {
    if (error.response) {
      this.logger.error(`${context} - Status: ${error.response.status}, Message: ${error.message}`);
    } else if (error.request) {
      this.logger.error(`${context} - No response received: ${error.message}`);
    } else {
      this.logger.error(`${context} - ${error.message}`);
    }
  }
}