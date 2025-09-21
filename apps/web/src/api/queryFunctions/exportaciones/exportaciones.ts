import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "../../types/common";
import type { GruposLiquidaciones } from "../../types";
import { getGruposLiquidacionesExportaciones } from "../../functions/exportaciones";
import type { TipoDocumento } from "../../dtos/exportaciones";

export const useGetGruposLiquidacionesExportaciones = (campo: TipoDocumento, valor: string) => {
  return useQuery<ApiResponse<GruposLiquidaciones[]>>({
    queryKey: ["grupos-liquidaciones-exportaciones", campo, valor],
    queryFn: () => getGruposLiquidacionesExportaciones(campo, valor),
    enabled: !!valor,
  });
};