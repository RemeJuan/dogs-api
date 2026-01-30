import { Module, Global } from '@nestjs/common';
import { DatabaseService } from '@api/modules/database/services/database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}