import { ApiProperty } from '@nestjs/swagger';
import { RefreshTokenRequest, RefreshTokenResponse } from '@dogs-api/shared-interfaces';

export class RefreshTokenDto implements RefreshTokenRequest {
  @ApiProperty({ 
    description: 'Refresh token (optional if provided via cookie)', 
    required: false 
  })
  refreshToken?: string;

  @ApiProperty({ 
    description: 'New access token expiration time in minutes', 
    example: 30,
    required: false,
    default: 60
  })
  expiresInMins?: number;
}

export class RefreshTokenResponseDto implements RefreshTokenResponse {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'New JWT refresh token' })
  refreshToken: string;
}