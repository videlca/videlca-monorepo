import type { OrdenServicio } from "./orden-servicio";


export interface GruposLiquidaciones {
  idGrupoLiquidacion: number;
  estado: boolean;
  total: number;
  descripcion: string;
  fechaCreacion: string;
  consolidacion_orden: boolean;
  generacion_interfase: boolean;
  generacion_anexo: boolean;
  liquidaciones: Liquidaciones[];
}

export interface Liquidaciones {
  idLiquidacion: number;
  valor_liquidacion: number;
  fechaCreacion: string;
  idServicioOrden: number;
  ordenServicio: OrdenServicio;
  idGrupoLiquidacion: number;
  estado: boolean;
  grupo: GruposLiquidaciones;
  aniomes_liquidacion: string;
}
