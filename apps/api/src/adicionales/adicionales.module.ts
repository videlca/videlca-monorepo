import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ClientesModule } from '../clientes/clientes.module';

import { Adicional } from './entities';

import { AdicionalesService } from './services';
import { AdicionalesController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Adicional,
    ]),
    AuthModule,
    PermissionsModule,
    ClientesModule,
    ConfigModule,

  ],
  controllers: [
    AdicionalesController,
  ],
  providers: [
    AdicionalesService,
  ],
  exports: [
    TypeOrmModule,
    AdicionalesService,
  ]
})
export class AdicionalesModule {}
