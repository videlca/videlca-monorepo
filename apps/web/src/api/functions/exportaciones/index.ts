import type { GruposLiquidaciones } from "../../types";
import { apiGet } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { TipoDocumento } from "../../dtos/exportaciones";

export const getGruposLiquidacionesExportaciones = async (campo: TipoDocumento, valor: string): Promise<ApiResponse<GruposLiquidaciones[]>> => {
  return await apiGet<GruposLiquidaciones[]>(`/liquidaciones/buscar-por-campo?campo=${campo}&valor=${valor}`);
};