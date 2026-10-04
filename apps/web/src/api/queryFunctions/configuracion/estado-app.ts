import { getEstadosApp } from "../../functions/configuracion";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { EstadoApp } from "../../types/configuracion";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export const useEstadosApp = (): UseQueryResult<ApiResponse<PaginatedResponse<EstadoApp[]>>, Error> => {
  return useQuery({
    queryKey: ["estados-app"],
    queryFn: () => getEstadosApp(),
  });
};
