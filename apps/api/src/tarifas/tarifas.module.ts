import { Module } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';

@Module({
  controllers: [TarifasController],
  providers: [TarifasService],
})
export class TarifasModule {}
