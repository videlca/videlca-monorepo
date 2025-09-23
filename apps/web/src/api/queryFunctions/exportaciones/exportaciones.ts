import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "../../types/common";
import type { GruposLiquidaciones } from "../../types";
import { getGruposLiquidacionesExportaciones } from "../../functions/exportaciones";
import type { FiltroGrupoLiquidacionDto } from "../../dtos/exportaciones";

export const useGetGruposLiquidacionesExportaciones = (params: FiltroGrupoLiquidacionDto) => {
  return useQuery<ApiResponse<GruposLiquidaciones[]>>({
    queryKey: ["grupos-liquidaciones-exportaciones", params.campo, params.valor],
    queryFn: () => getGruposLiquidacionesExportaciones(params),
    enabled: !!params.valor,
  });
};