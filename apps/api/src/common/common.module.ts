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
    EstadoApp, // Estados de la app
    
    TipoCliente, // Tipo cliente

    CorreoDefault
} from './entities';

import { 
  EmailService, // Email

  PrinterService, // PDF

  TipoIdentificacionService, // Tipo id

  TipoClienteService, // Tipo Cliente

  UbicacionService, // Ubicacion

  EstadoOrdenServicioService, // Estado Orden Servicio

  EstadoAppService, // Estados de la aplicacion

  CorreoDefaultService, // Correos por default

  FestivosService // Dias festivos (API externa)
} from './services';

import { 
  TipoIdentificacionController, // Tipo id

  TipoClienteController, // Tipo Cliente

  UbicacionController, // Ubicacion

  EstadoOrdenController, // Estado Orden Servicio

  EstadoAppController, // Estados de la aplicacion

  CorreoDefaultController, // Correos por default
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
      EstadoApp,
      CorreoDefault
  ]),
    ConfigModule,
    forwardRef(() => AuthModule), // Use forwardRef if AuthModule imports CommonModule
    PermissionsModule
  ],
  controllers: [
    TipoIdentificacionController,
    TipoClienteController,
    UbicacionController,
    EstadoOrdenController,
    EstadoAppController,
    CorreoDefaultController
  ],
  providers: [
    EmailService,
    PrinterService,
    TipoIdentificacionService,
    TipoClienteService,
    UbicacionService,
    EstadoOrdenServicioService,
    EstadoAppService,
    CorreoDefaultService,
    FestivosService
  ],
  exports: [
    TypeOrmModule,
    EmailService,
    PrinterService,
    TipoIdentificacionService,
    TipoClienteService,
    UbicacionService,
    EstadoOrdenServicioService,
    EstadoAppService,
    CorreoDefaultService,
    FestivosService
  ]
})
export class CommonModule {}
