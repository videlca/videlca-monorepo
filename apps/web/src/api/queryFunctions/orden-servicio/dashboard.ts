import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse } from "../../types";
import { getDashboardInicio } from "../../functions/orden-servicio/dashboard";
import type { GetDashboardInicioDto } from "../../dtos";

export const useGetDashboardInicio = (query: GetDashboardInicioDto): UseQueryResult<ApiResponse<any>, Error> => {
  return useQuery({
    queryKey: ["dashboard-inicio"],
    queryFn: () => getDashboardInicio(query),
  });
};