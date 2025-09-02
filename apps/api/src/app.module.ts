import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvConfiguration } from './config/env.config';
import { JoiValidationSchema } from './config/joi.validation';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CommonModule } from './common/common.module';
import { ClientesModule } from './clientes/clientes.module';
import { PersonalModule } from './personal/personal.module';
import { NovedadModule } from './novedad/novedad.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { SeedModule } from './seed/seed.module';
import { ServiciosModule } from './servicios/servicios.module';
import { PeriodosModule } from './periodos/periodos.module';
import { OrdenServicioModule } from './orden-servicio/orden-servicio.module';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';
import { ReportesModule } from './reportes/reportes.module';
import { InicioModule } from './inicio/inicio.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      load: [ EnvConfiguration ],
      validationSchema: JoiValidationSchema
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: process.env.ENV === 'dev',
    }),

    AuthModule, 

    UsersModule, 
    
    PermissionsModule,

    OrdenServicioModule, 
    
    ClientesModule, 
    
    PersonalModule,
    
    NovedadModule,
    
    PeriodosModule, 
    
    ServiciosModule,
    
    TarifasModule, 
    
    CommonModule, 
    
    SeedModule, LiquidacionesModule, ReportesModule, InicioModule,
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
