import { ApiProperty } from '@nestjs/swagger';
import { LoginRequest, LoginResponse } from '@dogs-api/shared-interfaces';
import { UserDto } from './user.dto';

export class LoginDto implements LoginRequest {
  @ApiProperty({ 
    description: 'Username for authentication', 
    example: 'emilys' 
  })
  username: string;

  @ApiProperty({ 
    description: 'Password for authentication', 
    example: 'emilyspass' 
  })
  password: string;

  @ApiProperty({ 
    description: 'Token expiration time in minutes', 
    example: 30,
    required: false,
    default: 60
  })
  expiresInMins?: number;
}

export class LoginResponseDto extends UserDto implements LoginResponse {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}