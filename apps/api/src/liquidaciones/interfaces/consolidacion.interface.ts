// CENTRO/SUBCENTRO DE COSTOS SIIGO FIJO DE LAS ORDENES DE MONITOREO DE ALARMAS (no dependen de la ciudad)
export const CENTRO_COSTOS_MONITOREO = { centroCostos: 20, subCentroCostos: 10 };

export type ServicioAgrupado = {
  // true si el tipo de servicio es "Monitoreo de alarmas"; false si es "Vigilancia y escolta" (en los reportes se
  // muestra como "Armado"). Sale del tipo de servicio, NO del campo armado del servicio
  esMonitoreo: boolean;
  // true si esta linea es de un Adicional (no de un servicio del catalogo): no tiene tipo armado/monitoreo real
  // (esMonitoreo siempre queda en false). Su codigo Siigo sale del tipo de adicional
  esAdicional: boolean;
  servicioAplicacion: string;
  codigoServicioSiigo: string;
  // Centro/subcentro de costos Siigo de la interfase (ver LiquidacionesService.obtenerCentroCostos). null si no se pudo
  // determinar: en ese caso erroresCentroCostos dice por que y la interfase no se genera
  centroCostos: number | null;
  subCentroCostos: number | null;
  erroresCentroCostos: string[];
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
  // Clave: id del servicio (o "a" + id del tipo de adicional) + centro y subcentro de costos
  servicios: Record<string, ServicioAgrupado>;
  totalOrdenes: number;
  totalLiquidarAplicacion: number;
  totalSeguroVida: number;
  totalAui: number;
  totalTarifaAntesIva: number;
  totalIvaAui: number;
  totalTarifaConIva: number;
};