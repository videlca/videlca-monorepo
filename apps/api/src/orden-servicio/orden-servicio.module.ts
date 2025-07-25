import { Module } from '@nestjs/common';
import { OrdenServicioService } from './orden-servicio.service';
import { OrdenServicioController } from './orden-servicio.controller';

@Module({
  controllers: [OrdenServicioController],
  providers: [OrdenServicioService],
})
export class OrdenServicioModule {}
