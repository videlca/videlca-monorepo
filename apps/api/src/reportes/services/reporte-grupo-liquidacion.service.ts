import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions, Content, ContentTable, TableCell } from 'pdfmake/interfaces';

import { PrinterService } from '../../common/services';

import { GrupoLiquidacionPdf, OrdenLiquidadaPdf, AdicionalLiquidadoPdf } from '../../liquidaciones/interfaces/grupo-liquidacion-pdf.interface';

import { PALETTE, ReportePdfVidelcaBase } from './reporte-pdf-videlca.base';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// PDF DE UN GRUPO DE LIQUIDACION (la "factura" de un cliente): mismo estilo que el PDF de la orden de servicio, pero
// sin puesto; muestra los datos del cliente y el desglose de lo liquidado en el grupo, orden por orden y servicio por
// servicio, con los precios ya calculados en la liquidacion (no se recalcula nada)
@Injectable()
export class ReporteGrupoLiquidacionService extends ReportePdfVidelcaBase {

  constructor(
    private readonly printer: PrinterService,
  ) {
    super();
  }

  // ===================================================================
  // SECCIONES
  // ===================================================================

  private buildResumen(grupo: GrupoLiquidacionPdf): Content {

    const stat = (label: string, value: string, color: string = PALETTE.textDark): TableCell => ({
      stack: [
        { text: label.toUpperCase(), fontSize: 8, bold: true, color: PALETTE.textMuted },
        { text: value, fontSize: 11, bold: true, color, margin: [0, 3, 0, 0] },
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
            stat('Fecha generación', this.formatearFechaCorta(grupo.fechaCreacion)),
            stat('Mes facturado', `${MESES[grupo.mes - 1]} ${grupo.anio}`),
            stat('Órdenes / adicionales', `${grupo.ordenes.length} / ${grupo.adicionales.length}`),
            grupo.aprobado
              ? stat('Estado', 'APROBADO', '#10B981')
              : stat('Estado', 'PENDIENTE', '#F59E0B'),
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

  private buildCliente(grupo: GrupoLiquidacionPdf): Content {

    const cliente = grupo.cliente;

    const identificacion = cliente.idTipoIdentificacion?.descripcion
      ? `${cliente.idTipoIdentificacion.descripcion} ${cliente.numeroIdentificacion}`
      : cliente.numeroIdentificacion;

    return this.card(PALETTE.navy, ['50%', '50%'], 'Cliente', [
      [
        this.labelValue('Nombre', cliente.nombre),
        this.labelValue('Identificación', identificacion),
      ],
      [
        this.labelValue('Tipo de cliente', cliente.idTipoCliente?.descripcion),
        this.labelValue('Segmentación', cliente.idSubSegmentacion?.descripcion),
      ],
    ]);

  }

  // UNA ORDEN LIQUIDADA: tarjeta en azul claro con el tipo de servicio y el periodo liquidado, y por cada servicio su
  // nombre, horario, tipo de tarifa y la mini tabla de precio; al final el subtotal de la orden
  private buildOrden(orden: OrdenLiquidadaPdf): Content {

    const filas: TableCell[][] = [
      [
        this.labelValue('Tipo de servicio', orden.tipoServicio),
        this.labelValue('Periodo liquidado', `${this.formatearFechaCorta(orden.desde)} - ${this.formatearFechaCorta(orden.hasta)}`),
      ],
    ];

    orden.servicios.forEach((servicio, index) => {

      filas.push([
        {
          stack: [
            { text: `${index + 1}. ${servicio.descripcion}`, bold: true, fontSize: 9.5, color: PALETTE.textDark },
            {
              text: [
                servicio.codigo ? `Código: ${servicio.codigo}` : null,
                servicio.horario ? `Horario: ${servicio.horario}` : null,
                servicio.tipoTarifa ? `Tarifa: ${servicio.tipoTarifa}` : null,
              ].filter(Boolean).join('   ·   '),
              fontSize: 8,
              italics: true,
              color: PALETTE.textMuted,
              margin: [0, 2, 0, 0],
            },
            this.buildTablaPrecio(servicio),
          ],
          colSpan: 2,
          margin: [0, 4, 0, 0],
        },
        { text: '' },
      ]);

    });

    filas.push([
      { text: `SUBTOTAL ${orden.codigo}`, bold: true, fontSize: 9.5, color: PALETTE.servicios.accent, margin: [0, 2, 0, 2] },
      { text: this.formatearMoneda(orden.total), bold: true, fontSize: 10.5, color: PALETTE.navy.accent, alignment: 'right', margin: [0, 2, 0, 2] },
    ]);

    return this.cardSinCortarFilas(this.card(PALETTE.servicios, ['50%', '50%'], `Orden ${orden.codigo}  ·  Mes ${orden.mesLiquidado}`, filas));

  }

  private buildAdicionales(adicionales: AdicionalLiquidadoPdf[]): Content {

    const filas: TableCell[][] = adicionales.map((adicional, index) => ([
      {
        stack: [
          { text: `${index + 1}. ${adicional.nombre}`, bold: true, fontSize: 9.5, color: PALETTE.textDark },
          { text: `Mes ${adicional.mesLiquidado}`, fontSize: 8, italics: true, color: PALETTE.textMuted, margin: [0, 2, 0, 0] },
          this.buildTablaPrecio(adicional),
        ],
        margin: [0, 4, 0, 0],
      },
    ]));

    return this.cardSinCortarFilas(this.card(PALETTE.servicios, ['100%'], 'Adicionales', filas));

  }

  // EVITA QUE UNA FILA DE LA TARJETA (un servicio con su tabla de precio) QUEDE PARTIDA ENTRE DOS PAGINAS
  private cardSinCortarFilas(card: Content): Content {

    (card as ContentTable).table.dontBreakRows = true;

    return card;

  }

  // RESUMEN DE TOTALES DEL GRUPO (suma de todas las ordenes y adicionales) Y BARRA CON EL TOTAL A FACTURAR
  private buildTotales(grupo: GrupoLiquidacionPdf): Content[] {

    const { totales } = grupo;

    const fila = (label: string, valor: number): TableCell[] => ([
      { text: label.toUpperCase(), style: 'label', margin: [0, 2, 0, 2] },
      { text: this.formatearMoneda(valor), fontSize: 10, color: PALETTE.textDark, alignment: 'right', margin: [0, 2, 0, 2] },
    ]);

    return [
      this.card(PALETTE.navy, ['60%', '40%'], 'Resumen de la liquidación', [
        fila('Costos directos', totales.costosDirectos),
        fila('Seguro de vida', totales.seguroVida),
        fila('AUI', totales.aui),
        fila('Total antes de IVA', totales.precioAntesIva),
        fila('IVA', totales.iva),
      ]),
      this.buildBarraTotal('TOTAL LIQUIDACIÓN', totales.precio),
    ];

  }

  // ===================================================================
  // DOCUMENTO
  // ===================================================================

  private generateGrupoLiquidacionReporte(grupo: GrupoLiquidacionPdf): TDocumentDefinitions {

    return this.documentoBase([
      ...this.buildEncabezado('LIQUIDACIÓN DE SERVICIOS\nVIGILANCIA FÍSICA Y ELECTRÓNICA', [
        { label: 'LIQUIDACIÓN', value: grupo.descripcion },
        { label: 'GRUPO N°', value: grupo.idGrupoLiquidacion.toString() },
      ]),
      this.buildResumen(grupo),
      this.buildCliente(grupo),
      this.buildTituloSeccion('Desglose de servicios liquidados'),
      ...grupo.ordenes.map(orden => this.buildOrden(orden)),
      ...(grupo.adicionales.length ? [this.buildAdicionales(grupo.adicionales)] : []),
      ...this.buildTotales(grupo),
    ]);

  }

  getReporteGrupoLiquidacion(grupo: GrupoLiquidacionPdf) {

    return this.printer.createPdf(this.generateGrupoLiquidacionReporte(grupo));

  }

  async getBufferReporteGrupoLiquidacion(grupo: GrupoLiquidacionPdf) {

    return await this.printer.generatePdf(this.generateGrupoLiquidacionReporte(grupo));

  }

}
