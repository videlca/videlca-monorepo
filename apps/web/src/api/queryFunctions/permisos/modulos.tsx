import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getModulos } from "../../functions/permisos";
import type { ApiResponse } from "../../types/common";
import type { Modulos } from "../../types/permisos";

export const useGetModulos = (): UseQueryResult<
  ApiResponse<Modulos>,
  Error
> => {
  return useQuery({
    queryKey: ["modulos"],
    queryFn: () => getModulos({ pagination: false }),
  });
};
