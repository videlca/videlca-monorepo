import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Cliente } from '../../clientes/entities/cliente.entity';

@Injectable()
export class ReporteClientesPuestosService {
    
  private readonly logger = new Logger(ReporteClientesPuestosService.name);

  async generateExcel(clientes: Cliente[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Sistema';
    workbook.created = new Date();

    const resumenSheet = workbook.addWorksheet('Resumen');
    const clientesSheet = workbook.addWorksheet('Clientes');
    const puestosSheet = workbook.addWorksheet('Puestos');

    this.buildResumenSheet(resumenSheet, clientes);
    this.buildClientesSheet(clientesSheet, clientes);
    this.buildPuestosSheet(puestosSheet, clientes);

    [resumenSheet, clientesSheet, puestosSheet].forEach((sheet) => {
      this.autoFitColumns(sheet);
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });

    const excelUint8 = await workbook.xlsx.writeBuffer();
    return Buffer.from(excelUint8);
  }

  private buildResumenSheet(sheet: ExcelJS.Worksheet, clientes: Cliente[]) {
    sheet.columns = [
      { header: 'Cliente', key: 'cliente' },
      { header: 'NIT / Identificación', key: 'identificacion' },
      { header: 'Tipo Cliente', key: 'tipoCliente' },
      { header: 'Segmentación', key: 'segmentacion' },
      { header: 'Subsegmentación', key: 'subSegmentacion' },
      { header: 'Total Puestos', key: 'totalPuestos' },
      { header: 'Estado', key: 'estado' },
    ];

    clientes.forEach((cliente) => {
      sheet.addRow({
        cliente: cliente.nombre,
        identificacion: cliente.numeroIdentificacion,
        tipoCliente: cliente.idTipoCliente?.['descripcion'] ?? '',
        segmentacion: cliente.idSubSegmentacion?.segmentacion?.descripcion ?? '',
        subSegmentacion: cliente.idSubSegmentacion?.descripcion ?? '',
        totalPuestos: cliente.locaciones?.length ?? 0,
        estado: cliente.estado ? 'Activo' : 'Inactivo',
      });
    });

    this.applyHeaderStyle(sheet);
  }

  private buildClientesSheet(sheet: ExcelJS.Worksheet, clientes: Cliente[]) {
    sheet.columns = [
      { header: 'ID Cliente', key: 'idCliente' },
      { header: 'Tipo Identificación', key: 'tipoIdentificacion' },
      { header: 'Número Identificación', key: 'numeroIdentificacion' },
      { header: 'Nombre Cliente', key: 'nombre' },
      { header: 'Tipo Cliente', key: 'tipoCliente' },
      { header: 'Segmentación', key: 'segmentacion' },
      { header: 'Subsegmentación', key: 'subSegmentacion' },
      { header: 'Estado', key: 'estado' },
    ];

    clientes.forEach((cliente) => {
      sheet.addRow({
        idCliente: cliente.idCliente,
        tipoIdentificacion: cliente.idTipoIdentificacion?.['descripcion'] ?? '',
        numeroIdentificacion: cliente.numeroIdentificacion,
        nombre: cliente.nombre,
        tipoCliente: cliente.idTipoCliente?.['descripcion'] ?? '',
        segmentacion: cliente.idSubSegmentacion?.segmentacion?.descripcion ?? '',
        subSegmentacion: cliente.idSubSegmentacion?.descripcion ?? '',
        estado: cliente.estado ? 'Activo' : 'Inactivo',
      });
    });

    this.applyHeaderStyle(sheet);
  }

  private buildPuestosSheet(sheet: ExcelJS.Worksheet, clientes: Cliente[]) {
    sheet.columns = [
      { header: 'Cliente', key: 'cliente' },
      { header: 'Identificación Cliente', key: 'identificacionCliente' },
      { header: 'ID Puesto', key: 'idLocacion' },
      { header: 'Puesto / Locación', key: 'puesto' },
      { header: 'Ciudad', key: 'ciudad' },
      { header: 'Dirección', key: 'direccion' },
      { header: 'Latitud', key: 'latitud' },
      { header: 'Longitud', key: 'longitud' },
      { header: 'Responsable Puesto', key: 'responsablePuesto' },
      { header: 'Teléfono', key: 'telefono' },
      { header: 'Segundo Teléfono', key: 'segundoTelefono' },
      { header: 'Días Anticipación Notificación', key: 'diasAnticipacion' },
      { header: 'Responsable Facturación', key: 'responsableFacturacion' },
      { header: 'Estado Puesto', key: 'estadoPuesto' },
    ];

    clientes.forEach((cliente) => {
      cliente.locaciones?.forEach((locacion) => {
        sheet.addRow({
          cliente: cliente.nombre,
          identificacionCliente: cliente.numeroIdentificacion,
          idLocacion: locacion.idLocacion,
          puesto: locacion.nombre,
          ciudad: locacion.idCiudad?.['descripcion'] ?? '',
          direccion: locacion.direccion,
          latitud: locacion.latitud,
          longitud: locacion.longitud,
          responsablePuesto: `${locacion.primerNombreResponsable} ${locacion.primerApellidoResponsable}`,
          telefono: locacion.telefono,
          segundoTelefono: locacion.segundoTelefono ?? '',
          diasAnticipacion: locacion.diasAnticipaticionNotificacion,
          responsableFacturacion: locacion.idClienteFacturacion?.nombre ?? cliente.nombre,
          estadoPuesto: locacion.estado ? 'Activo' : 'Inactivo',
        });
      });
    });

    this.applyHeaderStyle(sheet);
  }

  private applyHeaderStyle(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);

    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F4E78' },
      };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    sheet.autoFilter = {
      from: 'A1',
      to: `${sheet.getColumn(sheet.columnCount).letter}1`,
    };
  }

  private autoFitColumns(sheet: ExcelJS.Worksheet) {
    sheet.columns.forEach((column) => {
      let maxLength = 12;

      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, value.length);
      });

      column.width = maxLength + 3;
    });
  }
}