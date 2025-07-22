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

import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';

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
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [
    TypeOrmModule,
    ServiciosService
  ]
})
export class ServiciosModule {}
