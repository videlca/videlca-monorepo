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
  TipoDuracionService 
} from './services';

import { 
  ServiciosController,
  TipoDuracionController 
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
    TipoDuracionController
  ],
  providers: [
    ServiciosService,
    TipoDuracionService
  ],
  exports: [
    TypeOrmModule,
    ServiciosService,
    TipoDuracionService
  ]
})
export class ServiciosModule {}
