import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getProgramacionPersonal } from "../../functions/programacion-personal";
import type { ApiResponse } from "../../types";

export const useProgramacionPersonal = (): UseQueryResult<ApiResponse<any[]>> => {
  return useQuery({
    queryKey: ["programacion-personal"],
    queryFn: () => getProgramacionPersonal({ pagination: false }),
  });
};