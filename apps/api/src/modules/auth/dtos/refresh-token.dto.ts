import { ApiProperty } from '@nestjs/swagger';
import {
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@dogs-api/shared-interfaces';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RefreshTokenDto implements RefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh token',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({
    description: 'New access token expiration time in minutes',
    example: 30,
    required: false,
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInMins?: number;
}

export class RefreshTokenResponseDto implements RefreshTokenResponse {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'New JWT refresh token' })
  refreshToken: string;
}
