import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';

import { ClienteAgrupado } from '../../liquidaciones/interfaces/consolidacion.interface';


@Injectable()
export class ReporteAnexoFacturacionService {

  private readonly logger = new Logger('ReporteAnexoFacturacionService');
          
  constructor() {}

  async generateExcel(clienteAgrupado: ClienteAgrupado) {

    try {

      const workbook = new ExcelJS.Workbook();
      const liquidacionSheet = workbook.addWorksheet('liquidacion');
      const consolidacionSheet = workbook.addWorksheet('consolidacion');

      const { 
        cliente, 
        numeroId, 
        servicios, 
        totalLiquidarAplicacion,
        totalSeguroVida,
        totalAui,
        totalTarifaAntesIva,
        totalIvaAui,
        totalTarifaConIva 
      } = clienteAgrupado;

      // #################
      // CONSOLIDACIONES SHEET
      // #################
  
      let currentRow = 1;
  
      let numeroCliente = 0;
  
      // 🔹 Cabecera de columnas
      const consolidacionHeader = [
        'Cliente',
        'NIT',
        'Nro Dcto Pedido',
        'Tipo Servicio',
        'Servicio Aplicación',
        'Código Servicio en SIIGO',
        '',
        'Cantidad Órdenes a Facturar',
        'Vr a Liquidar en Aplicacion',
        '(+) seguro de vida',
        '(+) Aui',
        'Tarifa antes de iva',
        '(+) Iva Aui',
        'Tarifa con Iva'
      ];
  
      const consolidacionHeaderRow = consolidacionSheet.addRow(consolidacionHeader);
      consolidacionHeaderRow.font = { bold: true };
      consolidacionHeaderRow.alignment = { horizontal: 'center' };
      consolidacionHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9D9D9' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
  
      currentRow++;
  
      // 🔹 Filas de servicios
      for (const servicio of Object.values(servicios)) {

        const codigoProducto = servicio.codigoServicioSiigo.split("-");

        const row = consolidacionSheet.addRow([
          cliente,
          Number(numeroId), // 2
          numeroCliente,
          servicio.tipoServicio,
          servicio.servicioAplicacion,
          Number(`${codigoProducto[0]}${codigoProducto[1]}${codigoProducto[2]}`),
          "",
          servicio.cantidadOrdenes,
          servicio.valorLiquidarAplicacion, // 9
          servicio.seguroVida, // 10
          servicio.aui, // 11
          servicio.tarifaAntesIva, // 12
          servicio.auiIVa, // 13
          servicio.tarifaConIva // 14
        ]);
  
        // 🔹 Alinear columnas específicas
        row.getCell(1).alignment = { horizontal: 'center' }; // A
        row.getCell(2).alignment = { horizontal: 'right' };  // B
        row.getCell(3).alignment = { horizontal: 'center' }; // C
        row.getCell(4).alignment = { horizontal: 'center' }; // D
        row.getCell(5).alignment = { horizontal: 'left' };   // E
        row.getCell(6).alignment = { horizontal: 'center' }; // F
        row.getCell(8).alignment = { horizontal: 'center' }; // H

        row.eachCell((cell, colNumber) => {

          const columnasTotales = [9, 10, 11, 12, 13, 14];

          const columnaId = [2];

          if (columnasTotales.includes(colNumber)) {
            cell.numFmt = '#,##0.00'; // separador de miles y dos decimales
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else if (columnaId.includes(colNumber)){
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }

        });

        currentRow++;

      }
  
      // 🔹 Fila de totales
      const totalRow = consolidacionSheet.addRow([
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'TOTALES',
        totalLiquidarAplicacion,
        totalSeguroVida,
        totalAui,
        totalTarifaAntesIva,
        totalIvaAui,
        totalTarifaConIva
      ]);
  
      totalRow.font = { bold: true };
      totalRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        const columnasTotales = [9, 10, 11, 12, 13, 14];

        if (columnasTotales.includes(colNumber)) {
          cell.numFmt = '#,##0.00'; // separador de miles y dos decimales
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        
      });

      currentRow++;
  
      // 🔹 Ajustar ancho de columnas automáticamente
      consolidacionSheet.columns.forEach((col) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, value.length);
        });
        col.width = maxLength + 2;
      });
      
      // #################
      // CONSOLIDACIONES SHEET
      // #################

      // 👇 Generar buffer
      const excelUint8 = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer
  
      return excelBuffer;
      
    } catch (error) {

      throw error;
      
    }

  }

  async generateZip(
    clientesAgrupados: ClienteAgrupado[], 
    mesLiq: string = "1", 
    anioLiq: string = "2025"
  ): Promise<Buffer> {
    
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
        for (const cliente of clientesAgrupados) {
          
          const excelBuffer = await this.generateExcel(cliente);
          archive.append(excelBuffer, { name: `${cliente.cliente}_mes_${mesLiq}_año_${anioLiq}.xlsx` });
        
        }

        await archive.finalize();
      
      } catch (err) {
      
        this.logger.error('Error generando ZIP', err);
        reject(err);
      
      }
    
    });
  
  }

}
