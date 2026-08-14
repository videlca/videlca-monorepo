import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { ReportesModule } from '../reportes/reportes.module';
import { CommonModule } from '../common/common.module';

import { Tarifa, TipoTarifa, TipoUnidadTiempo, TarifaHora, TarifaHoraDescripcion } from './entities';

import {
  TarifasService,
  TipoTarifaService,
  TipoUnidadTiempoService,
  TarifaHoraService,
  TarifaHoraDescripcionService
} from './services';

import {
  TarifasController,
  TipoTarifaController,
  TipoUnidadTiempoController,
  TarifaHoraController,
  TarifaHoraDescripcionController
} from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Tarifa,
      TipoTarifa,
      TipoUnidadTiempo,
      TarifaHora,
      TarifaHoraDescripcion
    ]),
    AuthModule,
    PermissionsModule,
    CommonModule,
    ReportesModule,
    forwardRef(() => PeriodosModule),
    ServiciosModule,
    ConfigModule,
    
  ],
  controllers: [
    TarifasController,
    TipoTarifaController,
    TipoUnidadTiempoController,
    TarifaHoraController,
    TarifaHoraDescripcionController
  ],
  providers: [
    TarifasService,
    TipoTarifaService,
    TipoUnidadTiempoService,
    TarifaHoraService,
    TarifaHoraDescripcionService
  ],
  exports: [
    TypeOrmModule,
    TarifasService,
    TipoTarifaService,
    TipoUnidadTiempoService,
    TarifaHoraService,
    TarifaHoraDescripcionService
  ]
})
export class TarifasModule {}
