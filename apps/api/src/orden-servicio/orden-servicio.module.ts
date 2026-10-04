import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module'; 
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from '../users/users.module';
import { ClientesModule } from '../clientes/clientes.module';
import { TarifasModule } from '../tarifas/tarifas.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { PersonalModule } from '../personal/personal.module';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';
import { ReportesModule } from 'src/reportes/reportes.module';

import {
  OrdenServicio,
  OrdenServicioId,
  OrdenServicioIdAnulado,
  OrdenServicioDetalle,
  ObservacionOrdenServicio,
  ProgramacionPersonal,
  OrigenServicio
} from './entities';

import {
  OrdenServicioService,
  OrdenServicioIdService,
  ObservacionesOrdenServicioService,
  OrdenServicioScheduler,
  OrigenServicioService
} from './services';

import {
  OrdenServicioController,
  OrdenServicioIdController,
  ObservacionesOrdenServicioController,
  OrigenServicioController
} from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      OrdenServicio,
      OrdenServicioId,
      OrdenServicioIdAnulado,
      OrdenServicioDetalle,
      ObservacionOrdenServicio,
      ProgramacionPersonal,
      OrigenServicio,
    ]),
    ConfigModule,
    CommonModule,
    AuthModule,
    PermissionsModule,
    UsersModule,
    ClientesModule,
    TarifasModule,
    PeriodosModule,
    ServiciosModule,
    PersonalModule,
    LiquidacionesModule,
    ReportesModule

  ],
  controllers: [
    OrdenServicioController,
    OrdenServicioIdController,
    ObservacionesOrdenServicioController,
    OrigenServicioController,
  ],
  providers: [
    OrdenServicioService,
    OrdenServicioIdService,
    ObservacionesOrdenServicioService,
    OrdenServicioScheduler,
    OrigenServicioService,
  ],
  exports: [
    TypeOrmModule,
    OrdenServicioService,
    OrdenServicioIdService,
    ObservacionesOrdenServicioService,
  ]
})
export class OrdenServicioModule {}
