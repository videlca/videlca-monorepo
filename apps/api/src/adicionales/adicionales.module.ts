import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ClientesModule } from '../clientes/clientes.module';
import { CommonModule } from '../common/common.module';

import { Adicional, TipoAdicional } from './entities';

import { AdicionalesService } from './services';
import { AdicionalesController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Adicional,
      TipoAdicional,
    ]),
    AuthModule,
    PermissionsModule,
    ClientesModule,
    CommonModule,
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
