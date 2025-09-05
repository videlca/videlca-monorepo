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

} from './entities';

import { PersonalService, TipoPersonalService, TipoGeneroService, ProgramacionPersonalService } from './services';

import { PersonalController, TipoPersonalController, TipoGeneroController, ProgramacionPersonalController } from './controllers';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Personal,
      TipoPersonal,
      TipoGenero,
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
    ProgramacionPersonalController
  ],
  providers: [
    PersonalService,
    TipoPersonalService,
    TipoGeneroService,
    ProgramacionPersonalService
  ],
  exports: [
    TypeOrmModule, 
    PersonalService,
    TipoPersonalService,
    TipoGeneroService,
    ProgramacionPersonalService
  ]
})
export class PersonalModule {}
