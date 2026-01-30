import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { User } from '@dogs-api/shared-interfaces';

@Exclude()
export class UserDto implements User {
  @Expose()
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Username', example: 'emilys' })
  username: string;

  @Expose()
  @ApiProperty({
    description: 'Email address',
    example: 'emily.johnson@x.dummyjson.com',
  })
  email: string;

  @Expose()
  @ApiProperty({ description: 'First name', example: 'Emily' })
  firstName: string;

  @Expose()
  @ApiProperty({ description: 'Last name', example: 'Johnson' })
  lastName: string;

  @Expose()
  @ApiProperty({ description: 'Gender', example: 'female' })
  gender: string;

  @Expose()
  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://dummyjson.com/icon/emilys/128',
  })
  image: string;
}
