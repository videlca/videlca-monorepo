import { Injectable, Logger } from '@nestjs/common';
import { TDocumentDefinitions, Content, ContentTable, TableCell } from 'pdfmake/interfaces';

import { PrinterService } from '../../common/services';

import { OrdenServicio, OrdenServicioDetalle } from '../../orden-servicio/entities';
import { OrigenServicioEnum } from '../../orden-servicio/interfaces/origen-servicio.interface';

import { PALETTE, ReportePdfVidelcaBase } from './reporte-pdf-videlca.base';

const ESTADO_COLOR: Record<string, string> = {
  'programado': '#6366F1',
  'por iniciar': '#F59E0B',
  'iniciado': '#10B981',
  'por terminar': '#FB923C',
  'terminado': '#64748B',
  'cancelada': '#F43F5E',
  'anulada': '#DC2626',
};

@Injectable()
export class ReporteOrdenServicioService extends ReportePdfVidelcaBase {

  private readonly logger = new Logger('ReporteOrdenServicioService');

  constructor(
    private readonly printer: PrinterService,
  ) {
    super();
  }

  private colorEstado(nombreEstado: string): string {

    return ESTADO_COLOR[nombreEstado?.toLowerCase()] ?? PALETTE.textMuted;

  }

  // Nota: fillColor en un nodo dentro de un "stack" no lo respeta pdfmake de forma confiable al renderizar
  // (probado: una mini tabla anidada dentro del stack tampoco pinta el fondo). Por eso el estado se muestra
  // como texto en el color del estado (mismo patron que "Dominical/Festivo" en el desglose por horas), sin pastilla de fondo
  private textoEstado(texto: string, color: string): Content {

    return { text: texto.toUpperCase(), color, bold: true, fontSize: 12, margin: [0, 3, 0, 0] };

  }

  // ===================================================================
  // SECCIONES
  // ===================================================================

  private buildHeader(ordenServicio: OrdenServicio): Content[] {

    return this.buildEncabezado('ORDEN DE SERVICIO\nVIGILANCIA FÍSICA Y ELECTRÓNICA', [
      { label: 'CÓDIGO', value: ordenServicio.ordenServicioId.descripcionId },
      { label: 'ORDEN N°', value: ordenServicio.ordenServicioId.consecutivo.toString() },
    ]);

  }

  private buildResumenFechas(ordenServicio: OrdenServicio): Content {

    const esIndefinida = !ordenServicio.fechaFin;
    const estado = ordenServicio.idEstadoOrdenServicio.nombre;

    const stat = (label: string, value: string): TableCell => ({
      stack: [
        { text: label.toUpperCase(), fontSize: 8, bold: true, color: PALETTE.textMuted },
        { text: value, fontSize: 11, bold: true, color: PALETTE.textDark, margin: [0, 3, 0, 0] },
      ],
      fillColor: '#F8FAFC',
      margin: [8, 8, 8, 8],
    });

    return {
      margin: [0, 0, 0, 16],
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [
            stat('Fecha creación', this.formatearFechaCorta(ordenServicio.fechaCreacion)),
            stat('Fecha inicio', this.formatearFechaCorta(ordenServicio.fechaInicioOrden)),
            stat('Fecha fin', esIndefinida ? 'Indefinida' : this.formatearFechaCorta(ordenServicio.fechaFinOrden)),
            {
              stack: [
                { text: 'ESTADO', fontSize: 8, bold: true, color: PALETTE.textMuted },
                this.textoEstado(estado, this.colorEstado(estado)),
              ],
              fillColor: '#F8FAFC',
              margin: [8, 8, 8, 8],
            },
          ],
        ],
      },
      layout: {
        fillColor: () => null,
        hLineColor: () => '#E2E8F0',
        vLineColor: () => '#E2E8F0',
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
    };

  }

  private buildCliente(ordenServicio: OrdenServicio): Content {

    // VIGILANCIA Y ESCOLTA: el cliente es el de la locacion asignada. MONITOREO DE ALARMAS: el cliente esta asignado
    // directamente a la orden (no tiene locacion)
    const cliente = ordenServicio.idLocacion ? ordenServicio.idLocacion.idCliente : ordenServicio.idCliente;

    return this.card(PALETTE.navy, ['50%', '50%'], 'Cliente', [
      [
        this.labelValue('Nombre', cliente.nombre),
        this.labelValue('Identificación', cliente.numeroIdentificacion),
      ],
      [
        this.labelValue('Tipo de cliente', cliente.idTipoCliente.descripcion),
        { text: '' },
      ],
    ]);

  }

  private buildPuesto(ordenServicio: OrdenServicio): Content {

    const locacion = ordenServicio.idLocacion;

    const filas: TableCell[][] = [
      [
        this.labelValue('Nombre', locacion.nombre),
        this.labelValue('Dirección', locacion.direccion),
      ],
      [
        this.labelValue('Teléfono', locacion.telefono),
        this.labelValue('Ciudad', locacion.idCiudad.descripcion),
      ],
      [
        { text: 'RESPONSABLE DEL PUESTO', colSpan: 2, bold: true, fontSize: 9.5, color: PALETTE.navy.accent, margin: [0, 6, 0, 4] },
        { text: '' },
      ],
      [
        this.labelValue('Nombre', `${locacion.primerNombreResponsable} ${locacion.primerApellidoResponsable}`),
        this.labelValue('Teléfono', locacion.telefono),
      ],
    ];

    if (locacion.correos && locacion.correos.length > 0) {

      filas.push([
        { text: 'CORREOS ASOCIADOS', colSpan: 2, bold: true, fontSize: 9.5, color: PALETTE.navy.accent, margin: [0, 6, 0, 4] },
        { text: '' },
      ]);

      for (const correo of locacion.correos) {

        filas.push([
          this.labelValue('Nombre', `${correo.nombre} ${correo.apellido}`),
          this.labelValue('Email', correo.email),
        ]);

      }

    }

    return this.card(PALETTE.navy, ['50%', '50%'], 'Puesto', filas);

  }

  private buildFacturacion(ordenServicio: OrdenServicio): Content {

    // VIGILANCIA Y ESCOLTA: el responsable de facturacion es el de la locacion (o el cliente de la locacion si no tiene
    // uno especifico). MONITOREO DE ALARMAS: no existe un responsable de facturacion aparte, es el mismo cliente de la orden
    const responsable = ordenServicio.idLocacion
      ? (ordenServicio.idLocacion.idClienteFacturacion ?? ordenServicio.idLocacion.idCliente)
      : ordenServicio.idCliente;

    return this.card(PALETTE.navy, ['50%', '50%'], 'Responsable de facturación', [
      [
        this.labelValue('Nombre', responsable.nombre),
        this.labelValue('Identificación', responsable.numeroIdentificacion),
      ],
    ]);

  }

  private buildServicios(ordenServicio: OrdenServicio): Content {

    // CATALOGO: cada fila del desglose es un servicio distinto del catalogo, se muestran uno por uno
    if (ordenServicio.origenServicio === OrigenServicioEnum.CATALOGO) {

      const filas: TableCell[][] = [
        [
          { text: 'SERVICIO', style: 'label' },
          { text: 'HORARIO', style: 'label' },
          { text: 'TARIFA', style: 'label' },
        ],
      ];

      ordenServicio.detalles.forEach((servicioOrden, index) => {

        const servicio = servicioOrden.idTarifa.idServicio;

        filas.push([
          { text: `${index + 1}. ${servicio.descripcion}\n`, bold: true, fontSize: 9.5, color: PALETTE.textDark,
            margin: [0, 4, 0, 0],
          },
          { text: `${servicioOrden.horaInicio} - ${servicioOrden.horaFin}`, margin: [0, 4, 0, 0] },
          { text: servicio.idTipoTarifa?.nombre ?? '-', margin: [0, 4, 0, 0] },
        ]);

        filas.push([
          { text: `Código: ${servicio.codigo}`, colSpan: 3, fontSize: 8, italics: true, color: PALETTE.textMuted, margin: [0, 0, 0, 4] },
          { text: '' }, { text: '' },
        ]);

      });

      return this.card(PALETTE.servicios, ['40%', '30%', '30%'], 'Servicios asociados', filas);

    }

    // A LA MEDIDA: es un unico servicio continuo, cada fila del desglose es un dia (no servicios distintos).
    // Se muestra un resumen: rango horario del primer y ultimo dia, y la cantidad de dias en total
    const detalles = ordenServicio.detalles;
    const primerDetalle = detalles[0];
    const ultimoDetalle = detalles[detalles.length - 1];

    const filas: TableCell[][] = [
      [
        { text: 'SERVICIO', style: 'label' },
        { text: 'HORARIO', style: 'label' },
        { text: 'DÍAS', style: 'label' },
      ],
      [
        { text: 'Servicio a la medida', bold: true, fontSize: 9.5, color: PALETTE.textDark, margin: [0, 4, 0, 4] },
        { text: primerDetalle ? `${primerDetalle.horaInicio} - ${ultimoDetalle.horaFin}` : '-', margin: [0, 4, 0, 4] },
        { text: detalles.length.toString(), margin: [0, 4, 0, 4] },
      ],
    ];

    return this.card(PALETTE.servicios, ['40%', '30%', '30%'], 'Servicios asociados', filas);

  }

  // ------------------ DESGLOSE DE PRECIO ------------------

  private buildMensajeOrdenIndefinida(): Content {

    return {
      margin: [0, 0, 0, 14],
      table: {
        widths: ['100%'],
        body: [
          [
            {
              text: 'Esta orden de servicio es indefinida (sin fecha de fin). El precio se calculará mes a mes al momento de realizar la liquidación.',
              italics: true,
              color: PALETTE.textDark,
              margin: [4, 6, 4, 6],
            },
          ],
        ],
      },
      layout: {
        fillColor: () => PALETTE.navy.tint,
        hLineColor: () => PALETTE.navy.accent,
        vLineColor: () => PALETTE.navy.accent,
        hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 2 : 0),
        vLineWidth: (i: number) => (i === 0 ? 2 : 0),
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
    };

  }

  private buildTablaPrecioServicio(servicioOrden: OrdenServicioDetalle): ContentTable {

    return this.buildTablaPrecio(servicioOrden);

  }

  // DESGLOSE DIA A DIA PARA ORDENES A LA MEDIDA: cada fila de OrdenServicioDetalle representa un dia completo
  // (costos directos ya combinan las horas diurnas/nocturnas de ese dia, ver calcularPrecioAMedida). No tienen un
  // campo fecha propio, se numeran secuencialmente en el orden en que fueron creadas (orden cronologico)
  private buildTablaDesgloseDias(detalles: OrdenServicioDetalle[]): ContentTable {

    const filas = detalles.map((detalle, index) => ([
      { text: `Día ${index + 1}`, fontSize: 7.5 },
      { text: `${detalle.horaInicio} - ${detalle.horaFin}`, fontSize: 7.5 },
      { text: detalle.cantidadHoras != null ? detalle.cantidadHoras.toString() : '-', fontSize: 7.5, alignment: 'center' },
      { text: this.formatearMoneda(detalle.costosDirectos), fontSize: 7.5 },
      { text: this.formatearMoneda(detalle.seguroVida), fontSize: 7.5 },
      { text: this.formatearMoneda(detalle.aui), fontSize: 7.5 },
      { text: this.formatearMoneda(detalle.precio), fontSize: 7.5, bold: true, color: PALETTE.navy.accent },
    ]));

    return {
      margin: [0, 2, 0, 8],
      table: {
        headerRows: 1,
        widths: ['12%', '18%', '10%', '16%', '16%', '13%', '15%'],
        body: [
          [
            { text: 'DÍA', style: 'miniLabel', fontSize: 7 },
            { text: 'HORARIO', style: 'miniLabel', fontSize: 7 },
            { text: 'HORAS', style: 'miniLabel', fontSize: 7 },
            { text: 'C. DIRECTOS', style: 'miniLabel', fontSize: 7 },
            { text: 'SEGURO VIDA', style: 'miniLabel', fontSize: 7 },
            { text: 'AUI', style: 'miniLabel', fontSize: 7 },
            { text: 'TOTAL', style: 'miniLabel', fontSize: 7 },
          ],
          ...filas,
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? PALETTE.costosHoras.accent : (rowIndex % 2 === 0 ? PALETTE.costosHoras.tint : null)),
        hLineColor: () => '#E2E8F0',
        vLineColor: () => '#E2E8F0',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    };

  }

  private buildDesglosePrecios(ordenServicio: OrdenServicio): Content[] {

    const contenido: Content[] = [];

    contenido.push(this.buildTituloSeccion('Desglose de precio'));

    if (!ordenServicio.fechaFin) {

      contenido.push(this.buildMensajeOrdenIndefinida());

      return contenido;

    }

    if (ordenServicio.origenServicio === OrigenServicioEnum.CATALOGO) {

      // CATALOGO: cada fila del desglose es un servicio distinto, se muestra su propia tabla de precio
      for (const servicioOrden of ordenServicio.detalles) {

        contenido.push({
          text: servicioOrden.idTarifa.idServicio.descripcion,
          bold: true,
          fontSize: 10,
          color: PALETTE.textDark,
          margin: [0, 6, 0, 0],
        });

        contenido.push(this.buildTablaPrecioServicio(servicioOrden));

      }

    } else {

      // A LA MEDIDA: es un unico servicio continuo, se muestra el desglose dia a dia (cada fila = un dia)
      contenido.push({
        text: 'Servicio a la medida',
        bold: true,
        fontSize: 10,
        color: PALETTE.textDark,
        margin: [0, 6, 0, 0],
      });

      contenido.push({
        text: 'Desglose por día',
        fontSize: 8.5,
        italics: true,
        color: PALETTE.textMuted,
        margin: [0, 2, 0, 2],
      });

      contenido.push(this.buildTablaDesgloseDias(ordenServicio.detalles));

    }

    contenido.push(this.buildBarraTotal('TOTAL ORDEN DE SERVICIO', ordenServicio.precioTotal));

    return contenido;

  }

  // ===================================================================
  // DOCUMENTO
  // ===================================================================

  private generateOrdenServicioReporte(ordenServicio: OrdenServicio): TDocumentDefinitions {


    const docDefinition: TDocumentDefinitions = this.documentoBase([
      ...this.buildHeader(ordenServicio),
      this.buildResumenFechas(ordenServicio),
      this.buildCliente(ordenServicio),
      // "Puesto" solo aplica a ordenes de vigilancia y escolta (con locacion); monitoreo de alarmas ya muestra el cliente arriba
      ...(ordenServicio.idLocacion ? [this.buildPuesto(ordenServicio)] : []),
      this.buildFacturacion(ordenServicio),
      this.buildServicios(ordenServicio),
      ...this.buildDesglosePrecios(ordenServicio),
    ]);

    return docDefinition;

  }

  getReporteOrdenServicio(ordenServicio: OrdenServicio) {

    const docDefinition = this.generateOrdenServicioReporte(ordenServicio);

    return this.printer.createPdf(docDefinition);

  }

  async getBufferReporteOrdenServicio(ordenServicio: OrdenServicio) {

    const docDefinition = this.generateOrdenServicioReporte(ordenServicio);

    return await this.printer.generatePdf(docDefinition);

  }

}
