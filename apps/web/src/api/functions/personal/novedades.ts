import { apiDelete, apiGet, apiPatch } from "../../config";
import type { PaginationDto } from "../../dtos/common";
import type { UpdateNovedadDto } from "../../dtos/personal";
import type { ApiResponse } from "../../types/common";
import type { Novedad } from "../../types/personal";

export const getNovedades = async (pagination: PaginationDto): Promise<ApiResponse<Novedad[]>> => {
  return await apiGet<Novedad[]>("/novedades", pagination);
}

export const getNovedadById = async (id: number): Promise<ApiResponse<Novedad>> => {
  return await apiGet<Novedad>(`/novedades/${id}`);
}

export const updateNovedad = async (id: number, data: UpdateNovedadDto): Promise<ApiResponse> => {
  return await apiPatch<Novedad>(`/novedades/${id}`, data);
}

export const deleteNovedad = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<Novedad>(`/novedades/${id}`);
}
