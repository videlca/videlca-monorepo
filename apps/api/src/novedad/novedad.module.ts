import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PersonalModule } from '../personal/personal.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { Novedad, TipoNovedad } from './entities';
import { NovedadService, TipoNovedadService } from './services';
import { NovedadController, TipoNovedadController, PersonalNovedadesController } from './controllers';

@Module({
  imports: [
    
    TypeOrmModule.forFeature([
      Novedad,
      TipoNovedad,
    ]),
    ConfigModule,
    AuthModule,
    PermissionsModule,
    forwardRef(() => PersonalModule),

  ],
  controllers: [NovedadController, TipoNovedadController, PersonalNovedadesController],
  providers: [NovedadService, TipoNovedadService],
  exports: [
    TypeOrmModule,
    NovedadService,
    TipoNovedadService
  ]
})
export class NovedadModule {}
