import { apiGet } from "../../config";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { EstadoApp } from "../../types/configuracion";

export const getEstadosApp = async (): Promise<ApiResponse<PaginatedResponse<EstadoApp[]>>> => {
  return await apiGet<PaginatedResponse<EstadoApp[]>>("/estado-app?pagination=false");
};