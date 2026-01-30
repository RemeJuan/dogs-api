import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { DummyJsonAuthService } from '@api/modules/http-dummy-json/services/dummy-json-auth.service';
import { User } from '@dogs-api/shared-interfaces';
import { LoginDto, LoginResponseDto } from '@api/modules/auth/dtos/login.dto';
import { UserDto } from '@api/modules/auth/dtos/user.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '@api/modules/auth/dtos/refresh-token.dto';

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

    return loginResponse;
  }

  async getCurrentUser(accessToken: string): Promise<UserDto> {
    const session = this.repository.getSession(accessToken);

    if (session) {
      return session;
    }

    const user = await this.dummyJsonAuthService.getCurrentUser(accessToken);

    this.repository.saveSession(
      accessToken,
      '',
      user,
      this.DEFAULT_TTL_MINUTES,
    );

    return user;
  }

  async refreshToken(
    request: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return await this.dummyJsonAuthService.refreshToken(request);
  }
}
