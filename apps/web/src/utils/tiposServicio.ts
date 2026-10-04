import type { TipoServicioFiltro } from "../api/types/liquidaciones";

export const TIPOS_SERVICIO_FILTRO: TipoServicioFiltro[] = ["monitoreo", "vigilancia"];

export const serializarTiposServicio = (tipos: TipoServicioFiltro[]): string =>
  TIPOS_SERVICIO_FILTRO.filter((tipo) => tipos.includes(tipo)).join(",");
