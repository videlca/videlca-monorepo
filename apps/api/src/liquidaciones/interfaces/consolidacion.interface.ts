export type ServicioAgrupado = {
  tipoServicio: string;
  servicioAplicacion: string;
  codigoServicioSiigo: string;
  valorLiquidarAplicacion: number;
  seguroVida: number;
  aui: number;
  tarifaAntesIva: number;
  auiIVa: number;
  tarifaConIva: number;
  cantidadOrdenes: number;
};

export type ClienteAgrupado = {
  cliente: string;
  numeroId: string;
  servicios: Record<number, ServicioAgrupado>;
  totalOrdenes: number;
  totalLiquidacion: number;
};