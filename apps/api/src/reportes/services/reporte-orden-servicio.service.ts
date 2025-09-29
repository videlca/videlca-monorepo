import { Injectable, Logger} from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

import { PrinterService } from '../../common/services';

import { OrdenServicio } from '../../orden-servicio/entities';

@Injectable()
export class ReporteOrdenServicioService {

  private readonly logger = new Logger('ReporteOrdenServicioService');
          
  constructor(
    private readonly printer: PrinterService,
  ) {}

  private generateOrdenServicioReporte(ordenServicio: OrdenServicio): TDocumentDefinitions {

    const docDefinition: TDocumentDefinitions = {
      content: [`Orden de Servicio ${ordenServicio.idOrdenServicio}`],
    } 

    return docDefinition;

  }

  getReporteOrdenServicio(ordenServicio: OrdenServicio){
    
    const docDefinition = this.generateOrdenServicioReporte(ordenServicio);

    return this.printer.createPdf(docDefinition);

  }
  
  async getBufferReporteOrdenServicio(ordenServicio: OrdenServicio){
    
    const docDefinition = this.generateOrdenServicioReporte(ordenServicio);

    return await this.printer.generatePdf(docDefinition);

  }

}
