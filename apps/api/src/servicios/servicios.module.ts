import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { 
  Servicio, 
  TipoDuracion, 
  TipoHorario, 
  TipoHorarioDescripcion, 
  TipoServicio 
} from './entities';

import { 
  ServiciosService,
  TipoDuracionService,
  TipoHorarioDescripcionService,
  TipoServicioService 
} from './services';

import { 
  ServiciosController,
  TipoDuracionController,
  TipoHorarioDescripcionController,
  TipoServicioController 
} from './controllers';

@Module({
  imports: [
  
    TypeOrmModule.forFeature([
      Servicio,
      TipoServicio,
      TipoDuracion,
      TipoHorario,
      TipoHorarioDescripcion
    ]),
    AuthModule,
    PermissionsModule,
    ConfigModule,
  
  ],
  controllers: [
    ServiciosController,
    TipoDuracionController,
    TipoHorarioDescripcionController,
    TipoServicioController
  ],
  providers: [
    ServiciosService,
    TipoDuracionService,
    TipoHorarioDescripcionService,
    TipoServicioService
  ],
  exports: [
    TypeOrmModule,
    ServiciosService,
    TipoDuracionService,
    TipoHorarioDescripcionService,
    TipoServicioService
  ]
})
export class ServiciosModule {}
