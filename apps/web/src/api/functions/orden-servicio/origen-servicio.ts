import { apiGet } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { OrigenServicio } from "../../types/orden-servicio";

// Esta tabla solo se ajusta desde el backend (los datos se cargan directamente en la BD),
// por eso unicamente se expone una funcion de consulta
export const getOrigenServicio = async (): Promise<ApiResponse<OrigenServicio[]>> => {
  return await apiGet<OrigenServicio[]>("/origen-servicio");
}
