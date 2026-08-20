import { Injectable, Logger } from '@nestjs/common';
import { TDocumentDefinitions, Content, ContentTable, TableCell } from 'pdfmake/interfaces';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { PrinterService } from '../../common/services';

import { OrdenServicio } from '../../orden-servicio/entities';
import { OrdenServicioTarifa } from '../../orden-servicio/entities';
import { CostoHoraOrdenServicioTarifa } from '../../orden-servicio/entities';

// ===================================================================
// PALETA DE COLORES
// Un unico color base (azul oscuro corporativo) para todas las secciones generales.
// El azul claro se reserva para donde se desglosan los servicios, y el gris claro para el desglose por horas.
// ===================================================================
const PALETTE = {
  textDark: '#0F172A',
  textMuted: '#64748B',
  white: '#FFFFFF',

  headerFrom: '#12283F', // azul oscuro profundo
  headerTo: '#1D3F66',   // azul oscuro, un poco mas claro para dar sutil profundidad al degradado

  // Azul oscuro: Cliente, Puesto, Facturacion, Desglose de precio (secciones generales)
  navy: { accent: '#1E3A5F', tint: '#EDF1F6' },

  // Azul claro: donde se desglosan los servicios (Servicios asociados y su tabla de precio individual)
  servicios: { accent: '#4A7CB0', tint: '#E7F0F9' },

  // Gris claro: desglose hora a hora (horario mixto)
  costosHoras: { accent: '#94A3B8', tint: '#F1F5F9' },
};

const ESTADO_COLOR: Record<string, string> = {
  'programado': '#6366F1',
  'por iniciar': '#F59E0B',
  'iniciado': '#10B981',
  'por terminar': '#FB923C',
  'terminado': '#64748B',
  'cancelada': '#F43F5E',
  'anulada': '#DC2626',
};

interface CardTheme {
  accent: string;
  tint: string;
}

@Injectable()
export class ReporteOrdenServicioService {

  private readonly logger = new Logger('ReporteOrdenServicioService');

  constructor(
    private readonly printer: PrinterService,
  ) {}

  // ===================================================================
  // HELPERS DE FORMATO
  // ===================================================================

  private normalizarFecha(fecha: Date | string | null): Date | null {

    if (!fecha) return null;

    const fechaSplit = new Date(fecha).toISOString().split('T')[0];

    const [año, mes, dia] = fechaSplit.split('-').map(Number);

    return new Date(año, mes - 1, dia);

  }

  private formatearFechaCorta(fecha: Date | string | null): string {

    const fechaNormalizada = this.normalizarFecha(fecha);

    if (!fechaNormalizada) return '-';

    return format(fechaNormalizada, 'dd/MM/yyyy', { locale: es });

  }

  private formatearMoneda(valor: number | string | null | undefined): string {

    if (valor == null) return '-';

    const numero = Number(valor);

    if (Number.isNaN(numero)) return '-';

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero);

  }

  private colorEstado(nombreEstado: string): string {

    return ESTADO_COLOR[nombreEstado?.toLowerCase()] ?? PALETTE.textMuted;

  }

  // ===================================================================
  // HELPERS DE ESTILO / MAQUETACION
  // ===================================================================

  private hexToRgb(hex: string) {

    const clean = hex.replace('#', '');

    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };

  }

  private rgbToHex(r: number, g: number, b: number): string {

    const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  }

  // Genera franjas verticales con color interpolado, para simular un degradado (pdfmake no soporta gradientes nativos)
  private buildGradientRects(x: number, y: number, width: number, height: number, colorFrom: string, colorTo: string, steps = 48) {

    const from = this.hexToRgb(colorFrom);
    const to = this.hexToRgb(colorTo);
    const stepWidth = width / steps;

    const rects = [];

    for (let i = 0; i < steps; i++) {

      const t = steps === 1 ? 0 : i / (steps - 1);

      rects.push({
        type: 'rect' as const,
        x: x + (i * stepWidth),
        y,
        w: stepWidth + 0.6, // pequeño solape para que no se noten lineas entre franjas
        h: height,
        color: this.rgbToHex(
          from.r + (to.r - from.r) * t,
          from.g + (to.g - from.g) * t,
          from.b + (to.b - from.b) * t,
        ),
      });

    }

    return rects;

  }

  // Layout de "tarjeta": fila 0 con el color solido de acento (encabezado), resto del cuerpo con un tinte suave
  private cardLayout(theme: CardTheme) {

    return {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? theme.accent : theme.tint),
      hLineColor: () => '#ffffff',
      vLineColor: () => '#ffffff',
      hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 0 : 1),
      vLineWidth: () => 0,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 7,
      paddingBottom: () => 7,
    };

  }

  private cardHeaderCell(titulo: string, colSpan: number): TableCell {

    return {
      text: titulo.toUpperCase(),
      colSpan,
      color: PALETTE.white,
      bold: true,
      fontSize: 11,
      characterSpacing: 0.4,
    };

  }

  private fillEmptyCells(n: number): TableCell[] {

    return Array.from({ length: n }, () => ({ text: '' }));

  }

  private labelValue(label: string, value: string): Content {

    return {
      stack: [
        { text: label.toUpperCase(), style: 'label' },
        { text: value || '-', style: 'value' },
      ],
    };

  }

  // Nota: fillColor en un nodo dentro de un "stack" no lo respeta pdfmake de forma confiable al renderizar
  // (probado: una mini tabla anidada dentro del stack tampoco pinta el fondo). Por eso el estado se muestra
  // como texto en el color del estado (mismo patron que "Dominical/Festivo" en el desglose por horas), sin pastilla de fondo
  private textoEstado(texto: string, color: string): Content {

    return { text: texto.toUpperCase(), color, bold: true, fontSize: 12, margin: [0, 3, 0, 0] };

  }

  // Tarjeta generica: [ [header (colSpan=widths.length)], ...filas ]
  private card(theme: CardTheme, widths: (string | number)[], titulo: string, filas: TableCell[][]): Content {

    return {
      margin: [0, 0, 0, 14],
      table: {
        widths,
        body: [
          [this.cardHeaderCell(titulo, widths.length), ...this.fillEmptyCells(widths.length - 1)],
          ...filas,
        ],
      },
      layout: this.cardLayout(theme),
    };

  }

  // ===================================================================
  // SECCIONES
  // ===================================================================

  private buildHeader(ordenServicio: OrdenServicio): Content[] {

    // Suficiente para: fila logo/codigo + titulo de 2 lineas, con margen de sobra para no invadir el area blanca
    // (el texto del titulo es blanco, si el bloque de flujo se sale de esta franja el texto queda invisible sobre blanco)
    const headerHeight = 135;

    return [

      // FONDO: degradado en tonos de azul oscuro (sin franjas de otros colores)
      {
        canvas: this.buildGradientRects(0, 0, 535, headerHeight, PALETTE.headerFrom, PALETTE.headerTo),
        absolutePosition: { x: 40, y: 40 },
      },

      // FRANJA SUPERIOR: logo a la izquierda, codigo/orden a la derecha
      {
        margin: [0, 10, 0, 0],
        table: {
          widths: ['20%', '80%'],
          body: [
            [
              {
                image: 'logo',
                width: 42,
                alignment: 'left',
              },
              {
                stack: [
                  { text: 'CÓDIGO', color: '#B9C7DA', fontSize: 8, bold: true },
                  { text: ordenServicio.ordenServicioId.descripcionId, color: PALETTE.white, fontSize: 12, bold: true },
                  { text: 'ORDEN N°', color: '#B9C7DA', fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
                  { text: ordenServicio.ordenServicioId.consecutivo.toString(), color: PALETTE.white, fontSize: 12, bold: true },
                ],
                alignment: 'right',
              },
            ],
          ],
        },
        layout: 'noBorders',
      },

      // TITULO: centrado en el ancho completo de la pagina (no relativo a la columna del logo)
      {
        margin: [0, 16, 0, 0],
        table: {
          widths: [535],
          body: [
            [
              {
                text: 'ORDEN DE SERVICIO\nVIGILANCIA FÍSICA Y ELECTRÓNICA',
                color: PALETTE.white,
                bold: true,
                fontSize: 16,
                lineHeight: 1.3,
                alignment: 'center',
              },
            ],
          ],
        },
        layout: 'noBorders',
      },

      { text: '\n' },

    ];

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

    const cliente = ordenServicio.idLocacion.idCliente;

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

    const locacion = ordenServicio.idLocacion;
    const responsable = locacion.idClienteFacturacion ?? locacion.idCliente;

    return this.card(PALETTE.navy, ['50%', '50%'], 'Responsable de facturación', [
      [
        this.labelValue('Nombre', responsable.nombre),
        this.labelValue('Identificación', responsable.numeroIdentificacion),
      ],
    ]);

  }

  private buildServicios(ordenServicio: OrdenServicio): Content {

    const filas: TableCell[][] = [
      [
        { text: 'SERVICIO', style: 'label' },
        { text: 'HORARIO', style: 'label' },
        { text: 'PERSONAL', style: 'label' },
        { text: 'TARIFA', style: 'label' },
      ],
    ];

    ordenServicio.tarifas.forEach((servicioOrden, index) => {

      const servicio = servicioOrden.idServicio;

      filas.push([
        { text: `${index + 1}. ${servicio.descripcion}\n`, bold: true, fontSize: 9.5, color: PALETTE.textDark,
          margin: [0, 4, 0, 0],
        },
        { text: `${servicioOrden.horaInicio} - ${servicioOrden.horaFin}`, margin: [0, 4, 0, 0] },
        { text: servicioOrden.cantidadPersonal?.toString() ?? '0', margin: [0, 4, 0, 0] },
        { text: servicio.idTipoTarifa?.nombre ?? '-', margin: [0, 4, 0, 0] },
      ]);

      filas.push([
        { text: `Código: ${servicio.codigo}`, colSpan: 4, fontSize: 8, italics: true, color: PALETTE.textMuted, margin: [0, 0, 0, 4] },
        { text: '' }, { text: '' }, { text: '' },
      ]);

    });

    return this.card(PALETTE.servicios, ['34%', '26%', '16%', '24%'], 'Servicios asociados', filas);

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

  private buildTablaPrecioServicio(servicioOrden: OrdenServicioTarifa): ContentTable {

    return {
      margin: [0, 4, 0, 4],
      table: {
        widths: ['*', '*', '*', '*', '*', '*'],
        body: [
          [
            { text: 'C. DIRECTOS', style: 'miniLabel' },
            { text: 'SEGURO VIDA', style: 'miniLabel' },
            { text: 'AUI', style: 'miniLabel' },
            { text: 'ANTES IVA', style: 'miniLabel' },
            { text: 'IVA', style: 'miniLabel' },
            { text: 'TOTAL', style: 'miniLabel' },
          ],
          [
            { text: this.formatearMoneda(servicioOrden.costosDirectos), fontSize: 9 },
            { text: this.formatearMoneda(servicioOrden.seguroVida), fontSize: 9 },
            { text: this.formatearMoneda(servicioOrden.aui), fontSize: 9 },
            { text: this.formatearMoneda(servicioOrden.precioAntesIva), fontSize: 9 },
            { text: this.formatearMoneda(servicioOrden.iva), fontSize: 9 },
            { text: this.formatearMoneda(servicioOrden.precio), fontSize: 9.5, bold: true, color: PALETTE.navy.accent },
          ],
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? PALETTE.servicios.tint : null),
        hLineColor: () => '#C7DCF0',
        vLineColor: () => '#C7DCF0',
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    };

  }

  private buildTablaCostosHoras(costosHoras: CostoHoraOrdenServicioTarifa[]): ContentTable {

    const filas = [...costosHoras]
      .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))
      .map(segmento => ([
        { text: this.formatearFechaCorta(segmento.fecha), fontSize: 7.5 },
        { text: `${segmento.horaInicio} - ${segmento.horaFin}`, fontSize: 7.5 },
        { text: segmento.tipoHorario === 'diurno' ? 'Diurno' : 'Nocturno', fontSize: 7.5 },
        { text: segmento.dominical ? 'Dominical/Festivo' : 'Ordinario', fontSize: 7.5, color: segmento.dominical ? '#DC2626' : PALETTE.textDark },
        { text: Number(segmento.horas).toString(), fontSize: 7.5, alignment: 'center' },
        { text: this.formatearMoneda(segmento.costosDirectos), fontSize: 7.5 },
        { text: this.formatearMoneda(segmento.seguroVida), fontSize: 7.5 },
        { text: this.formatearMoneda(segmento.aui), fontSize: 7.5 },
      ]));

    return {
      margin: [0, 2, 0, 8],
      table: {
        headerRows: 1,
        widths: ['12%', '15%', '10%', '17%', '8%', '13%', '13%', '12%'],
        body: [
          [
            { text: 'FECHA', style: 'miniLabel', fontSize: 7 },
            { text: 'HORARIO', style: 'miniLabel', fontSize: 7 },
            { text: 'TIPO', style: 'miniLabel', fontSize: 7 },
            { text: 'DÍA', style: 'miniLabel', fontSize: 7 },
            { text: 'HORAS', style: 'miniLabel', fontSize: 7 },
            { text: 'C. DIRECTOS', style: 'miniLabel', fontSize: 7 },
            { text: 'SEGURO VIDA', style: 'miniLabel', fontSize: 7 },
            { text: 'AUI', style: 'miniLabel', fontSize: 7 },
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

    contenido.push({
      margin: [0, 0, 0, 8],
      table: {
        widths: ['100%'],
        body: [[this.cardHeaderCell('Desglose de precio', 1)]],
      },
      layout: {
        fillColor: () => PALETTE.navy.accent,
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: () => 7,
        paddingBottom: () => 7,
      },
    });

    if (!ordenServicio.fechaFin) {

      contenido.push(this.buildMensajeOrdenIndefinida());

      return contenido;

    }

    for (const servicioOrden of ordenServicio.tarifas) {

      contenido.push({
        text: servicioOrden.idServicio.descripcion,
        bold: true,
        fontSize: 10,
        color: PALETTE.textDark,
        margin: [0, 6, 0, 0],
      });

      contenido.push(this.buildTablaPrecioServicio(servicioOrden));

      if (servicioOrden.costosHoras && servicioOrden.costosHoras.length > 0) {

        contenido.push({
          text: 'Desglose por horas (horario mixto)',
          fontSize: 8.5,
          italics: true,
          color: PALETTE.textMuted,
          margin: [0, 2, 0, 2],
        });

        contenido.push(this.buildTablaCostosHoras(servicioOrden.costosHoras));

      }

    }

    contenido.push({
      margin: [0, 8, 0, 14],
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'TOTAL ORDEN DE SERVICIO', bold: true, fontSize: 12, color: PALETTE.white, margin: [4, 8, 0, 8] },
            { text: this.formatearMoneda(ordenServicio.precioTotal), bold: true, fontSize: 14, color: PALETTE.white, alignment: 'right', margin: [0, 6, 4, 6] },
          ],
        ],
      },
      layout: {
        fillColor: () => PALETTE.navy.accent,
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
    });

    return contenido;

  }

  // ===================================================================
  // DOCUMENTO
  // ===================================================================

  private generateOrdenServicioReporte(ordenServicio: OrdenServicio): TDocumentDefinitions {

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 55],

      content: [
        ...this.buildHeader(ordenServicio),
        this.buildResumenFechas(ordenServicio),
        this.buildCliente(ordenServicio),
        this.buildPuesto(ordenServicio),
        this.buildFacturacion(ordenServicio),
        this.buildServicios(ordenServicio),
        ...this.buildDesglosePrecios(ordenServicio),
      ],

      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: 'GEVID · Videlca Ltda. - Seguridad Física y Electrónica', fontSize: 8, color: PALETTE.textMuted, margin: [40, 0, 0, 0] },
          { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: PALETTE.textMuted, alignment: 'right', margin: [0, 0, 40, 0] },
        ],
      }),

      styles: {
        label: { fontSize: 8, bold: true, color: PALETTE.textMuted },
        value: { fontSize: 10, color: PALETTE.textDark, margin: [0, 2, 0, 0] },
        miniLabel: { fontSize: 8, bold: true, color: PALETTE.textDark },
      },

      defaultStyle: {
        fontSize: 9.5,
        color: PALETTE.textDark,
      },

      images: {
        logo: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADgCAMAAADCMfHtAAABLFBMVEX\/\/\/\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`
      },

    };

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
