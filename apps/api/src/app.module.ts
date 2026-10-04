import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      // apps/api/dist -> apps/web/dist (same layout locally and in Docker)
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/{*path}'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
