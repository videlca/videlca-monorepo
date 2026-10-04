import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CommonModule } from '../common/common.module';
import { ClientesModule } from '../clientes/clientes.module';
import { NovedadModule } from '../novedad/novedad.module';
import { PersonalModule } from '../personal/personal.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { TarifasModule } from '../tarifas/tarifas.module';

import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    ConfigModule,
    ClientesModule,
    CommonModule,
    NovedadModule,
    PermissionsModule,
    PersonalModule,
    UsersModule,
    ServiciosModule,
    PeriodosModule,
    TarifasModule
  ]
})
export class SeedModule {}
