import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';

import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Permission, Role } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission, 
      Role
    ]),
    forwardRef(() => AuthModule),
    ConfigModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [TypeOrmModule, PermissionsService]
})
export class PermissionsModule {}
