import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { ServiciosModule } from '../servicios/servicios.module';

import { Tarifa, TipoTarifa, TipoUnidadTiempo } from './entities';

import { TarifasService, TipoTarifaService, TipoUnidadTiempoService } from './services';

import { TarifasController, TipoTarifaController, TipoUnidadTiempoController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Tarifa,
      TipoTarifa,
      TipoUnidadTiempo
    ]),
    AuthModule,
    PermissionsModule,
    PeriodosModule,
    ServiciosModule,
    ConfigModule,
    
  ],
  controllers: [
    TarifasController,
    TipoTarifaController,
    TipoUnidadTiempoController
  ],
  providers: [
    TarifasService,
    TipoTarifaService,
    TipoUnidadTiempoService
  ],
  exports: [
    TypeOrmModule,
    TarifasService,
    TipoTarifaService,
    TipoUnidadTiempoService
  ]
})
export class TarifasModule {}
