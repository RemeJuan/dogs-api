import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AuthRepository } from './auth.repository';
import { DummyJsonAuthService } from '@api/modules/http-dummy-json/services/dummy-json-auth.service';
import { User } from '@dogs-api/shared-interfaces';
import { LoginDto, LoginResponseDto } from '@api/modules/auth/dtos/login.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '@api/modules/auth/dtos/refresh-token.dto';
import { UserDto } from '@api/modules/auth/dtos/user.dto';

@Injectable()
export class AuthService {
  private readonly DEFAULT_TTL_MINUTES = 59;

  constructor(
    private readonly repository: AuthRepository,
    private readonly dummyJsonAuthService: DummyJsonAuthService,
  ) {}

  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    const loginResponse = await this.dummyJsonAuthService.login(credentials);

    const userData: User = {
      id: loginResponse.id,
      username: loginResponse.username,
      email: loginResponse.email,
      firstName: loginResponse.firstName,
      lastName: loginResponse.lastName,
      gender: loginResponse.gender,
      image: loginResponse.image,
    };

    // Store session in database with 59 minute TTL (dummy uses 60 by default), but we are proxying so dropping 1min for buffer)
    const ttl = credentials.expiresInMins || this.DEFAULT_TTL_MINUTES;
    this.repository.saveSession(
      loginResponse.accessToken,
      loginResponse.refreshToken,
      userData,
      ttl,
    );

    return plainToInstance(LoginResponseDto, loginResponse);
  }

  async getCurrentUser(userId: number): Promise<UserDto> {
    const session = this.repository.getSession(userId);

    if (!session) {
      throw new UnauthorizedException(
        'Session not found or expired. Please log in again.',
      );
    }

    return plainToInstance(UserDto, session);
  }

  async refreshToken(
    request: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    const oldSession = request.refreshToken
      ? this.repository.getSessionByRefreshToken(request.refreshToken)
      : null;

    if (!oldSession) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token. Please log in again.',
      );
    }

    const refreshResponse =
      await this.dummyJsonAuthService.refreshToken(request);

    const ttl = request.expiresInMins || this.DEFAULT_TTL_MINUTES;
    this.repository.updateSessionTokens(
      oldSession.userId,
      refreshResponse.accessToken,
      refreshResponse.refreshToken,
      ttl,
    );

    return refreshResponse;
  }
}
