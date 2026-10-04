import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ApiResponse } from "../../types";
import { getDashboardInicio } from "../../functions/orden-servicio/dashboard";
import type { GetDashboardInicioDto, ReportesInicioResponse } from "../../dtos";

export const useGetDashboardInicio = (query: GetDashboardInicioDto): UseQueryResult<ApiResponse<ReportesInicioResponse>, Error> => {
  return useQuery({
    queryKey: ["dashboard-inicio", query.months],
    queryFn: () => getDashboardInicio(query),
  });
};