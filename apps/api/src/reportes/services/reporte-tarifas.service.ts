import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Tarifa } from '../../tarifas/entities';

@Injectable()
export class ReporteTarifasService {

  private readonly logger = new Logger('ReporteTarifasService');
          
  constructor() {}

  async generateExcel(nombrePeriodo: string, tarifas: Record<string, Tarifa[]>) {
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(nombrePeriodo);

    // 👇 Generar buffer
    const excelUint8 = await workbook.xlsx.writeBuffer();
    const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer

    return excelBuffer;

  }

}
