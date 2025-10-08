import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Tarifa } from '../../tarifas/entities';

type ServicioAgrupado = {
  tipoServicio: string;
  servicioAplicacion: string;
  codigoServicioSiigo: string;
  cantidadOrdenes: number;
  valorTotalLiquidacion: number;
};

interface ClienteAgrupado {
  cliente: string;
  numeroId: string;
  servicios: ServicioAgrupado[];
  totalesCliente: {
    totalOrdenes: number;
    totalLiquidacion: number;
  };
}


@Injectable()
export class ReporteConsolidacionService {

  private readonly logger = new Logger('ReporteConsolidacionService');
          
  constructor() {}

  async generateExcel(resultado: ClienteAgrupado[]) {
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    let currentRow = 1;

    for (const clienteData of resultado) {
      const { cliente, numeroId, servicios, totalesCliente } = clienteData;

      // 🔹 Dejar dos filas vacías entre clientes (excepto el primero)
      if (currentRow > 1) {
        sheet.addRow([]);
        sheet.addRow([]);
        currentRow += 2;
      }

      // 🔹 Cabecera de cliente
      const clienteRow = sheet.addRow([`${cliente} - ${numeroId}`]);
      clienteRow.font = { bold: true, size: 14 };
      sheet.mergeCells(`A${clienteRow.number}:G${clienteRow.number}`);
      currentRow = clienteRow.number + 1;

      // 🔹 Cabecera de columnas
      const header = [
        'Tipo Servicio',
        'Servicio Aplicación',
        'Código Servicio en SIIGO',
        'Cantidad Órdenes a Facturar',
        'Vr a Liquidar en $',
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
      for (const servicio of servicios) {
        sheet.addRow([
          servicio.tipoServicio,
          servicio.servicioAplicacion,
          servicio.codigoServicioSiigo,
          servicio.cantidadOrdenes,
          servicio.valorTotalLiquidacion,
        ]);
        currentRow++;
      }

      // 🔹 Fila de totales
      const totalRow = sheet.addRow([
        '',
        '',
        'TOTALES',
        totalesCliente.totalOrdenes,
        totalesCliente.totalLiquidacion,
      ]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
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

  }

}
