import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReporteAnexoFacturacionService {

  private readonly logger = new Logger('ReporteAnexoFacturacionService');
          
  constructor() {}

  async generateExcel() {

    try {

      const workbook = new ExcelJS.Workbook();
      const liquidacionSheet = workbook.addWorksheet('liquidacion');
      const consolidacionSheet = workbook.addWorksheet('consolidacion');
  
      // 👇 Generar buffer
      const excelUint8 = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer
  
      return excelBuffer;
      
    } catch (error) {

      throw error;
      
    }

  }

}
