import { apiGet, apiPost } from "../../config";
import type { CreateNovedadDto } from "../../dtos/personal";
import type { ApiResponse } from "../../types/common";
import type { Novedad } from "../../types/personal";

export const createPersonalNovedad = async (idPersonal: number, data: CreateNovedadDto): Promise<ApiResponse> => {
  return await apiPost<Novedad>(`/personal/${idPersonal}/novedades`, data);
}

// El endpoint devuelve directamente un arreglo de novedades, sin envoltorio de paginación
export const getPersonalNovedad = async (idPersonal: number): Promise<ApiResponse<Novedad[]>> => {
  return await apiGet<Novedad[]>(`/personal/${idPersonal}/novedades`);
}