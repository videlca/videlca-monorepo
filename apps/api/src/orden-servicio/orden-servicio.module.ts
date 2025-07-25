import { Module } from '@nestjs/common';
import { OrdenServicioService } from './services/orden-servicio.service';
import { OrdenServicioController } from './controllers/orden-servicio.controller';

@Module({
  controllers: [OrdenServicioController],
  providers: [OrdenServicioService],
})
export class OrdenServicioModule {}
