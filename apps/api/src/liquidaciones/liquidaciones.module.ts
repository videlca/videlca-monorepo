import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { OrdenServicioModule } from '../orden-servicio/orden-servicio.module';

import { Liquidacione } from './entities/liquidacione.entity';
import { LiquidacionesService } from './services/liquidaciones.service';

import { 
  LiquidacionesController, 
  AprobacionLiquidacionOrdenServicioController, 
  ExportacionController 
} from './controllers';
import { GrupoLiquidacion } from './entities/grupo_liquidaciones.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Liquidacione, Liquidacione, GrupoLiquidacion]),
    forwardRef(() => OrdenServicioModule), // usa forwardRef si hay circularidad
    CommonModule,
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
