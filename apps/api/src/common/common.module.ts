import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { 
    Pais, // ubicacion
    Departamento, // ubicacion
    Ciudad, // ubicacion

    TipoIdentificacion, // tipo id

    EstadoOrdenServicio, // Estado Orden servicio
    
    TipoCliente, // Tipo cliente
} from './entities';

import { 
  EmailService, // Email

  TipoIdentificacionService, // Tipo id

  TipoClienteService, // Tipo Cliente

  UbicacionService, // Ubicacion

  EstadoOrdenServicioService, // Estado Orden Servicio
} from './services';

import { 
  TipoIdentificacionController, // Tipo id

  TipoClienteController, // Tipo Cliente

  UbicacionController, // Ubicacion

  EstadoOrdenController, // Estado Orden Servicio
} from './controllers';


@Module({
  imports: [

    TypeOrmModule.forFeature([
      Pais, 
      Departamento, 
      Ciudad,
      TipoIdentificacion,
      TipoCliente,
      EstadoOrdenServicio,
  ]),
    ConfigModule,
    forwardRef(() => AuthModule), // Use forwardRef if AuthModule imports CommonModule
    PermissionsModule
  ],
  controllers: [
    TipoIdentificacionController,
    TipoClienteController,
    UbicacionController,
    EstadoOrdenController
  ],
  providers: [
    EmailService,
    TipoIdentificacionService,
    TipoClienteService,
    UbicacionService,
    EstadoOrdenServicioService
  ],
  exports: [
    TypeOrmModule, 
    EmailService,
    TipoIdentificacionService,
    TipoClienteService,
    UbicacionService,
    EstadoOrdenServicioService
  ]
})
export class CommonModule {}
