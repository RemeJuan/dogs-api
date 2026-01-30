import { Module } from '@nestjs/common';
import { AuthController } from '@api/modules/auth/controllers/auth.controller';
import { AuthService } from '@api/modules/auth/services/auth.service';
import { AuthRepository } from '@api/modules/auth/services/auth.repository';
import { HttpDummyJsonModule } from '@api/modules/http-dummy-json/http-dummy-json.module';

@Module({
  imports: [HttpDummyJsonModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}