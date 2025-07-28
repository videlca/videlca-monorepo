import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module'; 
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from 'src/users/users.module';
import { ClientesModule } from 'src/clientes/clientes.module';
import { TarifasModule } from 'src/tarifas/tarifas.module';

import { OrdenServicio } from './entities';

import { OrdenServicioService } from './services';

import { OrdenServicioController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      OrdenServicio
    ]),
    ConfigModule,
    CommonModule,
    AuthModule,
    PermissionsModule,
    UsersModule,
    ClientesModule,
    TarifasModule

  ],
  controllers: [
    OrdenServicioController
  ],
  providers: [
    OrdenServicioService
  ],
  exports: [
    TypeOrmModule,
    OrdenServicioService
  ]
})
export class OrdenServicioModule {}
