import { apiDelete, apiGet, apiPatch, apiPost } from "../../config";
import type { TipoNovedad } from "../../types/personal";
import type { PaginationDto } from "../../dtos/common";
import type { ApiResponse } from "../../types/common";

export const getTipoNovedad = async (pagination: PaginationDto): Promise<ApiResponse<TipoNovedad[]>> => {
  return await apiGet<TipoNovedad[]>("/tipo-novedad", pagination);
};

export const getTipoNovedadById = async (id: number): Promise<ApiResponse<TipoNovedad>> => {
  return await apiGet<TipoNovedad>(`/tipo-novedad/${id}`);
};

export const getTipoNovedadActivo = async (pagination: PaginationDto): Promise<ApiResponse<TipoNovedad[]>> => {
  return await apiGet<TipoNovedad[]>("/tipo-novedad/actives", pagination);
}

export const createTipoNovedad = async (data: { descripcion: string }): Promise<ApiResponse> => {
  return await apiPost<TipoNovedad>("/tipo-novedad", data);
}

export const updateTipoNovedad = async (id: number, data: { descripcion: string }): Promise<ApiResponse> => {
  return await apiPatch<TipoNovedad>(`/tipo-novedad/${id}`, data);
}

export const deleteTipoNovedad = async (id: number): Promise<ApiResponse> => {
  return await apiDelete<TipoNovedad>(`/tipo-novedad/${id}`);
}
