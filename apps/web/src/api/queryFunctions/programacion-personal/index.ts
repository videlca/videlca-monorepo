import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getProgramacionPersonal } from "../../functions/programacion-personal";
import type { ApiResponse, PersonalAsignado } from "../../types";

export const useProgramacionPersonal = (): UseQueryResult<ApiResponse<PersonalAsignado[]>> => {
  return useQuery({
    queryKey: ["programacion-personal"],
    queryFn: () => getProgramacionPersonal({ pagination: false }),
  });
};