import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module'; 
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from '../users/users.module';
import { ClientesModule } from '../clientes/clientes.module';
import { TarifasModule } from '../tarifas/tarifas.module';
import { ServiciosModule } from '../servicios/servicios.module';

import { OrdenServicio, ObservacionOrdenServicio } from './entities';

import { OrdenServicioService } from './services';

import { OrdenServicioController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      OrdenServicio,
      ObservacionOrdenServicio
    ]),
    ConfigModule,
    CommonModule,
    AuthModule,
    PermissionsModule,
    UsersModule,
    ClientesModule,
    TarifasModule,
    ServiciosModule

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
