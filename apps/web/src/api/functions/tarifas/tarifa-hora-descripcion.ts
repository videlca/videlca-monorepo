import { apiGet } from "../../config";
import type { ApiResponse } from "../../types/common";
import type { TarifaHoraDescripcion } from "../../types/periodo";

// Catalogo fijo de 4 categorias (diurna, diurna dominical/festiva, nocturna, nocturna dominical/festiva).
// Solo se ajusta desde el backend, por eso unicamente se exponen rutas de lectura.
export const getTarifasHoraDescripcion = async (): Promise<ApiResponse<TarifaHoraDescripcion[]>> => {
  return await apiGet<TarifaHoraDescripcion[]>("/tarifa-hora-descripcion");
};

export const getTarifaHoraDescripcionById = async (id: number): Promise<ApiResponse<TarifaHoraDescripcion>> => {
  return await apiGet<TarifaHoraDescripcion>(`/tarifa-hora-descripcion/${id}`);
};
