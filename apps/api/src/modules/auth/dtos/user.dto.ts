import { ApiProperty } from '@nestjs/swagger';
import { User } from '@dogs-api/shared-interfaces';

export class UserDto implements User {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username', example: 'emilys' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'emily.johnson@x.dummyjson.com' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'Emily' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Johnson' })
  lastName: string;

  @ApiProperty({ description: 'Gender', example: 'female' })
  gender: string;

  @ApiProperty({ description: 'Profile image URL', example: 'https://dummyjson.com/icon/emilys/128' })
  image: string;
}