import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';


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

  async generateZip(): Promise<Buffer> {

    const clientes = ["Cliente1", "Cliente2", "Cliente3"]
    
    return new Promise(async (resolve, reject) => {
      
      try {

        const archive = archiver('zip', { zlib: { level: 9 } });
        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk) => chunks.push(chunk));
        outputStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputStream.on('error', (err) => reject(err));

        archive.pipe(outputStream);

        // Generar Excels uno por uno y agregarlos al ZIP
        for (const cliente of clientes) {
          
          const excelBuffer = await this.generateExcel();
          archive.append(excelBuffer, { name: `${cliente}.xlsx` });
        
        }

        await archive.finalize();
      
      } catch (err) {
      
        this.logger.error('Error generando ZIP', err);
        reject(err);
      
      }
    
    });
  
  }

}
