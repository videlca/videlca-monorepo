import { getEstadosApp } from "../../functions/configuracion";
import type { ApiResponse } from "../../types/common";
import type { EstadoApp } from "../../types/configuracion";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export const useEstadosApp = (enabled: boolean = false): UseQueryResult<ApiResponse<EstadoApp[]>, Error> => {
  return useQuery({
    queryKey: ["estados-app"],
    queryFn: () => getEstadosApp(),
    enabled: enabled,
  });
};
