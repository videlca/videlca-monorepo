import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import { LiquidacionClienteAgrupado } from '../../liquidaciones/interfaces/liquidacion.interface';

@Injectable()
export class ReporteLiquidacionService {

  private readonly logger = new Logger('ReporteLiquidacionService');
          
  constructor() {}

  async generateExcel(clientesAgrupados: LiquidacionClienteAgrupado[]) {

    try {

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('liquidacion');

      // --- Fila 1 vacía ---
      sheet.addRow([]);
  
      // --- Fila 2 ---
      // Unir las columnas solicitadas
      sheet.mergeCells('A2:J2'); // Bloque 1
      sheet.mergeCells('L2:P2'); // Bloque 2
      sheet.mergeCells('R2:Y2'); // Bloque 3
  
      // Asignar valores a las celdas unidas
      sheet.getCell('A2').value = 'PARTE 1 A MOSTRAR EN EL ANEXO';
      sheet.getCell('L2').value = 'CALCULO DE LA LIQUIDACION';
      sheet.getCell('R2').value = 'PARTE 2 A MOSTRAR EN EL ANEXO';
  
      // Definir estilo común
      const estiloVerde = {
        font: { bold: true },
        alignment: { vertical: 'middle', horizontal: 'center' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '84E291' }, // Verde
        },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      };
  
      // 🔹 Función para convertir letra de columna a número (A → 1, B → 2, ..., AA → 27)
      const letraAColumna = (letra: string): number => {
        let col = 0;
        for (let i = 0; i < letra.length; i++) {
          col = col * 26 + (letra.charCodeAt(i) - 64);
        }
        return col;
      };
  
      // 🔹 Función para aplicar estilo a un rango
      const aplicarEstiloARango = (rango: string, estilo: any) => {
        const [inicio, fin] = rango.split(':');
  
        // Extraer letras (columna) y números (fila)
        const matchInicio = inicio.match(/([A-Z]+)(\d+)/);
        const matchFin = fin.match(/([A-Z]+)(\d+)/);
  
        if (!matchInicio || !matchFin) return;
  
        const startCol = letraAColumna(matchInicio[1]);
        const startRow = parseInt(matchInicio[2]);
        const endCol = letraAColumna(matchFin[1]);
        const endRow = parseInt(matchFin[2]);
  
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cell = sheet.getRow(row).getCell(col);
            Object.assign(cell, estilo);
          }
        }
      };
  
      // Aplicar estilos a los bloques unidos
      aplicarEstiloARango('A2:J2', estiloVerde);
      aplicarEstiloARango('L2:P2', estiloVerde);
      aplicarEstiloARango('R2:Y2', estiloVerde);
  
      // Ajustar altura de la fila
      sheet.getRow(2).height = 25;

      for (const clienteData of clientesAgrupados) {

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

        // 🔹 Cabecera de columnas
        const header = [
          'Cliente', // A
          'NIT', // B
          'Orden Servicio', // C
          'Sector', // D
          'Ciudad', // E
          'Puesto', // F
          'Servicio Descrito x Videlca', // G
          'Tipo Servicio', // H
          'Codigo Servicio En SIIGO', // I
          'Horario Servicio', // J
          '', // K
          'Horas Tot Servicio', // L
          'Tarifa Costos Directos', // M
          'Vr Hora', // N
          'Cant Horas Prestadas', // O
          'Vr Liquidado x Videlca', // P
          '', // Q
          'Cantidad Órdenes a Facturar', // R
          'Vr a Liquidar en Aplicacion', // S
          '(+) seguro de vida', // T
          '(+) Aui', // U
          'Tarifa antes de iva', // V
          '(+) Iva Aui', // X
          'Tarifa con Iva' // Y
        ];
  
        const headerRow = sheet.addRow(header);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.eachCell((cell) => {
          cell.font = { bold: true }; // 👈 texto en negrita
          cell.border = {
            bottom: { style: 'thin' },
          };
        });

        // 🔹 Filas de servicios
        for (const servicio of servicios) {
        
          const row = sheet.addRow([
            cliente, // A
            Number(numeroId), // B
            servicio.ordenServicio, // C
            servicio.sector, // D
            servicio.ciudad, // E
            servicio.puesto, // F
            servicio.descripcionServicio, // G
            servicio.tipoServicio, // H
            servicio.codigoServicioSiigo, // I
            servicio.horarioServicio, // J
            "", // K
            servicio.horasTotalesServicio, // L
            servicio.tarifaCostosDirectos, // M
            servicio.valorHora, // N
            servicio.cantidadHorasPrestadas, // O 
            servicio.valorLiquidadoVidelca, // P
            "", // Q
            servicio.cantidadOrdenesFacturar, // R
            servicio.valorLiquidarAplicacion, // S
            servicio.seguroVida, // T
            servicio.aui, // U
            servicio.tarifaAntesIva, // V
            servicio.auiIVa, // X
            servicio.tarifaConIva // Y
          ]);
    
          // 🔹 Alinear columnas específicas
          row.getCell(1).alignment = { horizontal: 'center' }; // A
          row.getCell(2).alignment = { horizontal: 'right' };  // B
          row.getCell(3).alignment = { horizontal: 'center' }; // C
          row.getCell(4).alignment = { horizontal: 'center' }; // D
          row.getCell(5).alignment = { horizontal: 'center' }; // E
          row.getCell(6).alignment = { horizontal: 'left' }; // F
          row.getCell(7).alignment = { horizontal: 'left' }; // G
          row.getCell(8).alignment = { horizontal: 'center' }; // H
          row.getCell(9).alignment = { horizontal: 'center' }; // I
          row.getCell(10).alignment = { horizontal: 'center' }; // J
          // K
          row.getCell(12).alignment = { horizontal: 'left' }; // L 
          row.getCell(13).alignment = { horizontal: 'right' }; // M
          row.getCell(14).alignment = { horizontal: 'right' }; // N
          row.getCell(15).alignment = { horizontal: 'center' }; // O
          row.getCell(16).alignment = { horizontal: 'right' }; // P
          // Q
          row.getCell(18).alignment = { horizontal: 'center' }; // R
          row.getCell(19).alignment = { horizontal: 'right' }; // S
          row.getCell(20).alignment = { horizontal: 'right' }; // T
          row.getCell(21).alignment = { horizontal: 'right' }; // U
          row.getCell(22).alignment = { horizontal: 'right' }; // V
          row.getCell(23).alignment = { horizontal: 'right' }; // X
          row.getCell(24).alignment = { horizontal: 'right' }; // Y

          row.eachCell((cell, colNumber) => {

            cell.border = {
              bottom: { style: 'thin' },
            };

            const columnasTotales = [19, 20, 21, 22, 23, 24];

            const columnaId = [2];

            if (columnasTotales.includes(colNumber)) {
              cell.numFmt = '#,##0.00'; // separador de miles y dos decimales
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            } else if (columnaId.includes(colNumber)){
              cell.numFmt = '#,##0';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }

          });

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
          '',
          '',
          '',
          '',
          '',
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

        totalRow.getCell(18).alignment = { horizontal: 'center' }; // R
        totalRow.getCell(19).alignment = { horizontal: 'right' }; // S
        totalRow.getCell(20).alignment = { horizontal: 'right' }; // T
        totalRow.getCell(21).alignment = { horizontal: 'right' }; // U
        totalRow.getCell(22).alignment = { horizontal: 'right' }; // V
        totalRow.getCell(23).alignment = { horizontal: 'right' }; // X
        totalRow.getCell(24).alignment = { horizontal: 'right' }; // Y
  
        totalRow.font = { bold: true };
        totalRow.eachCell((cell, colNumber) => {
          cell.font = { bold: true }; // 👈 texto en negrita
          cell.border = {
            bottom: { style: 'thin' },
          };
          
          const columnasTotales = [19, 20, 21, 22, 23, 24];

          if (columnasTotales.includes(colNumber)) {
            cell.numFmt = '#,##0.00'; // separador de miles y dos decimales
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          
        });

        sheet.addRow([]);
        sheet.addRow([]);

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
