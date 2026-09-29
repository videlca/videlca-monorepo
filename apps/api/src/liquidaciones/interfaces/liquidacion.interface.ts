export type LiquidacionServicioAgrupado = {
    ordenServicio: string;
    sector: string;
    ciudad: string;
    puesto: string;
    descripcionServicio: string;
    tipoServicio: string;
    codigoServicioSiigo: string
    horarioServicio: string;

    horasTotalesServicio?: number;
    tarifaCostosDirectos?: number;
    valorHora?: number;
    cantidadHorasPrestadas?: number;
    valorLiquidadoVidelca?: number;

    cantidadOrdenesFacturar: number;
    valorLiquidarAplicacion: number;
    seguroVida: number;
    aui: number;
    tarifaAntesIva: number;
    auiIVa: number;
    tarifaConIva: number;

    // MES AL QUE CORRESPONDE ESTA LIQUIDACION ("MM/YYYY"). Un grupo puede incluir meses anteriores pendientes, asi que
    // no siempre coincide con el mes del grupo (y una misma orden puede salir una vez por cada mes liquidado)
    mesLiquidado?: string;
};

export type LiquidacionClienteAgrupado = {
  id: number;
  cliente: string;
  numeroId: string;
  totalLiquidarAplicacion: number;
  totalSeguroVida: number;
  totalAui: number;
  totalTarifaAntesIva: number;
  totalIvaAui: number;
  totalTarifaConIva: number;
  servicios: LiquidacionServicioAgrupado[];
};