import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';

import { 
  ReporteOrdenServicioService,
  ReporteTarifasService,
  ReporteConsolidacionService,
  ReporteAnexoFacturacionService,
  ReporteInterfaseService,
  ReporteLiquidacionService,
  ReporteClientesPuestosService
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
    ReporteLiquidacionService,
    ReporteClientesPuestosService
  ],
  exports: [
    ReporteOrdenServicioService,
    ReporteTarifasService,
    ReporteConsolidacionService,
    ReporteAnexoFacturacionService,
    ReporteInterfaseService,
    ReporteLiquidacionService,
    ReporteClientesPuestosService
  ],
})
export class ReportesModule {}
