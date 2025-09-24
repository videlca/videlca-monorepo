import { apiGet } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { EstadoApp } from "../../types/configuracion";

export const getEstadosApp = async (): Promise<ApiResponse<EstadoApp[]>> => {
  return await apiGet<EstadoApp[]>("/estado-app?pagination");
};