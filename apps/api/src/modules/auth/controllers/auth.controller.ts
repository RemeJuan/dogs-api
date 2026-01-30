import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@api/modules/auth/services/auth.service';
import { extractUserIdFromToken } from '../util/token.utils';
import { LoginDto, LoginResponseDto } from '../dtos/login.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '../dtos/refresh-token.dto';
import { UserDto } from '@api/modules/auth/dtos/user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with username and password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid credentials format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid username or password',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - Authentication service is down',
  })
  async login(@Body() credentials: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(credentials);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the currently authenticated user based on the provided access token',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing or invalid authorization header',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Token is not valid' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getCurrentUser(
    @Headers('authorization') authorization: string,
  ): Promise<UserDto> {
    const userId = extractUserIdFromToken(authorization, this.jwtService);
    return this.authService.getCurrentUser(userId);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token using the refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid refresh token format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Refresh token is not valid',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async refreshToken(
    @Body() request: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(request);
  }
}
