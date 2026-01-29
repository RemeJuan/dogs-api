import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DummyJsonAuthService } from '@api/modules/http-dummy-json/services/dummy-json-auth.service';

@Module({
  imports: [HttpModule],
  providers: [DummyJsonAuthService],
  exports: [DummyJsonAuthService],
})
export class HttpDummyJsonModule {}