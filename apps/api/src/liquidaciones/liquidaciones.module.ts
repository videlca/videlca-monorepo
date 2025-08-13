import { forwardRef, Module } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { LiquidacionesController } from './liquidaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacione } from './entities/liquidacione.entity';
import { OrdenServicioModule } from 'src/orden-servicio/orden-servicio.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Liquidacione]),
    forwardRef(() => OrdenServicioModule), // usa forwardRef si hay circularidad
    CommonModule,
  ],
  controllers: [LiquidacionesController],
  providers: [LiquidacionesService],
  exports: [LiquidacionesService],
})
export class LiquidacionesModule {}
