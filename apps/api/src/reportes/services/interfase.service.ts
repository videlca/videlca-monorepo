import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import { ClienteAgrupado } from '../../liquidaciones/interfaces/consolidacion.interface';

@Injectable()
export class ReporteInterfaseService {

  private readonly logger = new Logger('ReporteInterfaseService');
          
  constructor() {}

  async generateExcel(clientesAgrupados: ClienteAgrupado[]) {

    try {

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Exportación');

      // --- VARIABLES DE FECHA (puedes cambiar luego) ---
      const diaInicio = 1;
      const mesInicio = 'oct';
      const añoInicio = 2024;
      const diaFin = 31;
      const mesFin = 'oct';
      const añoFin = 2024;
  
      // --- CONFIGURACIÓN GENERAL ---
      const lastColumn = 'AX';
      const azulFondo = '99CCFF'; // azul claro similar al de la imagen
      const borderStyle = { style: 'thin', color: { argb: '000000' } };
      const bordeColor = '000000'; // negro
  
      // Helper para unir, pintar y dar borde a una fila completa
      const formatearFila = (
        fila: number,
        texto: string,
        align: 'left' | 'center' | 'right',
      ) => {
        // Unir toda la fila desde A hasta AX
        worksheet.mergeCells(`A${fila}:${lastColumn}${fila}`);
      
        const cell = worksheet.getCell(`A${fila}`);
      
        // Texto y alineación
        cell.value = texto;
        cell.alignment = { vertical: 'middle', horizontal: align };
      
        // Color de fondo
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: azulFondo },
        };
      
        // Bordes (ajustado a los tipos nuevos de ExcelJS)
        const borderConfig: ExcelJS.Borders = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
          diagonal: { up: false, down: false, style: undefined },
        };
      
        // Aplicar a la celda combinada (A) y al extremo derecho (AX)
        worksheet.getCell(`A${fila}`).border = borderConfig;
        worksheet.getCell(`${lastColumn}${fila}`).border = borderConfig;
      };
      
  
      // --- FILA 1 ---
      formatearFila(1, 'VIDELCA LTDA. VIGILANCIA DEL CARIBE LIMITADA', 'left');
      worksheet.getCell('A1').font = { bold: true };
  
      // --- FILA 2 ---
      formatearFila(2, 'MODELO PARA LA IMPORTACION DE DOCUMENTO EXTRACONTABLE', 'center');
      worksheet.getCell('A2').font = { bold: true, size: 18 };
  
      // --- FILA 3 ---
      formatearFila(
        3,
        `De: ${mesInicio} ${diaInicio}/${añoInicio}  A: ${mesFin} ${diaFin}/${añoFin}`,
        'center',
      );

      worksheet.getCell('A3').font = { bold: true };
  
      // --- FILA 4 (vacía) ---
      worksheet.mergeCells(`A4:${lastColumn}4`);

      // --- FILA 5 (encabezados de columnas reales) ---
      const headerRow = worksheet.getRow(5);
      
      // Lista completa de columnas hasta AX:
      const headers = [
        'TIPO DE DOCUMENTO (OBLIGATORIO)',
        'CÓDIGO DOCUMENTO (OBLIGATORIO)',
        'NÚMERO DE DOCUMENTO (OBLIGATORIO)',
        'AÑO DEL DOCUMENTO',
        'MES DEL DOCUMENTO',
        'DÍA DEL DOCUMENTO',
        'AÑO PACTADO DE ENTREGA',
        'MES PACTADO DE ENTREGA',
        'DÍA PACTADO DE ENTREGA',
        'CÓDIGO DEL VENDEDOR',
        'CÓDIGO DE LA CIUDAD',
        'CÓDIGO DE LA ZONA',
        'SECUENCIA',
        'CENTRO DE COSTO',
        'SUBCENTRO DE COSTO',
        'NIT',
        'SUCURSAL',
        'DESCRIPCIÓN DE LA SECUENCIA',
        'FORMA DE PAGO',
        'PORCENTAJE DEL IMPOCONSUMO',
        'VALOR DEL IMPOCONSUMO',
        'PORCENTAJE DEL IMPODEPORTE',
        'VALOR DEL IMPODEPORTE',
        'PORCENTAJE DESCUENTO 1',
        'VALOR DESCUENTO 1',
        'PORCENTAJE DESCUENTO 2',
        'VALOR DESCUENTO 2',
        'PORCENTAJE DESCUENTO 3',
        'VALOR DESCUENTO 3',
        'PORCENTAJE CARGO 1',
        'VALOR CARGO 1',
        'PORCENTAJE CARGO 2',
        'VALOR CARGO 2',
        'PORCENTAJE CARGO 3',
        'VALOR CARGO 3',
        'LÍNEA PRODUCTO',
        'GRUPO PRODUCTO',
        'CÓDIGO PRODUCTO',
        'CANTIDAD',
        'VALOR DE LA SECUENCIA',
        'CÓDIGO DE LA BODEGA',
        'CÓDIGO DE LA UBICACIÓN',
        'CANTIDAD DE FACTOR DE CONVERSIÓN',
        'OPERADOR DE FACTOR DE CONVERSIÓN',
        'VALOR DEL FACTOR DE CONVERSIÓN',
        'SEGUNDA CANTIDAD',
        'CANTIDAD ENTREGADA',
        'VALOR DE CANTIDAD ENTREGADA',
        'DESCRIPCIÓN DE COMENTARIOS',
        'DESCRIPCIÓN LARGA',
      ];
      
      // Configurar cada celda de la fila 5
      // 🔹 Define el estilo de borde reutilizable
      const defaultBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: bordeColor } },
        bottom: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: bordeColor } },
        left: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: bordeColor } },
        right: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: bordeColor } },
        diagonal: { up: false, down: false, style: undefined },
      };
      
      // 🔹 Configurar cada celda de la fila 5
      headers.forEach((text, i) => {
        const cell = headerRow.getCell(i + 1);
      
        // Texto del encabezado
        cell.value = text;
      
        // Fuente
        cell.font = { bold: true };
      
        // Alineación
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      
        // Color de fondo
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: azulFondo },
        };
      
        // Bordes
        cell.border = defaultBorder;
      });
      
      // Ajustar alto de fila (por si los textos son largos)
      worksheet.getRow(5).height = 30;
      
      // Ajustar ancho de columnas dinámicamente (opcional)
      headers.forEach((header, i) => {
        const adjustedWidth = header.length * 1.2; // 1.2 da margen visual
        worksheet.getColumn(i + 1).width = adjustedWidth < 15 ? 15 : adjustedWidth;
      });

      // --- FILA 6 en adelante (data de excel) ---


      // Ajustar alto de filas principales
      worksheet.getRow(1).height = 20;
      worksheet.getRow(2).height = 22;
      worksheet.getRow(3).height = 18;
      worksheet.getRow(5).height = 18;
  
      // 👇 Generar buffer
      const excelUint8 = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(excelUint8); // 👈 Conversión a Node Buffer
  
      return excelBuffer;
      
    } catch (error) {

      throw error;
      
    }

  }

}