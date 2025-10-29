import { Injectable, Logger} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';

import { ClienteAgrupado } from '../../liquidaciones/interfaces/consolidacion.interface';
import { LiquidacionClienteAgrupado } from '../../liquidaciones/interfaces/liquidacion.interface';

@Injectable()
export class ReporteAnexoFacturacionService {

  private readonly logger = new Logger('ReporteAnexoFacturacionService');
          
  constructor() {}

  async generateExcel(clienteAgrupado: ClienteAgrupado, liquidacionClienteAgrupado: LiquidacionClienteAgrupado, numeroCliente: number) {

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

        const row = consolidacionSheet.addRow([
          cliente,
          Number(numeroId), // 2
          numeroCliente,
          servicio.tipoServicio,
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
      
      // #################
      // LIQUIDACION SHEET
      // #################
      
      // --- Fila 1 vacía ---
      liquidacionSheet.addRow([]);
  
      // --- Fila 2 ---
      // Unir las columnas solicitadas
      liquidacionSheet.mergeCells('A2:J2'); // Bloque 1
      liquidacionSheet.mergeCells('L2:R2'); // Bloque 2
  
      // Asignar valores a las celdas unidas
      liquidacionSheet.getCell('A2').value = 'PARTE 1 A MOSTRAR EN EL ANEXO';
      liquidacionSheet.getCell('L2').value = 'PARTE 2 A MOSTRAR EN EL ANEXO';
  
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
            const cell = liquidacionSheet.getRow(row).getCell(col);
            Object.assign(cell, estilo);
          }
        }
      };
  
      // Aplicar estilos a los bloques unidos
      aplicarEstiloARango('A2:J2', estiloVerde);
      aplicarEstiloARango('L2:R2', estiloVerde);
  
      // Ajustar altura de la fila
      liquidacionSheet.getRow(2).height = 25;

      const { 
        cliente: clienteLiq, 
        numeroId: numeroIdLiq, 
        servicios: serviciosLiq, 
        totalLiquidarAplicacion: totalLiquidarAplicacionLiq,
        totalSeguroVida: totalSeguroVidaLiq,
        totalAui: totalAuiLiq,
        totalTarifaAntesIva: totalTarifaAntesIvaLiq,
        totalIvaAui: totalIvaAuiLiq,
        totalTarifaConIva: totalTarifaConIvaLiq 
      } = liquidacionClienteAgrupado;

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
        'Cantidad Órdenes a Facturar', // L
        'Vr a Liquidar en Aplicacion', // M
        '(+) seguro de vida', // N
        '(+) Aui', // O
        'Tarifa antes de iva', // P
        '(+) Iva Aui', // Q
        'Tarifa con Iva' // R
      ];
  
      const headerRow = liquidacionSheet.addRow(header);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center' };
      headerRow.eachCell((cell) => {
        cell.font = { bold: true }; // 👈 texto en negrita
        cell.border = {
          bottom: { style: 'thin' },
        };
      });

      // 🔹 Filas de servicios
      for (const servicio of serviciosLiq) {
      
        const row = liquidacionSheet.addRow([
          clienteLiq, // A
          Number(numeroIdLiq), // B
          servicio.ordenServicio, // C
          servicio.sector, // D
          servicio.ciudad, // E
          servicio.puesto, // F
          servicio.descripcionServicio, // G
          servicio.tipoServicio, // H
          servicio.codigoServicioSiigo, // I
          servicio.horarioServicio, // J
          "", // K
          servicio.cantidadOrdenesFacturar, // L
          servicio.valorLiquidarAplicacion, // M
          servicio.seguroVida, // N
          servicio.aui, // O
          servicio.tarifaAntesIva, // P
          servicio.auiIVa, // Q
          servicio.tarifaConIva // R
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
        row.getCell(12).alignment = { horizontal: 'center' }; // L
        row.getCell(13).alignment = { horizontal: 'right' }; // M
        row.getCell(14).alignment = { horizontal: 'right' }; // N
        row.getCell(15).alignment = { horizontal: 'right' }; // O
        row.getCell(16).alignment = { horizontal: 'right' }; // P
        row.getCell(17).alignment = { horizontal: 'right' }; // Q
        row.getCell(18).alignment = { horizontal: 'right' }; // R

        row.eachCell((cell, colNumber) => {

          cell.border = {
            bottom: { style: 'thin' },
          };

          const columnasTotales = [13, 14, 15, 16, 17, 18];

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
      const totalRowLiq = liquidacionSheet.addRow([
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
        totalLiquidarAplicacionLiq,
        totalSeguroVidaLiq,
        totalAuiLiq,
        totalTarifaAntesIvaLiq,
        totalIvaAuiLiq,
        totalTarifaConIvaLiq
      ]);

      totalRowLiq.getCell(12).alignment = { horizontal: 'center' }; // L
      totalRowLiq.getCell(13).alignment = { horizontal: 'right' }; // M
      totalRowLiq.getCell(14).alignment = { horizontal: 'right' }; // N
      totalRowLiq.getCell(15).alignment = { horizontal: 'right' }; // O
      totalRowLiq.getCell(16).alignment = { horizontal: 'right' }; // P
      totalRowLiq.getCell(17).alignment = { horizontal: 'right' }; // Q
      totalRowLiq.getCell(18).alignment = { horizontal: 'right' }; // R

      totalRowLiq.font = { bold: true };
      totalRowLiq.eachCell((cell, colNumber) => {
        cell.font = { bold: true }; // 👈 texto en negrita
        cell.border = {
          bottom: { style: 'thin' },
        };
        
        const columnasTotales = [13, 14, 15, 16, 17, 18];

        if (columnasTotales.includes(colNumber)) {
          cell.numFmt = '#,##0.00'; // separador de miles y dos decimales
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        
      });    

      // 🔹 Ajustar ancho de columnas automáticamente
      liquidacionSheet.columns.forEach((col) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, value.length);
        });
        col.width = maxLength + 2;
      });

      // #################
      // LIQUIDACION SHEET
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
    liquidacionClientesAgrupados: LiquidacionClienteAgrupado[],
    mesLiq: string = "1", 
    anioLiq: string = "2025",
    numeroPedido: number = 0
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

        let numeroCliente = numeroPedido - 1;

        // Generar Excels uno por uno y agregarlos al ZIP
        for (const cliente of clientesAgrupados) {

          const liquidacionCliente = liquidacionClientesAgrupados.find(lc => lc.id === cliente.id);

          numeroCliente += 1;
          
          const excelBuffer = await this.generateExcel(cliente, liquidacionCliente, numeroCliente);
          archive.append(excelBuffer, { name: `PED-${numeroCliente} ${cliente.cliente}_mes_${mesLiq}_anio_${anioLiq}.xlsx` });
        
        }

        await archive.finalize();
      
      } catch (err) {
      
        this.logger.error('Error generando ZIP', err);
        reject(err);
      
      }
    
    });
  
  }

}
