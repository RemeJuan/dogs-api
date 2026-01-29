import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {CacheService} from '@api/modules/cache/services/cache.service';
import {DummyJsonAuthService} from '@api/modules/http-dummy-json/services/dummy-json-auth.service';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
} from '@dogs-api/shared-interfaces';

@Injectable()
export class AuthService {
  private readonly CACHE_TTL: number;

  constructor(
    private readonly cacheService: CacheService,
    private readonly dummyJsonAuthService: DummyJsonAuthService,
    private readonly configService: ConfigService
  ) {
    this.CACHE_TTL = parseInt(
      this.configService.get<string>('CACHE_TTL_AUTH_SESSION', '1800'),
      10
    );
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const loginResponse = await this.dummyJsonAuthService.login(credentials);

    const cacheKey = `auth:session:${loginResponse.accessToken}`;
    const userData: User = {
      id: loginResponse.id,
      username: loginResponse.username,
      email: loginResponse.email,
      firstName: loginResponse.firstName,
      lastName: loginResponse.lastName,
      gender: loginResponse.gender,
      image: loginResponse.image,
    };

    this.cacheService.set(cacheKey, userData, this.CACHE_TTL);

    return loginResponse;
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    const cacheKey = `auth:session:${accessToken}`;

    const cached = this.cacheService.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.dummyJsonAuthService.getCurrentUser(accessToken);

    this.cacheService.set(cacheKey, user, this.CACHE_TTL);

    return user;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return await this.dummyJsonAuthService.refreshToken(request);
  }
}