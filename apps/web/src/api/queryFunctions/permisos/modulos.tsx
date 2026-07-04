import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getModulos } from "../../functions/permisos";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import type { Modulos } from "../../types/permisos";

export const useGetModulos = (): UseQueryResult<
  ApiResponse<PaginatedResponse<Modulos>>,
  Error
> => {
  return useQuery({
    queryKey: ["modulos"],
    queryFn: () => getModulos(),
  });
};
