import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { OrdenServicioModule } from '../orden-servicio/orden-servicio.module';
import { ReportesModule } from '../reportes/reportes.module';

import { 
  Liquidacione,
  GrupoLiquidacion,
  LiquidacionServicioOrdenServicio,
  NumeroPedido
} from './entities';

import { LiquidacionesService } from './services/liquidaciones.service';

import { 
  LiquidacionesController, 
  AprobacionLiquidacionOrdenServicioController, 
  ExportacionController 
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Liquidacione, 
      GrupoLiquidacion,
      LiquidacionServicioOrdenServicio,
      NumeroPedido
    ]),
    forwardRef(() => OrdenServicioModule), // usa forwardRef si hay circularidad
    CommonModule,
    ReportesModule,
    AuthModule,
    
  ],
  controllers: [
    LiquidacionesController, 
    AprobacionLiquidacionOrdenServicioController, 
    ExportacionController
  ],
  providers: [
    LiquidacionesService,
  ],
  exports: [
    LiquidacionesService
  ],
})
export class LiquidacionesModule {}
