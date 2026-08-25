import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import { ClienteAgrupado } from '../../liquidaciones/interfaces/consolidacion.interface';


@Injectable()
export class ReporteConsolidacionService {

  private readonly logger = new Logger('ReporteConsolidacionService');
          
  constructor() {}

  async generateExcel(clientesAgrupados: ClienteAgrupado[], numeroPedido: number = 0) {

    try {

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('consolidacion');
  
      // 🔹 Dejar la primera fila vacía
      sheet.addRow([]);
  
      let currentRow = 1;
  
      let numeroCliente = numeroPedido - 1;
  
      for (const clienteData of clientesAgrupados) {
  
        numeroCliente += 1;
  
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
        } = clienteData;
  
        // 🔹 Dejar dos filas vacías entre clientes (excepto el primero)
        if (currentRow > 1) {
          sheet.addRow([]);
          sheet.addRow([]);
          currentRow += 2;
        }
  
  
        // 🔹 Cabecera de columnas
        const header = [
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
  
        const headerRow = sheet.addRow(header);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.eachCell((cell) => {
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
  
          const row = sheet.addRow([
            cliente,
            Number(numeroId), // 2
            numeroCliente,
            servicio.armado ? "Armado" : "Monitoreo",
            servicio.servicioAplicacion,
            servicio.codigoServicioSiigo,
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
        const totalRow = sheet.addRow([
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
      }
  
      // 🔹 Ajustar ancho de columnas automáticamente
      sheet.columns.forEach((col) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, value.length);
        });
        col.width = maxLength + 2;
      });
  
      // 👇 Generar buffer
      const excelUint8 = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer
  
      return excelBuffer;
      
    } catch (error) {

      throw error;
      
    }

  }

}
