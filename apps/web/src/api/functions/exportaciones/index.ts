import type { GruposLiquidaciones } from "../../types";
import { apiGet } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { FiltroGrupoLiquidacionDto } from "../../dtos/exportaciones";

export const getGruposLiquidacionesExportaciones = async (params: FiltroGrupoLiquidacionDto): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/liquidaciones/buscar-por-campo?campo=${params.campo}&valor=${params.valor}`);
};