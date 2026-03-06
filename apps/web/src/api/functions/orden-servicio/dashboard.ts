import type { GetDashboardInicioDto } from "../../dtos";
import type { ApiResponse } from "../../types";
import { apiGet } from "../../config";

export const getDashboardInicio = async (query: GetDashboardInicioDto): Promise<ApiResponse<any>> => {
  return await apiGet<any>(`/orden-servicio/inicio?months=${query.months}`);
};