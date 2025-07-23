import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { ServiciosModule } from '../servicios/servicios.module';

import { Tarifa, TipoTarifa, TipoUnidadTiempo } from './entities';

import { TarifasService } from './tarifas.service';

import { TarifasController } from './tarifas.controller';

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
    TarifasController
  ],
  providers: [
    TarifasService
  ],
  exports: [
    TypeOrmModule,
    TarifasService
  ]
})
export class TarifasModule {}
