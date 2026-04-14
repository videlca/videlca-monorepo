import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Tarifa } from '../../tarifas/entities';

@Injectable()
export class ReporteTarifasService {

  private readonly logger = new Logger('ReporteTarifasService');
          
  constructor() {}

  async generateExcel(nombrePeriodo: string, tarifasPorTipo: Record<string, Tarifa[]>) {
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(nombrePeriodo);

    // ---------------------------
    // CONFIGURAR ESTILOS GENERALES
    // ---------------------------
    sheet.properties.defaultRowHeight = 22;
  
    const headerStyle = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };
  
    const groupTitleStyle = {
      font: { bold: true, size: 14 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E2E2' } },
    };
  
    const rowBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // ---------------------------
    // RECORRER CADA GRUPO DE TARIFAS
    // ---------------------------
    for (const tipoTarifa of Object.keys(tarifasPorTipo)) {
      const tarifas = tarifasPorTipo[tipoTarifa];
  
      // 🔹 TÍTULO DEL GRUPO (Ej: "Servicios de Vigilancia")
      const titleRow = sheet.addRow([tipoTarifa]);
      titleRow.font = { bold: true, size: 16 };
      titleRow.alignment = { horizontal: 'center' };
      sheet.mergeCells(`A${titleRow.number}:I${titleRow.number}`);
  
      // 🔹 SUBTÍTULO DEL PERIODO (Ej: "Agosto 1 a Diciembre 24 de 2025")
      const periodRow = sheet.addRow([nombrePeriodo]);
      periodRow.font = { italic: true, size: 12 };
      periodRow.alignment = { horizontal: 'center' };
      sheet.mergeCells(`A${periodRow.number}:I${periodRow.number}`);
  
      sheet.addRow([]); // espacio
  
      // ---------------------------
      // ENCABEZADOS
      // ---------------------------
      const header = sheet.addRow([
        "Código",
        "Servicio",
        "Costos directos",
        "Seguro de vida",
        "Directos + Seguro",
        "AUI",
        "Tarifa antes de IVA",
        "IVA",
        "Tarifa con IVA",
      ]);
  
      header.eachCell((cell) => {
        Object.assign(cell, headerStyle);
      });
  
      // ---------------------------
      // FILAS DE TARIFAS DEL GRUPO
      // ---------------------------
      for (const t of tarifas) {
        const servicio = t.idServicio;
  
        const row = sheet.addRow([
          servicio.codigo,
          servicio.descripcion,
          t.costosDirectos,
          t.seguroVida ?? 0,
          t.costosDirectosSeguroVida,
          t.aui,
          t.precioAntesIva,
          t.iva,
          t.precioTotal
        ]);
  
        row.eachCell((cell, colNumber) => {

          // Solo aplicar formato a columnas numéricas (opcional)
          if (colNumber >= 3) {
            cell.numFmt = '#.##0,00';
          }

          cell.border = rowBorder;
        });

      }
  
      sheet.addRow([]); // espacio entre grupos
    }

    // AUTO ANCHO DE COLUMNAS
    sheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength + 3;
    });

    // 👇 Generar buffer
    const excelUint8 = await workbook.xlsx.writeBuffer();
    const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer

    return excelBuffer;

  }

}
