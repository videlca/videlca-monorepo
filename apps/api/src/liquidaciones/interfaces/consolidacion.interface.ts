export type ServicioAgrupado = {
  armado: boolean;
  // true si esta linea es de un Adicional (no de un servicio del catalogo): no tiene tipo armado/monitoreo real
  // (armado siempre queda en false) ni codigo Siigo, se debe excluir de exports que requieran un codigo Siigo valido
  esAdicional: boolean;
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