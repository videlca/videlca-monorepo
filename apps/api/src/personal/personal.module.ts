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

import { PersonalService, TipoPersonalService, TipoGeneroService } from './services';

import { PersonalController, TipoPersonalController, TipoGeneroController } from './controllers';

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
  ],
  providers: [
    PersonalService,
    TipoPersonalService,
    TipoGeneroService,
  ],
  exports: [
    TypeOrmModule, 
    PersonalService,
    TipoPersonalService,
    TipoGeneroService,
  ]
})
export class PersonalModule {}
