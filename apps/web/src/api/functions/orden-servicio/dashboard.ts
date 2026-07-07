import type { GetDashboardInicioDto, ReportesInicioResponse } from "../../dtos";
import type { ApiResponse } from "../../types";
import { apiGet } from "../../config";

export const getDashboardInicio = async (query: GetDashboardInicioDto): Promise<ApiResponse<ReportesInicioResponse>> => {
  return await apiGet<ReportesInicioResponse>(`/orden-servicio/inicio?months=${query.months}`);
};