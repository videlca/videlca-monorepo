import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';

import { 
  ReporteOrdenServicioService,
  ReporteTarifasService,
  ReporteConsolidacionService,
  ReporteAnexoFacturacionService,
  ReporteInterfaseService,
  ReporteLiquidacionService,
  ReporteClientesPuestosService,
  ReporteGrupoLiquidacionService
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
    ReporteClientesPuestosService,
    ReporteGrupoLiquidacionService
  ],
  exports: [
    ReporteOrdenServicioService,
    ReporteTarifasService,
    ReporteConsolidacionService,
    ReporteAnexoFacturacionService,
    ReporteInterfaseService,
    ReporteLiquidacionService,
    ReporteClientesPuestosService,
    ReporteGrupoLiquidacionService
  ],
})
export class ReportesModule {}
