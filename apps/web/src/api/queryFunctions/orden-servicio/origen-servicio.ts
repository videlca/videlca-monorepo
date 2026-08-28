import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getOrigenServicio } from "../../functions/orden-servicio/origen-servicio";
import type { ApiResponse } from "../../types/common";
import type { OrigenServicio } from "../../types/orden-servicio";

export const useGetOrigenServicio = (): UseQueryResult<ApiResponse<OrigenServicio[]>, Error> => {
  return useQuery({
    queryKey: ["origen-servicio"],
    queryFn: getOrigenServicio,
  });
}
