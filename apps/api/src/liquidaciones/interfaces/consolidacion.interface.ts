export type ServicioAgrupado = {
  armado: boolean;
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
  id: number;
  cliente: string;
  numeroId: string;
  servicios: Record<number, ServicioAgrupado>;
  totalOrdenes: number;
  totalLiquidarAplicacion: number;
  totalSeguroVida: number;
  totalAui: number;
  totalTarifaAntesIva: number;
  totalIvaAui: number;
  totalTarifaConIva: number;
};