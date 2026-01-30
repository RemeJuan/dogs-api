import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@api/modules/auth/controllers/auth.controller';
import { AuthService } from '@api/modules/auth/services/auth.service';
import { AuthRepository } from '@api/modules/auth/services/auth.repository';
import { HttpDummyJsonModule } from '@api/modules/http-dummy-json/http-dummy-json.module';

@Module({
  imports: [
    HttpDummyJsonModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dummy-secret', // Not used for verification, only decoding
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
