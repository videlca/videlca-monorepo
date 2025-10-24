import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import { ClienteAgrupado } from '../../liquidaciones/interfaces/consolidacion.interface';

@Injectable()
export class ReporteLiquidacionService {

  private readonly logger = new Logger('ReporteLiquidacionService');
          
  constructor() {}

  async generateExcel(clientesAgrupados: ClienteAgrupado[]) {

    try {

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('liquidacion');

      
  
      // 👇 Generar buffer
      const excelUint8 = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer
  
      return excelBuffer;
      
    } catch (error) {

      throw error;
      
    }

  }

}
