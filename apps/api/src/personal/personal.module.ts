import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CommonModule } from '../common/common.module'; 
import { NovedadModule } from '../novedad/novedad.module';

import { 
  Personal,

  TipoPersonal,

  TipoGenero,

  TipoContrato

} from './entities';

import { PersonalService, TipoPersonalService, TipoGeneroService, TipoContratoService, ProgramacionPersonalService } from './services';

import { PersonalController, TipoPersonalController, TipoGeneroController, TipoContratoController, ProgramacionPersonalController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Personal,
      TipoPersonal,
      TipoGenero,
      TipoContrato
    ]),
    ConfigModule,
    AuthModule,
    PermissionsModule,
    CommonModule,
    forwardRef(() => NovedadModule)
  ],
  controllers: [
    PersonalController,
    TipoPersonalController,
    TipoGeneroController,
    TipoContratoController,
    ProgramacionPersonalController
  ],
  providers: [
    PersonalService,
    TipoPersonalService,
    TipoGeneroService,
    TipoContratoService,
    ProgramacionPersonalService
  ],
  exports: [
    TypeOrmModule, 
    PersonalService,
    TipoPersonalService,
    TipoGeneroService,
    TipoContratoService,
    ProgramacionPersonalService
  ]
})
export class PersonalModule {}
