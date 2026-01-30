import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { LoginRequest, LoginResponse } from '@dogs-api/shared-interfaces';
import { UserDto } from './user.dto';

export class LoginDto implements LoginRequest {
  @ApiProperty({
    description: 'Username for authentication',
    example: 'emilys',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password for authentication',
    example: 'emilyspass',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Token expiration time in minutes',
    example: 30,
    required: false,
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInMins?: number;
}

@Exclude()
export class LoginResponseDto extends UserDto implements LoginResponse {
  @Expose()
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @Expose()
  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}
