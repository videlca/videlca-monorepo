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
import { PersonalModule } from '../personal/personal.module';

import { 
  OrdenServicio, 
  OrdenServicioId, 
  OrdenServicioTarifa, 
  ObservacionOrdenServicio,
  ProgramacionPersonal 
} from './entities';

import { OrdenServicioService, ObservacionesOrdenServicioService } from './services';

import { OrdenServicioController, ObservacionesOrdenServicioController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      OrdenServicio,
      OrdenServicioId,
      OrdenServicioTarifa,
      ObservacionOrdenServicio,
      ProgramacionPersonal
    ]),
    ConfigModule,
    CommonModule,
    AuthModule,
    PermissionsModule,
    UsersModule,
    ClientesModule,
    TarifasModule,
    ServiciosModule,
    PersonalModule

  ],
  controllers: [
    OrdenServicioController,
    ObservacionesOrdenServicioController
  ],
  providers: [
    OrdenServicioService,
    ObservacionesOrdenServicioService
  ],
  exports: [
    TypeOrmModule,
    OrdenServicioService,
    ObservacionesOrdenServicioService
  ]
})
export class OrdenServicioModule {}
