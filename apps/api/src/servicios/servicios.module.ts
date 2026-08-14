import { Module, forwardRef } from '@nestjs/common';
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
  TipoServicioService,
  TipoHorarioService 
} from './services';

import { TarifasModule } from '../tarifas/tarifas.module';

import { 
  ServiciosController,
  TipoDuracionController,
  TipoHorarioDescripcionController,
  TipoServicioController,
  TipoHorarioController 
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
    forwardRef(() => TarifasModule),
    ConfigModule,
  
  ],
  controllers: [
    ServiciosController,
    TipoDuracionController,
    TipoHorarioDescripcionController,
    TipoServicioController,
    TipoHorarioController
  ],
  providers: [
    ServiciosService,
    TipoDuracionService,
    TipoHorarioDescripcionService,
    TipoServicioService,
    TipoHorarioService
  ],
  exports: [
    TypeOrmModule,
    ServiciosService,
    TipoDuracionService,
    TipoHorarioDescripcionService,
    TipoServicioService,
    TipoHorarioService
  ]
})
export class ServiciosModule {}
