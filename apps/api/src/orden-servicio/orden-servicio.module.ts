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
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';
import { ReportesModule } from 'src/reportes/reportes.module';

import { 
  OrdenServicio, 
  OrdenServicioId, 
  OrdenServicioTarifa, 
  ObservacionOrdenServicio,
  ProgramacionPersonal 
} from './entities';

import { 
  OrdenServicioService,
  OrdenServicioIdService, 
  ObservacionesOrdenServicioService 
} from './services';

import { 
  OrdenServicioController, 
  OrdenServicioIdController,
  ObservacionesOrdenServicioController, 
} from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      OrdenServicio,
      OrdenServicioId,
      OrdenServicioTarifa,
      ObservacionOrdenServicio,
      ProgramacionPersonal,
      ObservacionOrdenServicio,
      LiquidacionesModule,
    ]),
    ConfigModule,
    CommonModule,
    AuthModule,
    PermissionsModule,
    UsersModule,
    ClientesModule,
    TarifasModule,
    ServiciosModule,
    PersonalModule,
    LiquidacionesModule,
    ReportesModule

  ],
  controllers: [
    OrdenServicioController,
    OrdenServicioIdController,
    ObservacionesOrdenServicioController,
  ],
  providers: [
    OrdenServicioService,
    OrdenServicioIdService,
    ObservacionesOrdenServicioService,
  ],
  exports: [
    TypeOrmModule,
    OrdenServicioService,
    OrdenServicioIdService,
    ObservacionesOrdenServicioService,
  ]
})
export class OrdenServicioModule {}
