import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CommonModule } from '../common/common.module'; 

import { 
  Cliente,
  Locacion,
  Correo,
  Segmentacion,
  SubSegmentacion
 } from './entities';

import { 
  ClientesService, // Clientes

  SegmentacionService, // Segmentaciones
  SubSegmentacionService, // Segmentaciones

  LocacionService, // Locacion
} from './services';

import { 
  ClientesController, // Clientes

  SegmentacionController, // Segmentaciones
  SubSegmentacionController, // Segmentaciones

  LocacionController, // Locaciones
} from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Cliente,
      Locacion,
      Correo,
      Segmentacion,
      SubSegmentacion
    ]),
    AuthModule,
    PermissionsModule,
    CommonModule,
    ConfigModule,

  ],
  controllers: [
    ClientesController,
    SegmentacionController,
    SubSegmentacionController,
    LocacionController
  ],
  providers: [
    ClientesService,
    SegmentacionService,
    SubSegmentacionService,
    LocacionService,
  ],
  exports: [
    TypeOrmModule,
    ClientesService,
    LocacionService
  ]
})
export class ClientesModule {}
