import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';

import { 
  ReporteOrdenServicioService,
  ReporteTarifasService,
  ReporteConsolidacionService,
  ReporteAnexoFacturacionService,
  ReporteInterfaseService,
  ReporteLiquidacionService
} from './services';


@Module({
  imports: [
    
    CommonModule

  ],
  providers: [
    ReporteOrdenServicioService,
    ReporteTarifasService,
    ReporteConsolidacionService,
    ReporteAnexoFacturacionService,
    ReporteInterfaseService,
    ReporteLiquidacionService
  ],
  exports: [
    ReporteOrdenServicioService,
    ReporteTarifasService,
    ReporteConsolidacionService,
    ReporteAnexoFacturacionService,
    ReporteInterfaseService,
    ReporteLiquidacionService
  ],
})
export class ReportesModule {}
