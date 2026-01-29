import { Module } from '@nestjs/common';
import { AuthController } from '@api/modules/auth/controllers/auth.controller';
import { AuthService } from '@api/modules/auth/services/auth.service';
import { CacheModule } from '@api/modules/cache/cache.module';
import { HttpDummyJsonModule } from '@api/modules/http-dummy-json/http-dummy-json.module';

@Module({
  imports: [CacheModule, HttpDummyJsonModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}