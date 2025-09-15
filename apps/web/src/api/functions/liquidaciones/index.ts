import { apiGet, apiPost } from "../../config";
import type { CrearGrupoMensualDto } from "../../dtos/liquidaciones";
import type { OrdenServicio } from "../../types/orden-servicio";

export const getLiquidacionesPorMes = async (anio: number, mes: number) => {
  return await apiGet<OrdenServicio[]>(`/liquidaciones/ordenes-por-mes?anio=${anio}&mes=${mes}`);
};

export const crearLiquidacionMensual = async (data: CrearGrupoMensualDto) => {
  return await apiPost<OrdenServicio>(`/liquidaciones/grupo/generar-mes`, data);
};