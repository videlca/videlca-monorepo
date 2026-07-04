import { apiGet, apiPost } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { CreateNovedadDto } from "../../dtos/personal";
import type { ApiResponse , PaginatedResponse } from "../../types/common";
import type { Novedad } from "../../types/personal";

export const createPersonalNovedad = async (idPersonal: number, data: CreateNovedadDto): Promise<ApiResponse> => {
  return await apiPost<Novedad>(`/personal/${idPersonal}/novedades`, data);
}

export const getPersonalNovedad = async (idPersonal: number, pagination: PaginationDto): Promise<ApiResponse<PaginatedResponse<Novedad[]>>> => {
  return await apiGet<PaginatedResponse<Novedad[]>>(`/personal/${idPersonal}/novedades`, pagination);
}