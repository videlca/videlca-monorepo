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