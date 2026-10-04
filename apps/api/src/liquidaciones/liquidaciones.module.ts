import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { OrdenServicioModule } from '../orden-servicio/orden-servicio.module';
import { ReportesModule } from '../reportes/reportes.module';
import { ClientesModule } from '../clientes/clientes.module';
import { AdicionalesModule } from '../adicionales/adicionales.module';

import { 
  Liquidacione,
  GrupoLiquidacion,
  LiquidacionServicioOrdenServicio,
  NumeroPedido,
  ObservacionGrupoOrdenServicio
} from './entities';

import { 
  LiquidacionesService,
  ObservacionesGrupoOrdenServicioService
} from './services';

import { 
  LiquidacionesController, 
  AprobacionLiquidacionOrdenServicioController, 
  ExportacionController,
  ObservacionesGrupoOrdenServicioController
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Liquidacione, 
      GrupoLiquidacion,
      LiquidacionServicioOrdenServicio,
      NumeroPedido,
      ObservacionGrupoOrdenServicio
    ]),
    forwardRef(() => OrdenServicioModule), // usa forwardRef si hay circularidad
    ConfigModule,
    CommonModule,
    ReportesModule,
    ClientesModule,
    AdicionalesModule,
    AuthModule,

  ],
  controllers: [
    LiquidacionesController, 
    AprobacionLiquidacionOrdenServicioController, 
    ExportacionController,
    ObservacionesGrupoOrdenServicioController
  ],
  providers: [
    LiquidacionesService,
    ObservacionesGrupoOrdenServicioService
  ],
  exports: [
    LiquidacionesService,
    ObservacionesGrupoOrdenServicioService
  ],
})
export class LiquidacionesModule {}
