import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TarifasModule } from '../tarifas/tarifas.module';

import { Periodo } from './entities/periodo.entity';
import { PeriodosService } from './periodos.service';
import { PeriodosController } from './periodos.controller';

@Module({
  imports: [

    TypeOrmModule.forFeature([
      Periodo
    ]),
    AuthModule,
    PermissionsModule,
    CommonModule,
    ConfigModule,
    TarifasModule

  ],
  controllers: [PeriodosController],
  providers: [PeriodosService],
  exports: [
    TypeOrmModule,
    PeriodosService
  ]
})
export class PeriodosModule { }
